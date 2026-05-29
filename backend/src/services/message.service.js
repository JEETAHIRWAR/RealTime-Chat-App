/*
========================================
MESSAGE REPOSITORY
========================================
*/
const {

    createMessage

} = require(
    "../repositories/message.repository"
);



/*
========================================
ENCRYPTION UTILS
========================================
*/
const {

    encryptMessage,
    decryptMessage

} = require(
    "../utils/encryption"
);



/*
========================================
SEND MESSAGE SERVICE
========================================
Handles:
- validation
- encryption
- DB save
- response formatting
========================================
*/
const sendMessageService = async ({

    senderId,
    receiverId,
    message

}) =>
{

    /*
    ========================================
    VALIDATION
    ========================================
    */
    if (
        !senderId ||
        !receiverId ||
        !message
    )
    {

        throw new Error(
            "Missing required fields"
        );

    }



    /*
    ========================================
    ENCRYPT MESSAGE
    ========================================
    */
    const encryptedMessage =
        encryptMessage(message);



    /*
    ========================================
    SAVE MESSAGE
    ========================================
    */
    const savedMessage =
        await createMessage({

            senderId,
            receiverId,

            message:
                encryptedMessage

        });



    /*
    ========================================
    CONVERT TO OBJECT
    ========================================
    */
    const messageObj =
        savedMessage.toObject();



    /*
    ========================================
    DECRYPT BEFORE RETURN
    ========================================
    */
    messageObj.message =
        decryptMessage(
            messageObj.message
        );



    return messageObj;

};



/*
========================================
EXPORTS
========================================
*/
module.exports = {

    sendMessageService

};