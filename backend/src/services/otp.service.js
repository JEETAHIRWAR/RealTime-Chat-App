const bcrypt = require("bcryptjs");

const OTP = require("../models/otp.model");



/*
========================================
GENERATE RANDOM OTP
========================================
*/
const generateOTP = () =>
{

    return Math.floor(
        100000 + Math.random() * 900000
    ).toString();

};




/*
========================================
CREATE OTP
========================================
*/
const createOTP = async ({
    email,
    phone,
    purpose
}) =>
{

    /*
    ========================================
    GENERATE OTP
    ========================================
    */
    const otp = generateOTP();



    /*
    ========================================
    HASH OTP
    ========================================
    */
    const hashedOTP = await bcrypt.hash(
        otp,
        10
    );



    /*
    ========================================
    OTP EXPIRY
    ========================================
    5 minutes
    ========================================
    */
    const expiresAt = new Date(
        Date.now() + 5 * 60 * 1000
    );



    /*
    ========================================
    DELETE OLD OTPs
    ========================================
    */
    await OTP.deleteMany({

        $or: [
            { email },
            { phone }
        ],

        purpose

    });




    /*
    ========================================
    SAVE OTP
    ========================================
    */
    await OTP.create({

        email,
        phone,
        otp: hashedOTP,
        purpose,
        expiresAt

    });




    /*
    ========================================
    RETURN RAW OTP
    ========================================
    In production:
    send via email/SMS
    ========================================
    */
    return otp;

};





/*
========================================
VERIFY OTP
========================================
*/
const verifyOTP = async ({
    email,
    phone,
    otp,
    purpose
}) =>
{

    /*
    ========================================
    FIND OTP RECORD
    ========================================
    */
    const existingOTP = await OTP.findOne({

        $or: [
            { email },
            { phone }
        ],

        purpose

    });



    /*
    ========================================
    OTP NOT FOUND
    ========================================
    */
    if (!existingOTP)
    {

        return {
            success: false,
            message: "OTP expired or not found"
        };

    }




    /*
    ========================================
    CHECK ATTEMPTS
    ========================================
    */
    if (existingOTP.attempts >= 5)
    {

        return {
            success: false,
            message: "Too many attempts"
        };

    }




    /*
    ========================================
    VERIFY HASHED OTP
    ========================================
    */
    const isValid = await bcrypt.compare(
        otp,
        existingOTP.otp
    );



    /*
    ========================================
    INVALID OTP
    ========================================
    */
    if (!isValid)
    {

        existingOTP.attempts += 1;

        await existingOTP.save();

        return {
            success: false,
            message: "Invalid OTP"
        };

    }




    /*
    ========================================
    OTP VERIFIED
    ========================================
    */
    existingOTP.verified = true;

    await existingOTP.save();




    return {
        success: true,
        message: "OTP verified successfully"
    };

};





/*
========================================
EXPORT SERVICES
========================================
*/
module.exports = {

    createOTP,
    verifyOTP

};