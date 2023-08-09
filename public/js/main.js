const chatForm = document.getElementById("chat-form");
const chatMessages = document.querySelector(".chat-messages"); // Make sure this matches your HTML
const roomName = document.getElementById("room-name");
const userList = document.getElementById("user-list");

const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const socket = io();

socket.emit("joinRoom", { username, room });

socket.on("roomUsers", ({ room, users }) => {
  outputRoomName(room);
  outputUsers(users);
});

// Msg submit
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const inputElement = e.target.elements.msg;
  const isFileInput = inputElement.type === "file";
  const msg = isFileInput ? inputElement.files[0] : inputElement.value;

  if (isFileInput) {
    const file = inputElement.files[0];
    const fileData = await readFileAsDataURL(file);

    socket.emit("chatMessage", {
      type: "file",
      file: fileData,
      filename: file.name,
    });
  } else {
    socket.emit("chatMessage", msg);
  }

  inputElement.value = "";
  inputElement.focus();
});

// Helper function to read file as Data URL
function readFileAsDataURL(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      resolve(event.target.result);
    };
    reader.readAsDataURL(file);
  });
}

socket.on("message", (message) => {
  const isSender = message.username === username; // Compare with the current user's username
  outputMessage(message, isSender);

  chatMessages.scrollTop = chatMessages.scrollHeight;
});

function outputMessage(message, isSender) {
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message");

  if (isSender) {
    messageDiv.classList.add("sender");
  } else {
    messageDiv.classList.add("receiver");
  }

  const meta = document.createElement("p");
  meta.classList.add("meta");
  meta.innerHTML = `${message.username} <span>${message.time}</span>`;

  const text = document.createElement("p");
  text.classList.add("text");

  if (message.type === "file") {
    const fileLink = document.createElement("a");
    fileLink.href = message.file;
    fileLink.target = "_blank";
    fileLink.textContent = `Download ${message.filename}`;
    text.appendChild(fileLink);
  } else {
    text.textContent = message.text;
  }

  messageDiv.appendChild(meta);
  messageDiv.appendChild(text);

  chatMessages.appendChild(messageDiv);
}

function outputRoomName(room) {
  roomName.innerText = room;
}

function outputUsers(users) {
  const userList = document.getElementById("user-list");
  userList.innerHTML = "";

  users.forEach((user) => {
    const li = document.createElement("li");
    li.innerText = user.username;
    userList.appendChild(li);
  });
}
