const db = require("../database/db");
const { groupId } = require("../config");

function setupGroup(bot) {

  bot.on("message", async (msg) => {
    try {
      // ✅ Only work in your group
      if (!msg.chat || msg.chat.id.toString() !== groupId) return;
      if (!msg.from) return;

      const userId = msg.from.id;
      const user = await db.getUser(userId);

      const now = Date.now();

      // ✅ Check trial status
      const isTrialActive =
        user.trial_expiry && user.trial_expiry > now;

      // ✅ Check premium status
      const isPremiumActive =
        user.is_paid &&
        (user.expiry === "lifetime" || user.expiry > now);

      // 📸 Detect media
      const isMedia =
        msg.photo || msg.video || msg.document || msg.animation;

      // ❌ Block ONLY if user has NO access
      if (isMedia && !isTrialActive && !isPremiumActive) {

        // Delete message
        await bot.deleteMessage(msg.chat.id, msg.message_id);

        // Send private warning (avoid group spam)
        try {
          await bot.sendMessage(userId,
`❌ You can't send photos/videos.

🎁 Use /trial (1 hour free)
💎 Or upgrade using /start`);
        } catch (e) {}

      }

      // ✅ Otherwise allow (trial or premium)

    } catch (err) {
      console.log("Group handler error:", err.message);
    }
  });

}

module.exports = setupGroup;
