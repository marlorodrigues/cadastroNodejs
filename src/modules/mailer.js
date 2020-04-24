const mailer = require('nodemailer');
const mailerhbs = require('nodemailer-express-handlebars');
const path = require('path');
const { host, port, user, pass } = require('../config/mailer.json');


var transport = mailer.createTransport({
    host,
    port,
    auth: {
        user,
        pass
    }
});

// 'handlebars',`

transport.use('compile', mailerhbs({
    viewEngine: {
        partialsDir: './src/resourses/mail/',
    },
    viewPath: path.resolve('./src/resourses/mail/'),
    tls: {
        rejectUnauthorized: false
    }
}));


module.exports = transport;
