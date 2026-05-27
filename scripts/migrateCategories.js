const mongoose = require("mongoose");
require("dotenv").config({ path: "../.env" });

const Category = require("../models/Category");

const categories = [
  { name: "Wedding Cakes", slug: "wedding", description: "Multi-tiered masterpieces for your big day", icon: "👰" },
  { name: "Birthday Cakes", slug: "birthday", description: "Custom designs for every age and personality", icon: "🎂" },
  { name: "Photo Cakes", slug: "photo", description: "Edible photo prints on premium sponge", icon: "📸" },
  { name: "Cupcake Towers", slug: "cupcake", description: "Perfect for parties and events", icon: "🧁" },
  { name: "Fondant Cakes", slug: "fondant", description: "Sculpted art you can eat", icon: "🎨" },
  { name: "Cheesecakes", slug: "cheesecake", description: "Light, creamy, irresistible", icon: "🍰" },
];

const migrateCategories = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB.");

    // Check if categories already exist
    const count = await Category.countDocuments();
    if (count > 0) {
      console.log(`Found ${count} existing categories. Deleting them to seed defaults...`);
      await Category.deleteMany({});
    }

    console.log("Inserting default categories...");
    await Category.insertMany(categories);

    console.log("Categories migrated successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

migrateCategories();
