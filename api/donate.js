const nodemailer = require('nodemailer');

const validateDonation = (body) => {
    const { name, email, amount } = body || {};

    if (!name || !email || !amount) {
        return 'Name, email, and donation amount are required.';
    }

    return null;
};

module.exports = async function handler(req, res) {
    const payload = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const errorMessage = validateDonation(payload);

    if (errorMessage) {
        return res.status(400).json({ success: false, message: errorMessage });
    }

    const {
        name,
        email,
        amount,
        cause,
        message,
        payment_method,
    } = payload;

    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;
    const toEmail = process.env.TO_EMAIL || emailUser;

    if (!emailUser || !emailPass) {
        return res.status(500).json({
            success: false,
            message: 'Email credentials are not configured yet. Add EMAIL_USER and EMAIL_PASS in your Vercel environment settings.',
        });
    }

    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: emailUser,
                pass: emailPass,
            },
        });

        await transporter.sendMail({
            from: `Hope Haven Donation Form <${emailUser}>`,
            replyTo: email,
            to: toEmail,
            subject: 'New donation request from Hope Haven website',
            text: [
                `Name: ${name}`,
                `Email: ${email}`,
                `Donation Amount: ${amount}`,
                `Support Area: ${cause || 'Not provided'}`,
                `Payment Method: ${payment_method || 'Not provided'}`,
                '',
                'Message:',
                message || 'No message provided.',
            ].join('\n'),
            html: `
        <h2>New Donation Request</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Donation Amount:</strong> ${amount}</p>
        <p><strong>Support Area:</strong> ${cause || 'Not provided'}</p>
        <p><strong>Payment Method:</strong> ${payment_method || 'Not provided'}</p>
        <p><strong>Message:</strong></p>
        <p>${(message || 'No message provided.').replace(/\n/g, '<br>')}</p>
      `,
        });

        return res.status(200).json({ success: true, message: 'Donation request sent successfully.' });
    } catch (error) {
        console.error('Donation email error:', error);
        return res.status(500).json({
            success: false,
            message: 'The donation email could not be sent right now. Please try again or email us directly at havenfoundationhope@gmail.com.',
        });
    }
};
