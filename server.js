// server.js
const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const { formatFileMessage, formatTextMessage } = require("./utils/messages");
const {
  userJoin,
  getCurrentUsers,
  userLeave,
  getRoomUsers,
} = require("./utils/user");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Set static folder
app.use(express.static(path.join(__dirname, "public")));

const botName = "Admin";

// Run when client connects
io.on("connection", (socket) => {
  socket.on("joinRoom", ({ username, room }) => {
    const user = userJoin(socket.id, username, room);

    socket.join(user.room);

    // Welcome current user
    socket.emit(
      "message",
      formatTextMessage(
        botName,
        `Welcome to ${user.room} room  ${user.username}!`
      )
    );

    // Broadcast when a user connects
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        formatTextMessage(botName, `${user.username} has joined the chat`)
      );

    // Send users and room info
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });

  // Listen for chatMessage
  socket.on("chatMessage", (msg) => {
    const user = getCurrentUsers(socket.id);

    if (user) {
      if (msg.type === "file") {
        io.to(user.room).emit(
          "message",
          formatFileMessage(user.username, msg.file, msg.filename)
        );
      } else {
        io.to(user.room).emit("message", formatTextMessage(user.username, msg));
      }
    }
  });

  // Runs when client disconnects
  socket.on("disconnect", () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit(
        "message",
        formatTextMessage(botName, `${user.username} has left the chat`)
      );

      // Send users and room info
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
