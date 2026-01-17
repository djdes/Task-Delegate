import nodemailer from "nodemailer";
import path from "path";

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

export async function sendTaskCompletedEmail(taskTitle: string, workerName: string, photoUrl?: string | null) {
  try {
    const mailOptions: nodemailer.SendMailOptions = {
      from: '"Task-Delegate" <admin@yesbeat.ru>',
      to: ADMIN_EMAIL,
      subject: `${taskTitle} - ${workerName}`,
      text: "",
    };

    // Если есть фото, прикрепляем его к письму
    if (photoUrl) {
      const photoPath = path.join(process.cwd(), photoUrl);
      mailOptions.attachments = [
        {
          filename: path.basename(photoUrl),
          path: photoPath,
        },
      ];
    }

    await transporter.sendMail(mailOptions);
    console.log(`Email sent: ${taskTitle} - ${workerName}${photoUrl ? ' (with photo)' : ''}`);
  } catch (error) {
    console.error("Error sending email:", error);
  }
}
