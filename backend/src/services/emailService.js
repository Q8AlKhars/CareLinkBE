const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const emailService = {
  async sendVerificationCode(email, code) {
    try {
      const mailOptions = {
        from: `"CareLink" <${process.env.EMAIL_FROM}>`,
        to: email,
        subject: "تفعيل حساب CareLink",
        html: `
          <div style="direction: rtl; text-align: right; font-family: Arial, sans-serif;">
            <h2 style="color: #2c3e50;">مرحباً بك في CareLink</h2>
            <p>شكراً لتسجيلك معنا. لتفعيل حسابك، يرجى إدخال الرمز التالي:</p>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h1 style="color: #4CAF50; text-align: center; font-size: 32px; margin: 0;">${code}</h1>
            </div>
            <p style="color: #7f8c8d;">هذا الرمز صالح لمدة 5 دقائق فقط.</p>
            <hr style="border: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #95a5a6;">إذا لم تقم بطلب هذا الرمز، يرجى تجاهل هذا البريد.</p>
          </div>
        `,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log("Verification email sent:", info.messageId);
      return true;
    } catch (error) {
      console.error("Error sending email:", error);
      throw new Error("فشل في إرسال البريد الإلكتروني");
    }
  },

  async sendSecondaryCredentials(email, tempPassword, lovedOneName) {
    try {
      const mailOptions = {
        from: `"CareLink" <${process.env.EMAIL_FROM}>`,
        to: email,
        subject: "دعوة للانضمام كمقدم رعاية - CareLink",
        html: `
          <div style="direction: rtl; text-align: right; font-family: Arial, sans-serif;">
            <h2 style="color: #2c3e50;">مرحباً بك في CareLink</h2>
            <p>تمت إضافتك كمقدم رعاية ثانوي للمريض: <strong>${lovedOneName}</strong></p>
            <p>يمكنك تسجيل الدخول باستخدام:</p>
            <ul>
              <li>البريد الإلكتروني: ${email}</li>
              <li>كلمة المرور المؤقتة: <strong>${tempPassword}</strong></li>
            </ul>
            <p style="color: #e74c3c;">يرجى تغيير كلمة المرور بعد تسجيل الدخول لأول مرة.</p>
            <hr style="border: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #95a5a6;">هذه رسالة آلية، يرجى عدم الرد عليها.</p>
          </div>
        `,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log("Secondary caregiver email sent:", info.messageId);
      return true;
    } catch (error) {
      console.error("Error sending email:", error);
      throw new Error("فشل في إرسال البريد الإلكتروني");
    }
  },

  async sendCaregiverInvitation(email, lovedOneName, invitationToken) {
    try {
      const mailOptions = {
        from: `"CareLink" <${process.env.EMAIL_FROM}>`,
        to: email,
        subject: "دعوة للانضمام كمقدم رعاية - CareLink",
        html: `
          <div style="direction: rtl; text-align: right; font-family: Arial, sans-serif;">
            <h2 style="color: #2c3e50;">مرحباً بك في CareLink</h2>
            <p>لقد تمت دعوتك للانضمام كمقدم رعاية ثانوي للمريض: <strong>${lovedOneName}</strong></p>
            <div style="margin: 20px 0;">
              <a href="${process.env.FRONTEND_URL}/api/caregivers/accept-invitation/${invitationToken}" 
                 style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                قبول الدعوة
              </a>
              <a href="${process.env.FRONTEND_URL}/api/caregivers/reject-invitation/${invitationToken}"
                 style="background-color: #e74c3c; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-right: 10px;">
                رفض الدعوة
              </a>
            </div>
            <p>إذا كنت لا تملك حساباً، سيتم توجيهك لإنشاء حساب جديد عند قبول الدعوة.</p>
            <hr style="border: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #95a5a6;">هذه الدعوة صالحة لمدة 48 ساعة.</p>
            <p style="font-size: 12px; color: #95a5a6;">رمز الدعوة: ${invitationToken}</p>
          </div>
        `,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log("Invitation email sent:", info.messageId);
      return true;
    } catch (error) {
      console.error("Error sending email:", error);
      throw new Error("فشل في إرسال البريد الإلكتروني");
    }
  },
};

module.exports = emailService;
