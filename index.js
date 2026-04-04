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

// 🤖 Bot (NO polling)
const bot = new TelegramBot(token);

// Setup handlers
const plans = setupPayments(bot);
setupCommands(bot);
setupGroup(bot);
setupAdmin(bot);
setupPromo(bot);

// 🌐 Health routes (Koyeb requirement)
app.get("/", (req, res) => {
  res.send("🤖 Bot is running!");
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
app.listen(port, async () => {
  console.log(`🌐 Server running on port ${port}`);

  try {
    await bot.setWebHook(`${webhookUrl}/bot${token}`);
    console.log("✅ Webhook set");
  } catch (err) {
    console.error("❌ Webhook error:", err);
  }
});

// 💰 Payment success handler
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

    await db.incrementPurchase(userId);

    // ✅ Allow media
    bot.restrictChatMember(groupId, userId, {
      can_send_messages: true,
      can_send_media_messages: true
    });

    // 🔔 Notify admin
    bot.sendMessage(adminId,
`💰 NEW PAYMENT

👤 ${msg.from.first_name}
🆔 ${userId}
📦 ${plan.days} days`);

    bot.sendMessage(userId, "🎉 Premium Activated! Enjoy 💎");
  }
});

// ⏳ GLOBAL CHECKER (Premium + Trial + Reminders)
setInterval(async () => {
  const users = await db.getAllUsers();
  const now = Date.now();

  for (let u of users) {

    // =========================
    // 💎 PREMIUM EXPIRY
    // =========================
    if (
      u.is_paid &&
      u.expiry !== "lifetime" &&
      u.expiry < now
    ) {
      await db.updateUser(u.user_id, { is_paid: false });

      bot.restrictChatMember(groupId, u.user_id, {
        can_send_messages: true,
        can_send_media_messages: false
      });

      bot.sendMessage(u.user_id,
"⚠️ Your premium expired.\nUpgrade again 💎");
    }

    // =========================
    // 🎁 TRIAL REMINDERS
    // =========================
    if (u.trial_expiry && u.trial_started_at) {

      const elapsed = now - u.trial_started_at;

      // ⏳ 30 min
      if (elapsed > 30 * 60 * 1000 && elapsed < 31 * 60 * 1000) {
        bot.sendMessage(u.user_id,
"⏳ 30 MIN LEFT!\nUpgrade now 💎");
      }

      // ⚠️ 10 min
      if (
        now > u.trial_expiry - 10 * 60 * 1000 &&
        now < u.trial_expiry - 9 * 60 * 1000
      ) {
        bot.sendMessage(u.user_id,
"⚠️ Only 10 minutes left!\n👉 /start");
      }

      // 🚨 1 min
      if (
        now > u.trial_expiry - 60 * 1000 &&
        now < u.trial_expiry
      ) {
        bot.sendMessage(u.user_id,
"🚨 LAST MINUTE!\nUpgrade NOW 💎🔥");
      }
    }

    // =========================
    // ❌ TRIAL EXPIRY
    // =========================
    if (
      !u.is_paid &&
      u.trial_expiry &&
      u.trial_expiry < now
    ) {
      await db.updateUser(u.user_id, {
        trial_expiry: null,
        trial_started_at: null
      });

      bot.restrictChatMember(groupId, u.user_id, {
        can_send_messages: true,
        can_send_media_messages: false
      });

      bot.sendMessage(u.user_id,
`⛔ TRIAL ENDED!

You experienced premium 😎

💎 Continue for just 49⭐
👉 /start`);
    }
  }
}, 60000);

console.log("🚀 Bot starting...");
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
