const express = require("express");
const app = express();
const path = require("path");
const http = require("http");
const server = http.createServer(app);
const socketio = require("socket.io");
const io = socketio(server);

const PORT = 3000 || process.env.PORT;

//SET STATIC FILES
app.use(express.static(path.join(__dirname, "public")));

//run when client connects
io.on("connection", (socket) => {
  //emit to the user
  socket.emit("message", "Welcome to the room");

  //broadcast when a user connects
  //emit to everyone except to the user
  socket.broadcast.emit("message", "User has joined the room");

  //when someone disconnects
  socket.on("disconnect", () => {
    io.emit("message", "User has left the room");
  });

  //listen for chatMessage
  socket.on("chatMessage", (msg) => {
    //update to everyone
    io.emit("chatMessage", msg);
  });
});

server.listen(PORT, () => console.log(`listening on port ${PORT}`));
