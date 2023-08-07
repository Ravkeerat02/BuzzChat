const chatForm = document.getElementById("chat-form");
const chatMessage = document.querySelector(".chat-messages");

//get user and room
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const socket = io();

//join chatroom
socket.emit("joinRoom", { username, room });

//get room and users
socket.on("roomUsers", ({ room, users }) => {
  console.log(room, users);
  const userList = document.getElementById("user-list");
  users.forEach((user) => {
    const li = document.createElement("li");
    li.innerHTML = user;
    userList.appendChild(li);
  });
});

//msg from server
socket.on("message", (message) => {
  console.log(message);
  outputMessage(message);

  //scroll to bottom
  chatMessage.scrollTop = chatMessage.scrollHeight;
});

//Msg submit
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();

  //get message
  const msg = e.target.elements.msg.value;

  //Send message to server
  socket.emit("chatMessage", msg);

  //clear input
  e.target.elements.msg.value = "";
  e.target.elements.msg.focus();
});

//output message to dom
function outputMessage(message) {
  const div = document.createElement("div");
  div.classList.add("message");
  div.innerHTML = ` <p class="meta">${message.username}<span>${message.time}</span></p>
  <p class="text">
    ${message}
  </p>`;
  document.querySelector(".chat-messages").appendChild(div);
}
