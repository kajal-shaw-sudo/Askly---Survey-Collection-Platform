const _ = require('lodash');
const { Path } = require('path-parser');
const { URL } = require('url');
const mongoose = require('mongoose');
const requireLogin = require('../middlewares/requireLogin');
const requireCredits = require('../middlewares/requireCredits');
const Mailer = require('../services/Mailer');
const surveyTemplate = require('../services/emailTemplates/surveyTemplate');

const Survey = mongoose.model('surveys');
const User = mongoose.model('users');

module.exports = app => {
    app.get('/api/surveys', requireLogin, async (req, res) => {
        const surveys = await Survey.find({ _user: req.user.id }).select({ 
            recipients: false 
        });

        res.send(surveys);
    });

    app.get('/api/surveys/:surveyId/:choice', (req, res) => {
        res.send('Thanks for voting!');
    });

    app.post('/api/surveys/webhooks', (req, res) => {
        console.log('Webhook received:', req.body);
        const p = new Path('/api/surveys/:surveyId/:choice');

        _.chain(req.body)
        .map(({ email, url }) => {
            const match = p.test(new URL(url).pathname);
            if (match) {
                return { email, surveyId: match.surveyId, choice: match.choice };
            }
        })
        .compact()
        .uniqBy('email', 'surveyId')
        .each(({ surveyId, email, choice }) => {
            Survey.updateOne({
                _id: surveyId,
                recipients: {
                    $elemMatch: { email: email, responded: false }
                }
            }, {
                    $inc: { [choice]: 1 },
                    $set: { 'recipients.$.responded': true },
                    lastResponded: new Date()
                }).exec();
        })
        .value();

        res.send({});
    });

    app.post('/api/surveys', requireLogin, requireCredits, async (req, res) => {
        const { title, subject, body, recipients } = req.body;

        const survey = new Survey({
            title,
            subject,
            body,
            recipients: recipients.split(',').map(email =>  ({ email: email.trim() })),
            _user: req.user.id,
            dateSent: Date.now()
        });

        // great place to send an email
        const mailer = new Mailer(survey, surveyTemplate(survey));

        try {
            const user = await User.findOneAndUpdate(
                { _id: req.user.id, credits: { $gte: 1 } },
                { $inc: { credits: -1 } },
                { new: true }
            );

            if (!user) {
                return res.status(402).send({ error: 'Not enough credits' });
            }

            try {
                await mailer.send();
                await survey.save();
            } catch (err) {
                // give the credit back if sending or saving failed
                await User.updateOne({ _id: req.user.id }, { $inc: { credits: 1 } });
                return res.status(422).send(err);
            }

            res.send(user);
        } catch (err) {
            res.status(422).send(err);
        }
    });
};