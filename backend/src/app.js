/*
========================================
IMPORT ENV VARIABLES
========================================
*/
require("dotenv").config();

/*
========================================
CORE PACKAGES
========================================
*/
const express = require("express");
const mongoose = require("mongoose");
const http = require("http");
const path = require("path");

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
const conversationRoutes = require("./routes/conversation.routes");
const userRoutes = require("./routes/user.routes");
const uploadRoutes = require("./routes/upload.routes");

/*
========================================
SOCKET
========================================
*/
const socketAuth = require("./socket/middleware/socketAuth");
const socketHandler = require("./socket/socket");

/*
========================================
APP CONFIG
========================================
*/
const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const FRONTEND_URL =
    process.env.FRONTEND_URL ||
    "http://localhost:8080";

/*
========================================
SOCKET.IO SETUP
========================================
*/
const io = new Server(server, {
    cors: {
        origin: FRONTEND_URL,
        credentials: true
    }
});

io.use(socketAuth);

socketHandler(io);

/*
========================================
GLOBAL MIDDLEWARES
========================================
*/
app.use(
    helmet({
        crossOriginResourcePolicy: false
    })
);

app.use(
    cors({
        origin: FRONTEND_URL,
        credentials: true
    })
);

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true
    })
);

app.use(morgan("dev"));

/*
========================================
STATIC FILES
========================================
*/
app.use(
    "/uploads",
    express.static(
        path.join(__dirname, "../uploads")
    )
);

/*
========================================
HEALTH CHECK
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
app.use("/api/conversations", conversationRoutes);
app.use("/api/users", userRoutes);
app.use("/api/upload", uploadRoutes);

/*
========================================
DATABASE + SERVER START
========================================
*/
mongoose
    .connect(process.env.MONGO_URI)
    .then(() =>
    {
        console.log("MongoDB Connected");

        server.listen(PORT, () =>
        {
            console.log(
                `Server running on port ${PORT}`
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