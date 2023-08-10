const path = require("path");
const http = require("http");
const express = require("express");
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
const io = require("socket.io")(server);

const cors = require("cors");
app.use(cors());

app.use(express.static(path.join(__dirname, "public")));

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

    const welcomeMessage = `Welcome to ${user.room} room ${user.username}`;
    const motivationalQuote = await fetchMotivationalQuote();

    io.to(user.room).emit(
      "message",
      formatTextMessage(user.username, welcomeMessage)
    );
    io.to(user.room).emit(
      "message",
      formatTextMessage(user.username, motivationalQuote)
    );
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        formatTextMessage(user.username, `${user.username} has joined the chat`)
      );
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });

  socket.on("chatMessage", async (msg) => {
    const user = getCurrentUsers(socket.id);

    if (!user) return;

    io.to(user.room).emit("message", formatTextMessage(user.username, msg));
  });

  socket.on("disconnect", () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit(
        "message",
        formatTextMessage(user.username, `${user.username} has left the chat`)
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
