const plans = {
  buy_1: { price: 4900, days: 1 },
  buy_7: { price: 14900, days: 7 },
  buy_20: { price: 19900, days: 20 },
  buy_life: { price: 39900, days: 9999 }
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
