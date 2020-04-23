const express = require('express');
const User = require('../models/index');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authConfig = require('../../config/auth.json');
const crypto = require('crypto');
const mailer = require('../../modules/mailer');


function generateToken(params = {}) {
    return jwt.sign(params, authConfig.secret, { expiresIn: 86400 });
};

router.post('/register', async (req, res) => {
    try {
        const { email } = req.body;

        if (await User.findOne({ email }))
            return res.status(400).send({ error: "User already exists." });

        const user = await User.create(req.body);

        user.password = undefined;

        return res.send({
            user,
            token: generateToken({ id: user.id })
        });

    } catch (err) {
        return res.status(400).send({ error: "Registration Failed :(" });
    }
});

router.post('/authenticate', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');

    if (!user)
        return res.status(400).send({ error: "User not found" });

    if (!await bcrypt.compare(password, user.password))
        return res.status(400).send({ error: "Invalid Password" });

    user.password = undefined;

    res.send({
        user,
        token: generateToken({ id: user.id })
    });
});

router.post('/forgot_password', async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user)
            return res.status(400).send({ error: "User Not Found" });

        const token = crypto.randomBytes(20).toString('hex');
        const now = new Date();
        now.setHours(now.getHours() + 1);

        await User.findByIdAndUpdate(user.id, {
            '$set': {
                passwordResetToken: token,
                passwordResetExpires: now
            }
        });
        mailer.sendMail({
            to: email,
            from: 'marlorodrigues@outlook.com.br',
            template: 'src/resourses/mail/password',
            context: { token }
        }, (err) => {
            if (err) {
                console.log(err);
                return res.status(400).send({ error: "Cannot send forgot password to email" });
            }

            return res.send();
        });
    } catch (error) {
        console.log(error);

        return res.status(400).send({ error: "Erro on forgot password, try again" })
    }
});

module.exports = app => app.use('/auth', router);
