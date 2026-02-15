class Mailer {
  constructor({ subject, recipients }, content) {
    this.subject = subject;
    this.recipients = recipients;
    this.content = content;
  }

  async send() {
    console.log("=== Simulated Email ===");
    console.log("Subject:", this.subject);
    console.log("To:", this.recipients.map(r => r.email));
    console.log("Content:", this.content);
    console.log("=======================");
    return { status: "Email simulated successfully" };
  }
}

module.exports = Mailer;
