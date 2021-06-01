import mongoose from "mongoose";

import { IOrder, orderSchema } from "./order";
import { IProduct, productSchema } from "./product";
import { IRequest, requestSchema } from "./request";
import { IUser, userSchema } from "./user";

export const Product = mongoose.model<IProduct>("Product", productSchema);
export const User = mongoose.model<IUser>("User", userSchema);
export const Request = mongoose.model<IRequest>("Request", requestSchema);
export const Order = mongoose.model<IOrder>("Order", orderSchema);
