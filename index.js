const express = require("express");
const TelegramBot = require("node-telegram-bot-api");

const { token, groupId, adminId, webhookUrl, port } = require("./config");
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

// Setup modules
const plans = setupPayments(bot);
setupCommands(bot);
setupGroup(bot);
setupAdmin(bot);
setupPromo(bot);

// 🌐 Routes (Koyeb health check)
app.get("/", (req, res) => res.send("🤖 Bot running"));
app.get("/health", (req, res) => res.send("OK"));

// 📩 Webhook
app.post(`/bot${token}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// 🚀 Start server
app.listen(port, async () => {
  console.log(`🌐 Running on ${port}`);

  try {
    await bot.setWebHook(`${webhookUrl}/bot${token}`);
    console.log("✅ Webhook set");
  } catch (err) {
    console.log("Webhook error:", err.message);
  }
});

// 💰 PAYMENT HANDLER (FIXED ASYNC)
bot.on("message", async (msg) => {
  try {
    if (!msg.successful_payment) return;

    const userId = msg.from.id;
    const plan = plans[msg.successful_payment.invoice_payload];

    if (!plan) return;

    let expiry =
      plan.days === 9999
        ? "lifetime"
        : Date.now() + plan.days * 86400000;

    await db.updateUser(userId, {
      is_paid: true,
      expiry
    });

    await db.incrementPurchase(userId);

    // ✅ Allow media
    await bot.restrictChatMember(groupId, userId, {
      can_send_messages: true,
      can_send_media_messages: true
    });

    // 🔔 Admin alert
    await bot.sendMessage(adminId,
`💰 NEW PAYMENT

👤 ${msg.from.first_name}
🆔 ${userId}
📦 ${plan.days} days`);

    await bot.sendMessage(userId, "🎉 Premium Activated!");
  } catch (err) {
    console.log("Payment error:", err.message);
  }
});

// ⏳ GLOBAL CHECKER (FIXED ASYNC)
setInterval(async () => {
  try {
    const users = await db.getAllUsers();
    const now = Date.now();

    for (let u of users) {

      // 💎 PREMIUM EXPIRY
      if (u.is_paid && u.expiry !== "lifetime" && u.expiry < now) {
        await db.updateUser(u.user_id, { is_paid: false });

        await bot.restrictChatMember(groupId, u.user_id, {
          can_send_messages: true,
          can_send_media_messages: false
        });

        bot.sendMessage(u.user_id, "⚠️ Premium expired.");
      }

      // 🎁 TRIAL EXPIRY
      if (!u.is_paid && u.trial_expiry && u.trial_expiry < now) {
        await db.updateUser(u.user_id, {
          trial_expiry: null,
          trial_started_at: null
        });

        await bot.restrictChatMember(groupId, u.user_id, {
          can_send_messages: true,
          can_send_media_messages: false
        });

        bot.sendMessage(u.user_id,
"⛔ Trial ended!\nUpgrade with /start 💎");
      }
    }
  } catch (err) {
    console.log("Interval error:", err.message);
  }
}, 60000);

console.log("🚀 Bot starting...");
