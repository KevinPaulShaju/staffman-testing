const mongoose = require("mongoose");

const connectDB = async () => {
  // const DB = process.env.MONGO_URL
  const DB = "mongodb://127.0.0.1:27017/usertest";
  try {
    const conn = await mongoose.connect(DB, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`Database connection established on ${conn.connection.host}`);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

module.exports = connectDB;
