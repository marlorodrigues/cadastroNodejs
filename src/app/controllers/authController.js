const express = require('express');
const User = require('../models/user');
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

        await mailer.sendMail({
            from: 'marlorodrigues@outlook.com.br',
            to: email,
            // template: 'auth/password',
            // context: { token },
            subject: "Forgor You Pass to our App?", // Subject line
            text: "Email de desenvolvimento", // plain text body
            html: `<p>Esqueceu a senha?! Tudo bem acontece, utilize esse token para logar {${token}}</p>` // html body
        }, (err) => {
            if (err) {
                return res.status(400).send({ error: "Cannot send forgot password to email" });
            }

            return res.send();
        });
    } catch (error) {
        console.log(error);

        return res.status(400).send({ error: "Erro on forgot password, try again" })
    }
});

router.post('/reset_password', async (req, res) => {
    const { email, token, password } = req.body;

    try {

        const user = await User.findOne({ email })
            .select("+passwordResetToken passwordResetExpires");

        if (!user)
            return res.status(400).send({ error: "User Not Found" });

        if (token !== user.passwordResetToken)
            return res.status(400).send({ error: "Token Invalid" });

        const now = new Date();

        if (now > user.passwordResetExpires)
            return res.status(400).send({ error: "Token expered, generate a new one" });

        //Atualiza a senha do usuario
        user.password = password;
        await user.save();

        res.send();

    } catch (error) {
        return res.status(400).send({ error: "" });
    }
});

module.exports = app => app.use('/auth', router);
