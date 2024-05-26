import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "path";

const envPath = path.resolve(__dirname, "../../.env");
dotenv.config({ path: envPath });

const email = process.env.SEND_EMAIL_FROM;
const password = process.env.EMAIL_GENERATED_PASSWORD;

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: email,
    pass: password,
  },
});

export const sendForgotPasswordEmail = async (emailTo: string, token: string) => {
  try {
    let msg = await transporter.sendMail({
      from: `shadNFT <${email}>`,
      to: emailTo,
      subject: "Token for forgot password",
      text: "New Lead",
      html: `<div style="text-align:left;max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border-radius: 5px; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);">
<p>
Dear User
</p>
<p>
I hope this email finds you well. We are reaching out to you regarding a recent action on your shad NFT account. If you want to reset your password, we kindly request you to click on the below button:</p>
<div>
<a href="http://localhost:3000/reset-password/?token=${token}" style="text-decoration: none; color: white;">
<button style="background-color: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 5px;">
Reset Password
</button>
</a>
</div>
<div>
Validity: 10 minutes
</div>
<p>This token is required to ensure the security and authenticity of your account. Please do not share this token with anyone, as it is for your personal use only.</p>
<p>If you did not initiate this action or require any assistance, please do not hesitate to contact our support team at support@hashhive.com. We take your account security seriously and are here to help you with any concerns you may have.</p>
<p>Thank you for being a valued member of Vault Gate.</p>
</br>
Best regards,
</br>
</br>
<div>shad NFT Support Team
</div>
<div>
support@hashhive.com
</div>

</div>`,
    });
    console.log("Message sent: %s", msg);
    return msg;
  } catch (error) {
    console.log(error);
  }
};

export const sendTransactionVerificationEmail = async (
  emailTo: string,
  txHash: string
) => {
  try {
    let msg = await transporter.sendMail({
      from: `shadNFT <${email}>`,
      to: emailTo,
      subject: "Transaction verification success mail",
      text: "New Lead",
      html: `<div style="text-align:left;max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border-radius: 5px; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);">
<p>
Dear User
</p>
<p>
I hope this email finds you well. We are reaching out to inform you that your tyransaction ${txHash} is verified:</p>
<div>
</div>
<div>
</div>
<p>Thank you for being a valued member of shadNFT.</p>
</br>
Best regards,
</br>
</br>
<div>shad NFT Support Team
</div>
<div>
support@hashhive.com
</div>

</div>`,
    });
    console.log("Message sent: %s", msg);
    return msg;
  } catch (error) {
    console.log(error);
  }
};

export const sendSubscriptionExpirationReminder = async (
  emailTo: string,
  message: string
) => {
  try {
    let msg = await transporter.sendMail({
      from: `shadNFT <${email}>`,
      to: emailTo,
      subject: "Subscription Renewal Reminder",
      text: "New Lead",
      html: `<div style="text-align:left;max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border-radius: 5px; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);">
<p>
Dear User
</p>
<p>
${message}
Please update your plan.
<div>
</div>
<div>
</div>
<p>Thank you for being a valued member of shadNFT.</p>
</br>
Best regards,
</br>
</br>
<div>shad NFT Support Team
</div>
<div>
support@hashhive.com
</div>

</div>`,
    });
    console.log("Message sent: %s", msg);
    return msg;
  } catch (error) {
    console.log(error);
  }
};
