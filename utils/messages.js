const moment = require("moment");

function formatTextMessage(username, text) {
  return {
    username,
    text,
    time: moment().format("h:mm a"),
    type: "text",
  };
}

function formatFileMessage(username, file, filename) {
  return {
    username,
    file,
    filename,
    time: moment().format("h:mm a"),
    type: ["file", "text"],
  };
}

module.exports = {
  formatTextMessage,
  formatFileMessage,
};
