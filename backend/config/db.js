const mongoose = require("mongoose");

// Every document goes out as { id: "<string>", ...fields } with no _id / __v / password_hash,
// so the API keeps the same shape it had with PostgreSQL.
mongoose.set("strictQuery", true);
mongoose.set("toJSON", {
  virtuals: false,
  versionKey: false,
  transform(doc, ret) {
    ret.id = String(ret._id);
    delete ret._id;
    delete ret.password_hash;
    return ret;
  },
});

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is missing. Add it to backend/.env (see .env.example).");
  }
  await mongoose.connect(uri);
  console.log(`MongoDB connected: ${mongoose.connection.name}`);
}

module.exports = connectDB;
