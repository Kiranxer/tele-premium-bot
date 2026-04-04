const mongoose = require("mongoose");
const { mongo } = require("../config");

// Connect MongoDB
mongoose.connect(mongo, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// 📦 User Schema
const userSchema = new mongoose.Schema({
  user_id: {
    type: Number,
    required: true,
    unique: true
  },

  // 💎 Premium
  is_paid: {
    type: Boolean,
    default: false
  },

  expiry: {
    type: String, // timestamp OR "lifetime"
    default: null
  },

  // 🎁 Trial System
  trial_used_today: {
    type: Boolean,
    default: false
  },

  trial_expiry: {
    type: Number, // timestamp
    default: null
  },

  trial_started_at: {
    type: Number,
    default: null
  },

  last_trial_date: {
    type: String, // YYYY-MM-DD
    default: null
  },

  // 📊 Analytics (future use 🔥)
  total_purchases: {
    type: Number,
    default: 0
  },

  joined_at: {
    type: Number,
    default: Date.now
  }
});

const User = mongoose.model("User", userSchema);

// 🔍 Get or create user
async function getUser(userId) {
  let user = await User.findOne({ user_id: userId });

  if (!user) {
    user = await User.create({
      user_id: userId
    });
  }

  return user;
}

// 🔄 Update user
async function updateUser(userId, data) {
  return User.findOneAndUpdate(
    { user_id: userId },
    { $set: data },
    { upsert: true, new: true }
  );
}

// 📋 Get all users
async function getAllUsers() {
  return User.find();
}

// ➕ Increment purchase count
async function incrementPurchase(userId) {
  return User.findOneAndUpdate(
    { user_id: userId },
    { $inc: { total_purchases: 1 } },
    { new: true }
  );
}

module.exports = {
  getUser,
  updateUser,
  getAllUsers,
  incrementPurchase
};
