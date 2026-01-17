import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "admin@yesbeat.ru",
    pass: "vsyc csjb evlz tcrk",
  },
});

const ADMIN_EMAIL = "bugdenes@gmail.com";

export async function sendTaskCompletedEmail(taskTitle: string, workerName: string) {
  try {
    await transporter.sendMail({
      from: '"Task-Delegate" <admin@yesbeat.ru>',
      to: ADMIN_EMAIL,
      subject: `${taskTitle} - ${workerName}`,
      text: "",
    });
    console.log(`Email sent: ${taskTitle} - ${workerName}`);
  } catch (error) {
    console.error("Error sending email:", error);
  }
}
