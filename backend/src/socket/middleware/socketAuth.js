/*
========================================
JWT PACKAGE
========================================
*/
const jwt = require("jsonwebtoken");



/*
========================================
SOCKET AUTH MIDDLEWARE
========================================
Verifies JWT before socket connection
========================================
*/
const socketAuth = (socket, next) =>
{
    try
    {

        /*
        ========================================
        GET TOKEN FROM HANDSHAKE
        ========================================
        Frontend sends:
        auth: { token }
        ========================================
        */
        const token = socket.handshake.auth.token;



        /*
        ========================================
        CHECK TOKEN
        ========================================
        */
        if (!token)
        {
            return next(
                new Error("Unauthorized")
            );
        }



        /*
        ========================================
        VERIFY JWT
        ========================================
        */
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );



        /*
        ========================================
        ATTACH USER TO SOCKET
        ========================================
        */
        socket.user = decoded;



        /*
        ========================================
        CONTINUE CONNECTION
        ========================================
        */
        next();

    }

    catch (error)
    {

        return next(
            new Error("Invalid Token")
        );

    }

};



/*
========================================
EXPORT MIDDLEWARE
========================================
*/
module.exports = socketAuth;