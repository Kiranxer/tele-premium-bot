const { groupId } = require("../config");

function setupPromo(bot) {

  const promos = [
`✨ UNLOCK PREMIUM ✨
💎 Only 49⭐
📸 Send Photos
👉 /start`,

`🔥 Upgrade Now!
149⭐ → 7 Days
👑 Lifetime → 399⭐
👉 /start`,

`👑 Premium Users Enjoying 😎
📸 Photos Enabled
💎 VIP Status
👉 /start`
  ];

  function run() {
    const delay = Math.floor(Math.random() * 25 + 20) * 60000;

    setTimeout(() => {
      const msg = promos[Math.floor(Math.random() * promos.length)];
      bot.sendMessage(groupId, msg).catch(()=>{});
      run();
    }, delay);
  }

  run();
}

module.exports = setupPromo;
