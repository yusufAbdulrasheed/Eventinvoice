// Wipes every document in every collection of the database MONGO_URI points
// to — including users. Irreversible; there is no undo. If that same
// connection string is also what your deployed server uses, this deletes
// live production data, not just local/dev data.
//
// Usage:
//   node scripts/resetDatabase.js            (run from server/, asks you to confirm)
//   node scripts/resetDatabase.js --yes       (skips the prompt — for scripted use)
//   npm run db:reset                          (same as the first form)

import mongoose from "mongoose";
import dotenv from "dotenv";
import readline from "readline";

dotenv.config();

const CONFIRM_PHRASE = "DELETE ALL DATA";
const skipPrompt = process.argv.includes("--yes") || process.argv.includes("-y");

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (answer) => { rl.close(); resolve(answer); }));
}

async function main() {
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI is not set — check server/.env");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  const dbName = mongoose.connection.name;
  const collections = await mongoose.connection.db.listCollections().toArray();
  const names = collections.map((c) => c.name);

  console.log(`\nConnected to database: "${dbName}"`);
  console.log(`Collections that will be fully cleared: ${names.join(", ") || "(none found)"}\n`);

  if (!skipPrompt) {
    const answer = await ask(`This is IRREVERSIBLE. Type "${CONFIRM_PHRASE}" to proceed: `);
    if (answer.trim() !== CONFIRM_PHRASE) {
      console.log("Confirmation did not match — nothing was deleted.");
      await mongoose.disconnect();
      process.exit(0);
    }
  }

  for (const name of names) {
    const { deletedCount } = await mongoose.connection.db.collection(name).deleteMany({});
    console.log(`Cleared ${name}: ${deletedCount} document${deletedCount === 1 ? "" : "s"} removed`);
  }

  console.log("\nDatabase reset complete.");
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("Reset failed:", err);
  process.exit(1);
});
