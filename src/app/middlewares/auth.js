const jwt = require('jsonwebtoken');
const authCongif = require('../../config/auth.json');

module.exports = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader)
        return res.status(401).send({ error: "No token provided" })

    const parts = authHeader.split(' ');

    if (!parts.lenght === 2)
        return res.status(401).send({ error: "Token Error" });

    const [token, scheme] = parts;

    // if (!/ˆBearer$/i.test(scheme))
    //     return res.status(401).send({ error: "Token Malformatted" })


    jwt.verify(token, authCongif.secret, (err, decoded) => {
        if (err)
            return res.status(401).send({ error: "Token Invalid" });

        req.userId = decoded.id;
        return next();
    });
}