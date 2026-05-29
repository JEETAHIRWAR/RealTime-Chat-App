/*
========================================
ONLINE USERS MAP
========================================

Structure:

Map<
   userId,
   Set(socketIds)
>

Supports:
- multiple tabs
- multiple devices
- reconnects
- scalability

========================================
*/
const onlineUsers = new Map();



/*
========================================
ADD USER SOCKET
========================================
*/
const addUserSocket = (
    userId,
    socketId
) =>
{

    /*
    ========================================
    CREATE SET IF NOT EXISTS
    ========================================
    */
    if (!onlineUsers.has(userId))
    {
        onlineUsers.set(
            userId,
            new Set()
        );
    }



    /*
    ========================================
    ADD SOCKET ID
    ========================================
    */
    onlineUsers
        .get(userId)
        .add(socketId);

};



/*
========================================
REMOVE USER SOCKET
========================================
*/
const removeUserSocket = (
    userId,
    socketId
) =>
{

    /*
    ========================================
    CHECK USER EXISTS
    ========================================
    */
    if (!onlineUsers.has(userId))
    {
        return;
    }



    /*
    ========================================
    REMOVE SOCKET
    ========================================
    */
    const userSockets =
        onlineUsers.get(userId);

    userSockets.delete(socketId);



    /*
    ========================================
    REMOVE USER IF NO SOCKETS LEFT
    ========================================
    */
    if (userSockets.size === 0)
    {
        onlineUsers.delete(userId);
    }

};



/*
========================================
GET ONLINE USERS
========================================
*/
const getOnlineUsers = () =>
{
    return Array.from(
        onlineUsers.keys()
    );
};



/*
========================================
CHECK USER ONLINE
========================================
*/
const isUserOnline = (userId) =>
{
    return onlineUsers.has(userId);
};



/*
========================================
EXPORTS
========================================
*/
module.exports = {

    addUserSocket,
    removeUserSocket,
    getOnlineUsers,
    isUserOnline

};