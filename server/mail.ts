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

export async function sendTaskCompletedEmail(taskTitle: string, workerName: string, photoUrls?: string[] | null) {
  try {
    const mailOptions: nodemailer.SendMailOptions = {
      from: '"Task-Delegate" <admin@yesbeat.ru>',
      to: ADMIN_EMAIL,
      subject: `${taskTitle} - ${workerName}`,
      text: "",
    };

    // Если есть фото, прикрепляем их к письму
    if (photoUrls && photoUrls.length > 0) {
      mailOptions.attachments = photoUrls.map((photoUrl, index) => ({
        filename: `photo-${index + 1}${path.extname(photoUrl) || '.jpg'}`,
        path: path.join(process.cwd(), photoUrl),
      }));
    }

    await transporter.sendMail(mailOptions);
    const photoCount = photoUrls?.length || 0;
    console.log(`Email sent: ${taskTitle} - ${workerName}${photoCount > 0 ? ` (with ${photoCount} photo${photoCount > 1 ? 's' : ''})` : ''}`);
  } catch (error) {
    console.error("Error sending email:", error);
  }
}
