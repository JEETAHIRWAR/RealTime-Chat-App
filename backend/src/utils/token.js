const jwt = require("jsonwebtoken");



/*
========================================
GENERATE ACCESS TOKEN
========================================
*/
const generateAccessToken = (userId) =>
{

    return jwt.sign(

        { id: userId },

        process.env.JWT_SECRET,

        {
            expiresIn:
                process.env.ACCESS_TOKEN_EXPIRE
        }

    );

};




/*
========================================
GENERATE REFRESH TOKEN
========================================
*/
const generateRefreshToken = (userId) =>
{

    return jwt.sign(

        { id: userId },

        process.env.JWT_REFRESH_SECRET,

        {
            expiresIn:
                process.env.REFRESH_TOKEN_EXPIRE
        }

    );

};




/*
========================================
EXPORT TOKENS
========================================
*/
module.exports = {

    generateAccessToken,
    generateRefreshToken

};