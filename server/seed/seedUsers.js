import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

const SEED_USERS = [
  {
    name: "Admin User",
    email: "admin@invoiceapp.test",
    password: "Admin123!",
    plan: "pro",
  },
  {
    name: "Test User",
    email: "user@invoiceapp.test",
    password: "User123!",
    plan: "free",
  },
];

async function seed() {
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI is not set — check server/.env");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB\n");

  for (const seedUser of SEED_USERS) {
    const existing = await User.findOne({ email: seedUser.email });

    if (existing) {
      existing.plan = seedUser.plan;
      await existing.save(); // password untouched — pre-save hook only rehashes if modified
      console.log(`Updated: ${seedUser.email}  (plan: ${seedUser.plan})`);
    } else {
      await User.create(seedUser);
      console.log(`Created: ${seedUser.email}  /  password: ${seedUser.password}  (plan: ${seedUser.plan})`);
    }
  }

  console.log("\nSeed complete.");
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
