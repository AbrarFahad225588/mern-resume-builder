import mongoose from "mongoose";
import "dotenv/config";
import Template from "../models/Template.js";
import { templateData } from "../data/templatesData.js";
import { connectDb } from "../db/connectDb.js";

const seedTemplates = async () => {
  try {
    // 1. Connect (connectDb validates MONGO_URI and handles the DNS SRV fallback)
    await connectDb();

    // 3. Check if --clear flag is used
    const shouldClear = process.argv.includes('--clear');
    if (shouldClear) {
      const deleted = await Template.deleteMany();
      console.log(`🗑️ Cleared ${deleted.deletedCount} existing templates`);
    }

    // 4. Check if data exists
    if (templateData.length === 0) {
      console.warn("⚠️ No template data found to seed");
      return;
    }

    // 5. Upsert with bulk operation (preserves existing)
    const operations = templateData.map(template => ({
      updateOne: {
        filter: { id: template.id },
        update: { $set: template },
        upsert: true,
      }
    }));

    const result = await Template.bulkWrite(operations);
    
    console.log(`✅ Successfully seeded templates:`);
    console.log(`   📝 Inserted: ${result.upsertedCount} new`);
    console.log(`   🔄 Updated: ${result.modifiedCount} existing`);
    console.log(`   📊 Total: ${templateData.length} templates`);

  } catch (error) {
    console.error("❌ Error seeding templates:", error.message);
    if (error.code === 11000) {
      console.error("   ⚠️ Duplicate key error - check template IDs");
    }
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
};

// Run the script
seedTemplates();