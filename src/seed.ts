import "dotenv/config";
import mongoose from "mongoose";
import { MONGO_URL } from "./config";
import { Product } from "./models";
import data from "./data.json";
import { IProduct } from "./models/product";

async function seed() {
  await mongoose.connect(MONGO_URL, {
    useNewUrlParser: true,
    useFindAndModify: false,
    useCreateIndex: true,
    useUnifiedTopology: true,
  });

  await Product.insertMany(data as IProduct[]);

  await mongoose.disconnect();
}

seed();
