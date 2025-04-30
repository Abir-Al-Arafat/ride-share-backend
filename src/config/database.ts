import mongoose from "mongoose";

const databaseConnection = async (callback: () => void): Promise<void> => {
  try {
    const dbUrl = process.env.DATABASE_URL;

    if (dbUrl) {
      const client = await mongoose.connect(dbUrl);
      if (client) {
        console.log("✅ Database connected");
        callback();
      } else {
        console.log("❌ Failed to connect to the database");
      }
    } else {
      console.log("❌ DATABASE_URL is not provided in environment variables");
    }
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
  }
};

export default databaseConnection;
