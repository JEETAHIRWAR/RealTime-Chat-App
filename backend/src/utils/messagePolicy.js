const EDIT_MESSAGE_WINDOW_MS = 15 * 60 * 1000;
const DELETE_FOR_EVERYONE_WINDOW_MS = 60 * 60 * 1000;

const getCreatedAtTime = (message) =>
{
    const createdAt =
        message?.createdAt instanceof Date
            ? message.createdAt
            : new Date(message?.createdAt);

    const createdAtTime =
        createdAt.getTime();

    return Number.isNaN(createdAtTime)
        ? null
        : createdAtTime;
};

const getMessageActionPolicy = (
    message,
    now = new Date()
) =>
{
    const createdAtTime =
        getCreatedAtTime(message);

    const nowTime =
        now instanceof Date
            ? now.getTime()
            : new Date(now).getTime();

    if (
        createdAtTime === null ||
        Number.isNaN(nowTime)
    )
    {
        return {
            canEdit: false,
            canDeleteForEveryone: false,
            editExpiresAt: null,
            deleteForEveryoneExpiresAt: null
        };
    }

    const editExpiresAt =
        new Date(
            createdAtTime +
            EDIT_MESSAGE_WINDOW_MS
        );

    const deleteForEveryoneExpiresAt =
        new Date(
            createdAtTime +
            DELETE_FOR_EVERYONE_WINDOW_MS
        );

    return {
        canEdit:
            nowTime <= editExpiresAt.getTime(),
        canDeleteForEveryone:
            nowTime <= deleteForEveryoneExpiresAt.getTime(),
        editExpiresAt,
        deleteForEveryoneExpiresAt
    };
};

module.exports = {
    EDIT_MESSAGE_WINDOW_MS,
    DELETE_FOR_EVERYONE_WINDOW_MS,
    getMessageActionPolicy
};
