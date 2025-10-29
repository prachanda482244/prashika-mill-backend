import { User } from "../models/user.model.js";
import cron from "node-cron";

const autoUnbanUsers = async () => {
  try {
    console.log("Running auto-unban job...");

    const result = await User.updateMany(
      {
        isBanned: true,
        banUntil: { $lte: new Date() },
      },
      {
        $set: {
          isBanned: false,
          banUntil: null,
          banReason: null,
          noShowCount: 0,
        },
      }
    );

    console.log(`✅ Auto-unbanned ${result.modifiedCount} users`);
  } catch (error) {
    console.error("❌ Auto-unban error:", error.message);
  }
};

// Schedule the task - runs daily at midnight
// '0 0 * * *' = minute 0, hour 0, every day, every month, every day of week
cron.schedule("0 0  * * *", autoUnbanUsers);

console.log("🕐 Auto-unban scheduler started. Will run daily at midnight.");
