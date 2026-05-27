/**
 * Migration Script: Rename `price` → `pricePerKg` and add new fields
 *
 * This script updates all existing Cake documents in MongoDB:
 *   1. Renames the `price` field to `pricePerKg` (copies value as-is)
 *   2. Adds `isFlavoured: false`
 *   3. Adds `flavours: []`
 *   4. Adds `eggOptionAvailable: false`
 *
 * Usage:
 *   cd backend
 *   node scripts/migrateCakes.js
 */

require("dotenv").config();
const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGO_URI;

async function migrate() {
  console.log("🔌 Connecting to MongoDB...");
  await mongoose.connect(MONGO_URI);
  console.log("✅ Connected.\n");

  const db = mongoose.connection.db;
  const cakesCollection = db.collection("cakes");

  // Find all cakes that still have the old `price` field but no `pricePerKg`
  const cakesToMigrate = await cakesCollection
    .find({ price: { $exists: true }, pricePerKg: { $exists: false } })
    .toArray();

  console.log(`📋 Found ${cakesToMigrate.length} cake(s) to migrate.\n`);

  if (cakesToMigrate.length === 0) {
    console.log("✅ Nothing to migrate — all cakes already have `pricePerKg`.");
    await mongoose.disconnect();
    return;
  }

  let migrated = 0;
  let errors = 0;

  for (const cake of cakesToMigrate) {
    try {
      const result = await cakesCollection.updateOne(
        { _id: cake._id },
        {
          $set: {
            pricePerKg: cake.price,
            isFlavoured: cake.isFlavoured ?? false,
            flavours: cake.flavours ?? [],
            eggOptionAvailable: cake.eggOptionAvailable ?? false,
          },
          $unset: {
            price: "",  // Remove old field
          },
        }
      );

      if (result.modifiedCount === 1) {
        console.log(
          `  ✅ "${cake.name}" — price ₹${cake.price} → pricePerKg ₹${cake.price}/kg`
        );
        migrated++;
      } else {
        console.log(`  ⚠️  "${cake.name}" — no changes made`);
      }
    } catch (err) {
      console.error(`  ❌ "${cake.name}" — Error: ${err.message}`);
      errors++;
    }
  }

  console.log(`\n──────────────────────────────────`);
  console.log(`✅ Migrated: ${migrated}`);
  if (errors > 0) console.log(`❌ Errors:   ${errors}`);
  console.log(`──────────────────────────────────\n`);

  await mongoose.disconnect();
  console.log("🔌 Disconnected from MongoDB.");
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
