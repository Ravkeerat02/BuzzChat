const chatForm = document.getElementById("chat-form");
const socket = io();

socket.on("message", (message) => {
  console.log(message);
});

//Msg submit
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();

  //get message
  const msg = e.target.elements.msg.value;

  //Send message to server
  socket.emit("chatMessage", msg);
});
