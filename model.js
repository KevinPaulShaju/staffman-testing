const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true},
  email: { type: String, required: true},
  job: {type: String,required: true},
  active: {
    schedule: { from: { type: Date }, to: { type: Date }, location: [Number] },
    working: { type: Boolean, default: false },
  },
});

const user = mongoose.model("User", UserSchema);

module.exports = user;
