const TelegramBot = require("node-telegram-bot-api");
const { token, groupId, adminId } = require("./config");
const db = require("./database/db");

const setupPayments = require("./handlers/payments");
const setupCommands = require("./handlers/commands");
const setupGroup = require("./handlers/group");
const setupAdmin = require("./handlers/admin");
const setupPromo = require("./handlers/promo");

const bot = new TelegramBot(token, { polling: true });

const plans = setupPayments(bot);
setupCommands(bot);
setupGroup(bot);
setupAdmin(bot);
setupPromo(bot);

// 💰 Payment success
bot.on("message", async (msg) => {
  if (msg.successful_payment) {
    const userId = msg.from.id;
    const plan = plans[msg.successful_payment.invoice_payload];

    let expiry = plan.days === 9999
      ? "lifetime"
      : Date.now() + plan.days * 86400000;

    await db.updateUser(userId, {
      is_paid: true,
      expiry
    });

    bot.restrictChatMember(groupId, userId, {
      can_send_messages: true,
      can_send_media_messages: true
    });

    // notify admin
    bot.sendMessage(adminId,
`💰 NEW PAYMENT

👤 ${msg.from.first_name}
🆔 ${userId}
📦 ${plan.days} days`);

    bot.sendMessage(userId, "🎉 Premium Activated!");
  }
});

// ⏳ expiry system
setInterval(async () => {
  const users = await db.getAllUsers();

  for (let u of users) {
    if (
      u.is_paid &&
      u.expiry !== "lifetime" &&
      u.expiry < Date.now()
    ) {
      await db.updateUser(u.user_id, { is_paid: false });

      bot.restrictChatMember(groupId, u.user_id, {
        can_send_messages: true,
        can_send_media_messages: false
      });
    }
  }
}, 60000);

console.log("🚀 Bot Live");
