const mongoose = require("mongoose");

async function connectDB(uri) {
  if (!uri) throw new Error("MONGO_URI missing");
  await mongoose.connect(uri);
  console.log("[db] connected");
}

module.exports = {
  connectDB,
};
