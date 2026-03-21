const db = require("../database/db");
const { adminId, groupId } = require("../config");

function setupAdmin(bot) {

  bot.onText(/\/admin/, (msg) => {
    if (msg.from.id.toString() !== adminId) return;

    bot.sendMessage(msg.chat.id, "👑 ADMIN PANEL", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "📊 Stats", callback_data: "admin_stats" }],
          [{ text: "📢 Broadcast", callback_data: "admin_broadcast" }]
        ]
      }
    });
  });

  bot.on("callback_query", async (q) => {
    if (q.from.id.toString() !== adminId) return;

    if (q.data === "admin_stats") {
      const users = await db.getAllUsers();
      const premium = users.filter(u => u.is_paid);

      bot.sendMessage(q.message.chat.id,
`👥 Users: ${users.length}
💎 Premium: ${premium.length}`);
    }

    if (q.data === "admin_broadcast") {
      bot.sendMessage(q.message.chat.id, "Send message:");
      bot.once("message", async (msg) => {
        const users = await db.getAllUsers();

        for (let u of users) {
          try { await bot.sendMessage(u.user_id, msg.text); } catch {}
        }

        bot.sendMessage(q.message.chat.id, "✅ Done");
      });
    }
  });
}

module.exports = setupAdmin;
