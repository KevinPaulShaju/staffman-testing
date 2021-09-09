const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String },
  active: {
    schedule: { from: { type: Date }, to: { type: Date }, location: [Number] },
    working: { type: Boolean, default: false },
  },
});

const user = mongoose.model("User", UserSchema);

module.exports = user;
