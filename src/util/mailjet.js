const Mailjet = require('node-mailjet');

const mailjet = new Mailjet({
    apiKey: '2967004aa1856c3f4a583e7c155c3d15',
    apiSecret: 'c23bd622f07d7a08b6d2a992c08d7d37'
});

const sendPasswordResetEmail = async (email, resetToken) => {
    try {
        // Log để debug
        console.log('Attempting to send email to:', email);
        console.log('Reset token:', resetToken);

        const result = await mailjet.post('send', { version: 'v3.1' }).request({
            Messages: [
                {
                    From: {
                        Email: "sportshop.web@gmail.com", // Thay email này bằng email đã verify trong Mailjet
                        Name: "Sport Shop"
                    },
                    To: [
                        {
                            Email: email
                        }
                    ],
                    Subject: "Đặt lại mật khẩu Sport Shop",
                    HTMLPart: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <img src="https://t4.ftcdn.net/jpg/09/82/07/11/360_F_982071173_oTETgokPvxjDQysPY3QEppuA0TYoYjk6.jpg" 
                                 alt="Reset Password" 
                                 style="max-width: 150px; display: block; margin: 20px auto;">
                            <h2 style="color: #2196F3; text-align: center;">Yêu cầu đặt lại mật khẩu</h2>
                            <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
                            <p>Vui lòng click vào nút bên dưới để đặt lại mật khẩu:</p>
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="http://localhost:3000/reset-password/${resetToken}"
                                   style="background-color: #f44336; 
                                          color: white; 
                                          padding: 12px 30px; 
                                          text-decoration: none; 
                                          border-radius: 4px;
                                          display: inline-block;">
                                    Đặt lại mật khẩu
                                </a>
                            </div>
                            <p>Link này sẽ hết hạn sau 1 giờ.</p>
                            <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
                            <hr style="border: 1px solid #eee; margin: 20px 0;">
                            <p style="color: #666; font-size: 14px; text-align: center;">
                                Trân trọng,<br>
                                Sport Shop
                            </p>
                        </div>
                    `
                }
            ]
        });

        console.log('Email sent successfully:', result.body);
        return result;
    } catch (error) {
        console.error('Error details:', {
            message: error.message,
            statusCode: error.statusCode,
            errorType: error.ErrorType,
            errorInfo: error.ErrorInfo
        });
        throw error;
    }
};

module.exports = {
    sendPasswordResetEmail
}; 