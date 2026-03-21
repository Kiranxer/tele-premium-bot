require("dotenv").config();

module.exports = {
  token: process.env.BOT_TOKEN,
  mongo: process.env.MONGO_URI,
  groupId: process.env.GROUP_ID,
  adminId: process.env.ADMIN_ID,
  webhookUrl: process.env.WEBHOOK_URL,
  port: process.env.PORT || 8000
};
