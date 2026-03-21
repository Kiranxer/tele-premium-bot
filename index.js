const express = require("express");
const TelegramBot = require("node-telegram-bot-api");

const { token, groupId, adminId } = require("./config");
const db = require("./database/db");

const setupPayments = require("./handlers/payments");
const setupCommands = require("./handlers/commands");
const setupGroup = require("./handlers/group");
const setupAdmin = require("./handlers/admin");
const setupPromo = require("./handlers/promo");

const app = express();
app.use(express.json());

// 🔥 Crash protection
process.on("unhandledRejection", console.error);
process.on("uncaughtException", console.error);

// 🤖 Bot init (NO polling)
const bot = new TelegramBot(token);

// Setup handlers
const plans = setupPayments(bot);
setupCommands(bot);
setupGroup(bot);
setupAdmin(bot);
setupPromo(bot);

// 🌐 Health routes (IMPORTANT for Koyeb)
app.get("/", (req, res) => {
  res.send("🤖 Telegram Premium Bot is running!");
});

app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

// 📩 Webhook route
app.post(`/bot${token}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// 🚀 Start server
const PORT = process.env.PORT || 8000;

app.listen(PORT, async () => {
  console.log(`🌐 Server running on port ${PORT}`);

  try {
    await bot.setWebHook(`${process.env.WEBHOOK_URL}/bot${token}`);
    console.log("✅ Webhook set successfully");
  } catch (err) {
    console.error("❌ Webhook error:", err);
  }
});

// 💰 Payment success
bot.on("message", async (msg) => {
  if (msg.successful_payment) {
    const userId = msg.from.id;
    const plan = plans[msg.successful_payment.invoice_payload];

    let expiry =
      plan.days === 9999
        ? "lifetime"
        : Date.now() + plan.days * 86400000;

    await db.updateUser(userId, {
      is_paid: true,
      expiry
    });

    // Allow media in group
    bot.restrictChatMember(groupId, userId, {
      can_send_messages: true,
      can_send_media_messages: true
    });

    // Notify admin
    bot.sendMessage(adminId,
`💰 NEW PAYMENT

👤 ${msg.from.first_name}
🆔 ${userId}
📦 ${plan.days} days`);

    bot.sendMessage(userId, "🎉 Premium Activated! Enjoy 💎");
  }
});

// ⏳ Auto expiry checker
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

      bot.sendMessage(u.user_id, "⚠️ Your premium expired.");
    }
  }
}, 60000);

console.log("🚀 Bot is starting...");
