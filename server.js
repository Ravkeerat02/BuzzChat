const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const axios = require("axios");
const moment = require("moment");
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
  try {
    const response = await axios.get("https://api.quotable.io/random");
    return response.data.content;
  } catch (error) {
    console.error("Error fetching quote:", error);
    return "Motivational quote not available at the moment.";
  }
}

io.on("connection", (socket) => {
  socket.on("joinRoom", async ({ username, room }) => {
    const user = userJoin(socket.id, username, room);
    socket.join(user.room);

    const welcomeMessage = `Welcome to ${user.room} room ${user.username}!`;
    const motivationalQuote = await fetchMotivationalQuote();

    io.to(user.room).emit(
      "message",
      formatTextMessage(botName, welcomeMessage)
    );
    io.to(user.room).emit(
      "message",
      formatTextMessage(botName, motivationalQuote)
    );
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

  socket.on("chatMessage", async (msg) => {
    const user = getCurrentUsers(socket.id);

    if (!user) return;

    if (msg.type === "file") {
      const fileData = await readFileAsDataURL(msg.file);
      io.to(user.room).emit(
        "message",
        formatFileMessage(user.username, fileData, msg.filename)
      );
    } else {
      io.to(user.room).emit("message", formatTextMessage(user.username, msg));
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

async function readFileAsDataURL(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      resolve(event.target.result);
    };
    reader.readAsDataURL(file);
  });
}
