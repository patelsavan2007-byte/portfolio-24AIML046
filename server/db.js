import mongoose from "mongoose";

const DEFAULT_MONGO_URI =
  `mongodb+srv://patelsavan2007_db_user:${encodeURIComponent("Fa08OUZOgTYdlZzL")}@cluster0.nbnbold.mongodb.net/taskdb?retryWrites=true&w=majority&appName=Cluster0`;

export async function connectDB() {
  const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || DEFAULT_MONGO_URI;
  try {
    console.log("Connecting to MongoDB with URI:", MONGO_URI.replace(/(mongodb\+srv:\/\/[^:]+:)[^@]+(@.*)/, "$1*****$2"));
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB Atlas connected successfully.");
  } catch (error) {
    console.error("MongoDB Atlas connection failed:", error.message);
    console.error(error);
    throw error;
  }
}
