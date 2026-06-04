import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const mail_verifyAccountOTP = async (
  email: string,
  otp: string,
  otpExpMin: number,
) => {
  try {
    const mailOptions = {
      from: `"Nashwa Team" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verify your Nashwa account",
      html: `
        <div style="font-family: sans-serif; color: #333; line-height: 1.6; max-width: 400px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #3D634C; margin-bottom: 10px;">Nashwa - Bangladesh</h2>
          <p>Welcome! Use the code below to verify your account.</p>
          
          <p style="font-size: 24px; margin: 20px 0; text-align: center;">
            <strong style="color: #000; letter-spacing: 4px; background: #f4f4f4; padding: 10px; border-radius: 4px;">${otp}</strong>
          </p>
          
          <p style="font-size: 14px; color: #666;">
            This code will expire in <strong>${otpExpMin} minutes</strong>. 
            If you didn't request this, please ignore this email.
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin-top: 30px;">
          <p style="font-size: 12px; color: #999; text-align: center;">Sent by Nashwa Team</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    return info;
    
  } catch (error) {
    throw new Error("Could not send verification email");
  }
};

export const mail_passwordResetOTP = async (
  email: string,
  otp: string,
  otpExpMin: number,
) => {
  try {
    const mailOptions = {
      from: `"Nashwa Team" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset Request - Nashwa",
      html: `
        <div style="font-family: sans-serif; color: #333; line-height: 1.6; max-width: 400px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #3D634C; margin-bottom: 10px;">Nashwa - Bangladesh</h2>
          <p>We received a request to reset your password. Use the code below to proceed.</p>
          
          <p style="font-size: 24px; margin: 20px 0; text-align: center;">
            <strong style="color: #000; letter-spacing: 4px; background: #f4f4f4; padding: 10px; border-radius: 4px;">${otp}</strong>
          </p>
          
          <p style="font-size: 14px; color: #666;">
            This code will expire in <strong>${otpExpMin} minutes</strong>. 
            If you didn't request a password reset, you can safely ignore this email.
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin-top: 30px;">
          <p style="font-size: 12px; color: #999; text-align: center;">Sent by Nashwa Team</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    return info;
    
  } catch (error) {
    throw new Error("Could not send password reset email");
  }
};

export const mail_shopApproved = async (email: string, shopName: string) => {
  try {
    const mailOptions = {
      from: `"Nashwa Team" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Congratulations! Your shop "${shopName}" is approved`,
      html: `
        <div style="font-family: sans-serif; color: #333; line-height: 1.6; max-width: 400px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #3D634C; margin-bottom: 10px;">Nashwa - Bangladesh</h2>
          <p>Great news! Your shop <strong>${shopName}</strong> has been officially approved by the admin.</p>
          <p>You can now switch to your shop dashboard from the navigation bar or your profile page and start selling your products.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin-top: 30px;">
          <p style="font-size: 12px; color: #999; text-align: center;">Sent by Nashwa Team</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error("Could not send shop approval email:", error);
  }
};

export const mail_shopRejected = async (email: string, shopName: string, reason: string) => {
  try {
    const mailOptions = {
      from: `"Nashwa Team" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Update regarding your shop request "${shopName}"`,
      html: `
        <div style="font-family: sans-serif; color: #333; line-height: 1.6; max-width: 400px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #BA5B55; margin-bottom: 10px;">Nashwa - Bangladesh</h2>
          <p>We have reviewed your request to create the shop <strong>${shopName}</strong>.</p>
          <p>Unfortunately, your request could not be approved at this time for the following reason:</p>
          <blockquote style="background: #f9f9f9; border-left: 4px solid #BA5B55; margin: 15px 0; padding: 10px; font-style: italic;">
            ${reason}
          </blockquote>
          <p>If you have any questions or wish to re-apply with corrected documents, please visit our platform.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin-top: 30px;">
          <p style="font-size: 12px; color: #999; text-align: center;">Sent by Nashwa Team</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error("Could not send shop rejection email:", error);
  }
};

