import { Document, Schema } from "mongoose";

export interface IProduct extends Document {
  createdAt: string;
  image: string;
  name: string;
  price: number;
  updatedAt: string;
}

export const productSchema = new Schema(
  {
    image: {
      type: String,
      default: false,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);
