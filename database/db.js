const mongoose = require("mongoose");
const { mongo } = require("../config");

mongoose.connect(mongo);

const userSchema = new mongoose.Schema({
  user_id: Number,
  is_paid: { type: Boolean, default: false },
  expiry: { type: String, default: null }
});

const User = mongoose.model("User", userSchema);

async function getUser(userId) {
  let user = await User.findOne({ user_id: userId });
  if (!user) user = await User.create({ user_id: userId });
  return user;
}

async function updateUser(userId, data) {
  return User.findOneAndUpdate(
    { user_id: userId },
    data,
    { upsert: true, new: true }
  );
}

async function getAllUsers() {
  return User.find();
}

module.exports = { getUser, updateUser, getAllUsers };
