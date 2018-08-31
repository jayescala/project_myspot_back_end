// Imports
const mongoose = require("mongoose");

const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/myspot";

mongoose.connect(mongoUri, {
  useNewUrlParser: true
});

mongoose.connection.on("connected", () => {
  console.log("Mongoose is connected.");
});

mongoose.connection.on("error", (err) => {
  console.log(err, ": Mongoose error.");
});

mongoose.connection.on("disconnected", () => {
  console.log("Mongoose is disconnected.");
});
