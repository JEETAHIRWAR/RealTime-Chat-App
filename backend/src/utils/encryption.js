/*
========================================
NODE CRYPTO MODULE
========================================
*/
const crypto = require("crypto");



/*
========================================
ENCRYPTION ALGORITHM
========================================
*/
const algorithm = "aes-256-cbc";



/*
========================================
SECRET ENCRYPTION KEY
========================================
MUST be 32 bytes
========================================
*/
const secretKey = crypto
    .createHash("sha256")
    .update(process.env.MESSAGE_SECRET)
    .digest("hex")
    .substring(0, 32);



/*
========================================
INITIALIZATION VECTOR LENGTH
========================================
*/
const ivLength = 16;



/*
========================================
ENCRYPT MESSAGE
========================================
*/
const encryptMessage = (text) =>
{

    /*
    ========================================
    GENERATE RANDOM IV
    ========================================
    */
    const iv = crypto.randomBytes(ivLength);



    /*
    ========================================
    CREATE CIPHER
    ========================================
    */
    const cipher = crypto.createCipheriv(
        algorithm,
        secretKey,
        iv
    );



    /*
    ========================================
    ENCRYPT TEXT
    ========================================
    */
    let encrypted = cipher.update(
        text,
        "utf8",
        "hex"
    );

    encrypted += cipher.final("hex");



    /*
    ========================================
    RETURN IV + ENCRYPTED DATA
    ========================================
    */
    return `${iv.toString("hex")}:${encrypted}`;

};



/*
========================================
DECRYPT MESSAGE
========================================
*/
const decryptMessage = (encryptedText) =>
{

    try
    {

        /*
        ========================================
        SPLIT IV + DATA
        ========================================
        */
        const parts =
            encryptedText.split(":");



        const iv = Buffer.from(
            parts[0],
            "hex"
        );



        const encryptedData = parts[1];



        /*
        ========================================
        CREATE DECIPHER
        ========================================
        */
        const decipher =
            crypto.createDecipheriv(
                algorithm,
                secretKey,
                iv
            );



        /*
        ========================================
        DECRYPT DATA
        ========================================
        */
        let decrypted = decipher.update(
            encryptedData,
            "hex",
            "utf8"
        );

        decrypted += decipher.final(
            "utf8"
        );



        return decrypted;

    }

    catch (error)
    {

        return "Unable to decrypt";

    }

};



/*
========================================
EXPORTS
========================================
*/
module.exports = {

    encryptMessage,
    decryptMessage

};