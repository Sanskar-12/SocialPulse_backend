import nodeMailer from "nodemailer";

export const sendEmail = async (options) => {
  const transporter = nodeMailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: "d0262418afb1f6",
      pass: "f734590cf4d3f2",
    },
  });

  const mailOptions={
    from: process.env.SMPT_MAIL,
    to: options.email,
    subject: options.subject,
    text: options.message,
  }

  await transporter.sendMail(mailOptions)
};
