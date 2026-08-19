require('dotenv').config();

const express = require('express');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(__dirname));

const validateDonation = (body) => {
    const { name, email, amount } = body || {};

    if (!name || !email || !amount) {
        return 'Name, email, and donation amount are required.';
    }

    return null;
};

app.post('/api/donate', async (req, res) => {
    const errorMessage = validateDonation(req.body);

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
    } = req.body;

    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;
    const toEmail = process.env.TO_EMAIL || emailUser;

    if (!emailUser || !emailPass) {
        return res.status(500).json({
            success: false,
            message: 'Email credentials are not configured yet. Add EMAIL_USER and EMAIL_PASS in your environment file.',
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

        const mailOptions = {
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
        };

        await transporter.sendMail(mailOptions);

        return res.status(200).json({
            success: true,
            message: 'Donation request sent successfully.',
        });
    } catch (error) {
        console.error('Donation email error:', error);

        return res.status(500).json({
            success: false,
            message: 'The donation email could not be sent right now. Please try again or email us directly at havenfoundationhope@gmail.com.',
        });
    }
});

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
