const db = require("../database/db");
const { groupId } = require("../config");

function setupGroup(bot) {
  bot.on("message", async (msg) => {
    if (!msg.chat || msg.chat.id.toString() !== groupId) return;
    if (!msg.from) return;

    const user = await db.getUser(msg.from.id);

    if (!user.is_paid && (msg.photo || msg.video)) {
      return bot.deleteMessage(msg.chat.id, msg.message_id);
    }
  });
}

module.exports = setupGroup;
