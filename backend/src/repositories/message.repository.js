/*
========================================
MESSAGE MODEL
========================================
*/
const Message = require(
    "../models/message.model"
);



/*
========================================
CREATE MESSAGE
========================================
*/
const createMessage = async (
    messageData
) =>
{

    return await Message.create(
        messageData
    );

};



/*
========================================
EXPORTS
========================================
*/
module.exports = {

    createMessage

};