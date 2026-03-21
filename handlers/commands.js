function setupCommands(bot) {
  bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id,
`✨ UNLOCK PREMIUM ✨

📸 Send Photos in Group
💎 VIP Badge
⚡ No Limits

Choose your plan 👇`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: "⚡ 1 Day - 49⭐", callback_data: "buy_1" }],
          [{ text: "🔥 7 Days - 149⭐", callback_data: "buy_7" }],
          [{ text: "🚀 20 Days - 199⭐", callback_data: "buy_20" }],
          [{ text: "👑 Lifetime - 399⭐", callback_data: "buy_life" }]
        ]
      }
    });
  });
}

module.exports = setupCommands;
