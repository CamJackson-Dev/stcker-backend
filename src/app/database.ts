import mongoose from "mongoose";
import Redis from "ioredis";
import { IS_TESTING, MONGO_URL, REDIS_URL } from "../config";

export const connectToDatabase = async () => {
  await mongoose.connect(MONGO_URL, {
    useNewUrlParser: true,
    useFindAndModify: false,
    useCreateIndex: true,
    useUnifiedTopology: true,
  });
  if (!IS_TESTING) {
    console.log(`Database connected: ${MONGO_URL}`);
  }
};

export const redis = new Redis(REDIS_URL);
