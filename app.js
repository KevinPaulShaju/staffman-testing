const express = require("express");
const app = express();
const dotenv = require("dotenv");
const connectDB = require("./db");
const routes = require("./routes");
// env config
dotenv.config({ path: "config/config.env" });

// body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// connecting to db
connectDB();

const time = new Date();
const offset = time.getTimezoneOffset();
const offsetinmillis = offset * 60 * 1000;
const dateinmillis = time.getTime();
const localinmillis = dateinmillis - offsetinmillis;
const localdate = new Date(dateinmillis).toISOString();
console.log(localdate)

console.log(offset);

app.get("/", (req, res) => {
  res.send("hey");
});

app.use("/api", routes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`app running on port ${PORT}`);
});
