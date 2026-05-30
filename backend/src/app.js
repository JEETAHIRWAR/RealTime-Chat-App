/*
========================================
IMPORT ENV VARIABLES
========================================
Loads variables from .env file
Example:
PORT
MONGO_URI
JWT_SECRET
========================================
*/
require("dotenv").config();


const socketAuth = require(
    "./socket/middleware/socketAuth"
);

const conversationRoutes =
require("./routes/conversation.routes");

const userRoutes = require("./routes/user.routes");

/*
========================================
CORE PACKAGES
========================================
*/
const express = require("express");
const mongoose = require("mongoose");
const http = require("http");



/*
========================================
SECURITY + UTILITIES
========================================
*/
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");



/*
========================================
SOCKET.IO
========================================
*/
const { Server } = require("socket.io");



/*
========================================
ROUTES
========================================
*/
const authRoutes = require("./routes/auth.routes");
const messageRoutes = require("./routes/message.routes");


/*
========================================
SOCKET HANDLER
========================================
Contains all realtime socket logic
========================================
*/
const socketHandler = require("./socket/socket");



/*
========================================
INITIALIZE EXPRESS APP
========================================
*/
const app = express();



/*
========================================
CREATE RAW HTTP SERVER
========================================
Socket.IO works on top of raw HTTP server
NOT directly on Express app
========================================
*/
const server = http.createServer(app);



/*
========================================
INITIALIZE SOCKET.IO SERVER
========================================
*/
const io = new Server(server, {

    cors: {
        origin: "http://localhost:8080"
    }

});

/*
========================================
SOCKET AUTH MIDDLEWARE
========================================
*/
io.use(socketAuth);

/*
========================================
INITIALIZE SOCKET EVENTS
========================================
*/
socketHandler(io);



/*
========================================
SECURITY MIDDLEWARE
========================================
helmet() adds secure HTTP headers
========================================
*/
app.use(helmet());



/*
========================================
ENABLE CORS
========================================
Allows frontend to communicate
with backend
========================================
*/
// app.use(cors());
app.use(cors({
    origin: "http://localhost:8080",
    credentials: true
}));



/*
========================================
BODY PARSER
========================================
Reads incoming JSON request body
========================================
*/
app.use(express.json());



/*
========================================
FORM DATA PARSER
========================================
Reads URL encoded form data
========================================
*/
app.use(express.urlencoded({
    extended: true
}));



/*
========================================
LOGGER
========================================
Logs API requests in terminal
========================================
*/
app.use(morgan("dev"));



/*
========================================
TEST ROUTE
========================================
Used to verify server is running
========================================
*/
app.get("/", (req, res) =>
{

    res.send("Realtime Chat API Running");

});



/*
========================================
API ROUTES
========================================
*/
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);

app.use(
    "/api/conversations",
    conversationRoutes
);

/*
========================================
DATABASE CONNECTION
========================================
Connect MongoDB first
Then start server
========================================
*/
mongoose.connect(process.env.MONGO_URI)

    .then(() =>
    {

        console.log("MongoDB Connected");


        /*
        ========================================
        START SERVER
        ========================================
        */
        server.listen(process.env.PORT, () =>
        {

            console.log(
                `Server running on port ${process.env.PORT}`
            );

        });

    })

    .catch((error) =>
    {

        console.log(
            "DB ERROR:",
            error.message
        );

    });