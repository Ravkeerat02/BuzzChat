const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const axios = require("axios");

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

app.use(express.static(path.join(__dirname, "public")));

const botName = "Admin";

async function fetchMotivationalQuote() {
  const apiUrl = "https://api.quotable.io/random";
  try {
    const response = await fetch(apiUrl);
    const data = await response.json();
    return data.content;
  } catch (error) {
    console.error("Error fetching quote:", error);
    return "Motivational quote not available at the moment.";
  }
}

io.on("connection", (socket) => {
  socket.on("joinRoom", async ({ username, room }) => {
    const user = userJoin(socket.id, username, room);
    socket.join(user.room);

    try {
      const motivationalQuote = await fetchMotivationalQuote();
      const welcomeMessage = `Welcome to ${user.room} room ${user.username}!`;
      socket.emit("message", formatTextMessage(botName, welcomeMessage));
      socket.emit("message", formatTextMessage(botName, motivationalQuote));
    } catch (error) {
      const welcomeMessage = `Welcome to ${user.room} room ${user.username}!`;
      socket.emit("message", formatTextMessage(botName, welcomeMessage));
    }

    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        formatTextMessage(botName, `${user.username} has joined the chat`)
      );

    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });

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

  socket.on("disconnect", () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit(
        "message",
        formatTextMessage(botName, `${user.username} has left the chat`)
      );

      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
