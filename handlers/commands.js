const db = require("../database/db");
const { groupId } = require("../config");

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function setupCommands(bot) {

  // 🚀 START COMMAND (Premium UI)
  bot.onText(/\/start/, async (msg) => {
    const userId = msg.from.id;

    await db.getUser(userId); // ensure user exists

    bot.sendMessage(userId,
`✨ UNLOCK PREMIUM ✨

📸 Send Photos in Group
💎 VIP Badge
⚡ No Restrictions

🎁 Try FREE trial for 1 hour!

💰 PLANS:
⚡ 49⭐ → 1 Day  
🔥 149⭐ → 7 Days  
🚀 199⭐ → 20 Days  
👑 399⭐ → Lifetime  

👇 Choose your plan`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🎁 Start Free Trial", callback_data: "start_trial" }],
          [{ text: "⚡ 1 Day - 49⭐", callback_data: "buy_1" }],
          [{ text: "🔥 7 Days - 149⭐", callback_data: "buy_7" }],
          [{ text: "🚀 20 Days - 199⭐", callback_data: "buy_20" }],
          [{ text: "👑 Lifetime - 399⭐", callback_data: "buy_life" }]
        ]
      }
    });
  });

  // 🎁 TRIAL BUTTON HANDLER
  bot.on("callback_query", async (q) => {
    if (q.data !== "start_trial") return;

    const userId = q.from.id;
    let user = await db.getUser(userId);

    const today = getToday();

    // 🔄 Reset daily
    if (user.last_trial_date !== today) {
      await db.updateUser(userId, {
        trial_used_today: false,
        last_trial_date: today
      });
      user.trial_used_today = false;
    }

    // ❌ Already used
    if (user.trial_used_today) {
      return bot.sendMessage(userId,
"⛔ You already used today's free trial.\nCome back tomorrow 🔄");
    }

    // ⏳ Start trial
    const now = Date.now();
    const expiry = now + (60 * 60 * 1000);

    await db.updateUser(userId, {
      trial_used_today: true,
      trial_expiry: expiry,
      trial_started_at: now,
      last_trial_date: today
    });

    // ✅ Allow media in group
    bot.restrictChatMember(groupId, userId, {
      can_send_messages: true,
      can_send_media_messages: true
    });

    bot.sendMessage(userId,
`🎁 FREE TRIAL ACTIVATED!

⏳ Duration: 1 Hour
📸 You can now send photos in group

⚠️ Upgrade before it ends to keep access 💎`);
  });

  // 🎁 DIRECT /trial COMMAND (optional)
  bot.onText(/\/trial/, async (msg) => {
    const userId = msg.from.id;
    let user = await db.getUser(userId);

    const today = getToday();

    // Reset daily
    if (user.last_trial_date !== today) {
      await db.updateUser(userId, {
        trial_used_today: false,
        last_trial_date: today
      });
      user.trial_used_today = false;
    }

    if (user.trial_used_today) {
      return bot.sendMessage(userId,
"⛔ You already used today's trial.\nTry again tomorrow!");
    }

    const now = Date.now();
    const expiry = now + (60 * 60 * 1000);

    await db.updateUser(userId, {
      trial_used_today: true,
      trial_expiry: expiry,
      trial_started_at: now,
      last_trial_date: today
    });

    bot.restrictChatMember(groupId, userId, {
      can_send_messages: true,
      can_send_media_messages: true
    });

    bot.sendMessage(userId,
`🎁 FREE TRIAL STARTED!

⏳ 1 Hour Access
📸 Send photos freely

💎 Upgrade anytime using /start`);
  });

}

module.exports = setupCommands;
