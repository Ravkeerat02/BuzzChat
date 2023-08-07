const moment = require("moment");
function formatMessage(username, text) {
  return {
    username: username,
    text: text,
    time: moment().format("HH:mm:ss"),
  };
}

module.exports = formatMessage;
