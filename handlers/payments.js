const plans = {
  buy_1: { price: 49, days: 1 },
  buy_7: { price: 149, days: 7 },
  buy_20: { price: 199, days: 20 },
  buy_life: { price: 399, days: 9999 }
};

function setupPayments(bot) {

  bot.on("callback_query", (q) => {
    const plan = plans[q.data];
    if (!plan) return;

    bot.sendInvoice(
      q.message.chat.id,
      "💎 Premium Access",
      `Unlock premium for ${plan.days} days`,
      q.data,
      "",
      "XTR",
      [{ label: "Premium Plan", amount: plan.price }]
    );
  });

  bot.on("pre_checkout_query", (q) => {
    bot.answerPreCheckoutQuery(q.id, true);
  });

  return plans;
}

module.exports = setupPayments;
