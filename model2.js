const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ScheduleSchema = new mongoose.Schema({
  userId: { type: Schema.Types.ObjectId, required: true, ref: "carer" },
  from: { type: Date },
  to: { type: Date },
  location: [Number],
});

const Schedule = mongoose.model("Schedule", ScheduleSchema);

module.exports = Schedule;


// patientId,
// serviceId