require("dotenv").config();
const mongoose = require("mongoose");
const Admin = require("./models/admin");

async function fixAdminPassword() {
  await mongoose.connect(process.env.MONGODB_URI);

  await Admin.deleteMany({ username: "admin" });

  const admin = new Admin({ username: "admin", password: "QuiX3nt!" });
  await admin.save(); // pre-save hook hashes the password

  console.log("Admin recreated with hashed password.");
  await mongoose.disconnect();
}

fixAdminPassword().catch(console.error);
