const express = require("express");
const app = express();
const path = require("path");
const http = require("http");
const server = http.createServer(app);
const socket = require("socket.io");
const io = socket(server);
const formatMessage = require("./utils/messages");
const {
  userJoin,
  getCurrentUsers,
  userLeave,
  getRoomUsers,
} = require("./utils/user");
const admin = "admin";
const PORT = 3000 || process.env.PORT;

//SET STATIC FILES
app.use(express.static(path.join(__dirname, "public")));

//run when client connects
io.on("connection", (socket) => {
  socket.on("joinRoom", ({ username, room }) => {
    const user = userJoin(socket.id, username, room);
    socket.join(user.room);

    //emit to the user
    socket.emit("message", formatMessage(admin, "Welcome to the chat room"));

    //broadcast when a user connects
    //emit to everyone except to the userz
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        formatMessage(admin, `${user.username}User has joined the room`)
      );
  });

  //listen for chatMessage
  socket.on("chatMessage", (msg) => {
    const user = getCurrentUsers(socket.id);
    //update to everyone
    io.to(user.room).emit("chatMessage", formatMessage(user.username, msg));
  });

  //when someone disconnects
  socket.on("disconnect", () => {
    const user = userLeave(socket.id);
    if (user) {
      io.to(user.room).emit(
        "message",
        formatMessage(admin, `${user.username} has left the room`)
      );
    }
  });
});

server.listen(PORT, () => console.log(`listening on port ${PORT}`));
