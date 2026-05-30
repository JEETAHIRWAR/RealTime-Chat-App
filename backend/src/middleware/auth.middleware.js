const jwt = require("jsonwebtoken");





/*
========================================
PROTECT MIDDLEWARE
========================================
Verifies JWT token
========================================
*/
const protect = async (
    req,
    res,
    next
) =>
{

    try
    {

        /*
        ====================================
        GET AUTH HEADER
        ====================================
        */
        const authHeader =
            req.headers.authorization;





        /*
        ====================================
        TOKEN REQUIRED
        ====================================
        */
        if (!authHeader)
        {

            return res.status(401).json({

                success: false,

                message: "Unauthorized"

            });

        }





        /*
        ====================================
        GET TOKEN
        ====================================
        */
        const token =
            authHeader.split(" ")[1];





        /*
        ====================================
        VERIFY TOKEN
        ====================================
        */
        const decoded =
            jwt.verify(

                token,

                process.env.JWT_SECRET

            );





        /*
        ====================================
        ATTACH USER
        ====================================
        */
        req.user = decoded;





        next();

    }

    catch (error)
    {

        return res.status(401).json({

            success: false,

            message: "Invalid token"

        });

    }

};





/*
========================================
EXPORTS
========================================
*/
module.exports = {

    protect

};


// const jwt = require("jsonwebtoken");

// exports.protect = async (req, res, next) =>
// {

//     try
//     {

//         // GET TOKEN
//         const token = req.headers.authorization;

//         // CHECK TOKEN
//         if (!token)
//         {

//             return res.status(401).json({
//                 success: false,
//                 message: "Unauthorized"
//             });

//         }

//         // REMOVE Bearer
//         const actualToken = token.split(" ")[1];

//         // VERIFY TOKEN
//         const decoded = jwt.verify(
//             actualToken,
//             process.env.JWT_SECRET
//         );

//         // SAVE USER DATA
//         req.user = decoded;

//         next();

//     } catch (error)
//     {

//         return res.status(401).json({
//             success: false,
//             message: "Invalid token"
//         });

//     }

// };