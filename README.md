# Askly: Credit-Based Survey Platform

A full-stack survey app where users sign in with Google, buy credits through Stripe, and spend one credit to send a survey to a list of recipients.

**Live demo:** https://product-survey-khn7.onrender.com/
(The backend runs on Render's free tier, so the first request after a period of inactivity can take up to a minute while the server wakes up.)

> **Note:** Email delivery is **simulated**. The mailer logs the email to the server console instead of sending it, because Render's free plan blocks outbound SMTP and the free email-provider credits ran out.

## ✨ Features

- 🔐 **Google sign-in** with Passport.js (OAuth 2.0) and cookie-based sessions
- 💳 **Credit purchases** through Stripe Checkout ($5 for 5 credits)
- 📝 **Survey creation:** a title, subject, one question, and a comma-separated list of recipients
- 🔒 **Atomic credit deduction:** one credit is deducted with a conditional MongoDB update, and it is refunded automatically if sending or saving fails
- 📋 **Survey list:** users see the surveys they have sent
- ✉️ **Email template** with Yes and No links per survey (delivery simulated, see note above)
- 🗳️ **Vote recording:** a webhook endpoint counts each recipient's first answer only (`responded` flag)
- 📱 **Responsive UI** built with Materialize

## 🛠️ Tech Stack

**Frontend:** React, Redux (redux-thunk, redux-form), React Router, Materialize CSS, Axios, react-stripe-checkout
**Backend:** Node.js, Express, Mongoose
**Auth:** Passport.js (Google OAuth 2.0), cookie-session
**Payments:** Stripe
**Database:** MongoDB Atlas
**Deployment:** Render

## ⚙️ How It Works

1. A user signs in with Google; a user record with `credits: 0` is created.
2. The user buys credits through Stripe Checkout; the server charges the card and adds 5 credits.
3. The user creates a survey with one question and a list of recipient emails.
4. The server deducts one credit atomically, then builds the email (simulated) and saves the survey. If either step fails, the credit is refunded.
5. A recipient's Yes or No click would reach the webhook, which increments that choice and marks the recipient as responded, so a second answer is ignored.

## 🗂️ Data Models

```
User   { googleId, credits }
Survey { title, subject, body, recipients: [{ email, responded }], yes, no, _user, dateSent, lastResponded }
```

## 🔒 Security Notes

- Secrets are read from environment variables in production.
- Survey and billing routes require a logged-in user.
- Credit deduction is atomic: `findOneAndUpdate` with `credits >= 1`, so two concurrent requests cannot spend the same credit.

## 🚧 Known Limitations

- Email delivery is simulated, so recipients never receive anything. Because votes are recorded only when the webhook receives click events, the Yes/No counts stay at zero in the live demo.
- There is no analytics dashboard; survey results are stored on the survey document only.
- Each survey has a single Yes/No question.
- The webhook does not verify the sender's signature.
- Stripe is integrated through the legacy Charges API.
- There are no automated tests.

## 🚀 Getting Started

### Prerequisites

- Node.js 18 or higher
- A MongoDB Atlas cluster (or local MongoDB)
- Google OAuth credentials
- Stripe test keys

### Installation

```bash
git clone https://github.com/kajal-shaw-sudo/Askly---Survey-Collection-Platform.git
cd Askly---Survey-Collection-Platform
npm install
cd client
npm install
cd ..
```

### Configuration

Production reads these environment variables (see `config/prod.js`):

```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
MONGO_URI=your_mongodb_connection_string
COOKIE_KEY=any_long_random_string
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
REDIRECT_DOMAIN=http://localhost:3000
```

For local development, create `config/dev.js` exporting the same keys (it is git-ignored):

```js
module.exports = {
  googleClientID: 'your_google_client_id',
  googleClientSecret: 'your_google_client_secret',
  mongoURI: 'your_mongodb_connection_string',
  cookieKey: 'any_long_random_string',
  stripePublishableKey: 'your_stripe_publishable_key',
  stripeSecretKey: 'your_stripe_secret_key',
  redirectDomain: 'http://localhost:3000'
};
```

Add `http://localhost:5000/auth/google/callback` as an authorized redirect URI in your Google Cloud OAuth client.

### Running Locally

```bash
npm run dev
```

(Runs the API and the React client together. Check the scripts in `package.json` if your setup differs.)

## 📂 Project Structure

```
├── client/          # React app (Redux, Stripe checkout, survey forms)
├── config/          # keys.js picks dev or prod credentials
├── middlewares/     # requireLogin, requireCredits
├── models/          # User, Survey, Recipient
├── routes/          # auth, billing and survey routes
├── services/        # Passport strategy, simulated mailer, email template
└── index.js         # Express entry point
```

## 🌐 Deployment

Deployed on Render as a single web service. The `render-postbuild` script builds the React client, and Express serves it. Add the environment variables above in Render's Environment settings.

## 👩‍💻 Author

**Kajal Shaw**: [GitHub](https://github.com/kajal-shaw-sudo)
