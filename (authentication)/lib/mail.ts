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
