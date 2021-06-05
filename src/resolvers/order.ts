// @ts-ignore
import paypal from "@paypal/checkout-server-sdk";
import { ExpressContext } from "apollo-server-express";
import { QueryOptions, Types } from "mongoose";
import { IS_PRODUCTION } from "../config";
import {
  Arg,
  Ctx,
  Mutation,
  Query,
  Resolver,
  UseMiddleware,
} from "type-graphql";

import { IsAdmin, IsAuthorized } from "../middlewares/auth";
import { Order, User } from "../models";
import {
  UpdateOrderInput,
  OrderPagination,
  OrderType,
} from "../objectTypes/order";
import { ProductType } from "../objectTypes/product";
import {
  generateOrderDocumentFields,
  generateOrderRequestBody,
  parseValueIfJSONString,
} from "../utils/helpers";
import { createPaypalClient } from "../utils/services/paypal";
import { ParamsArgs } from "./common";

@Resolver()
export class OrderResolver {
  @UseMiddleware(IsAdmin)
  @Query(() => OrderPagination)
  async orders(@Arg("params") { pagination, sort }: ParamsArgs) {
    let queryOptions: QueryOptions | null | undefined;

    if (pagination) {
      const { page, perPage } = pagination;
      if (page && perPage) {
        queryOptions = {
          limit: perPage,
          skip: (page - 1) * perPage,
        };
      }
    }

    if (sort) {
      const { field, order } = sort;
      if (field && order) {
        queryOptions = {
          ...queryOptions,
          sort: { [field]: order === "ASC" ? 1 : -1 },
        };
      }
    }

    return Promise.all([
      Order.find({}, undefined, queryOptions),
      Order.estimatedDocumentCount(),
    ])
      .then((value) => {
        return {
          items: value[0],
          total: value[1],
        };
      })
      .catch((error) => {
        throw new Error(error.message);
      });
  }

  @UseMiddleware(IsAuthorized)
  @Query(() => [OrderType])
  async userOrders(@Ctx() { req }: ExpressContext) {
    return await Order.find({ user: req.user?._id });
  }

  @UseMiddleware(IsAuthorized)
  @Query(() => OrderType)
  async order(@Arg("id") id: string) {
    if (!Types.ObjectId.isValid(id)) throw new Error("Invalid ObjectID");

    const order = await Order.findById(id);
    if (!order) throw new Error("Order not found");

    return order;
  }

  @UseMiddleware(IsAuthorized)
  @Mutation(() => String)
  async createOrder(@Ctx() { req }: ExpressContext) {
    console.log(IS_PRODUCTION);
    const user = await User.findById(req.user?._id).populate("carts");
    if (!user) throw new Error("User not found");

    const products = user.carts as any as ProductType[];
    if (!products.length)
      throw new Error("Cart is empty. Please add items to your cart");

    try {
      const client = createPaypalClient();
      const request = new paypal.orders.OrdersCreateRequest();
      request.prefer("return=representation");
      request.requestBody(
        generateOrderRequestBody({ products: [...products], shippingFee: 0.0 })
      );
      const order = await client.execute(request);

      return order.result.id;
    } catch (ex) {
      console.log(ex);

      const error = parseValueIfJSONString(ex.message);
      if (typeof error === "string") throw new Error(error);

      throw new Error(error.message);
    }
  }

  @UseMiddleware(IsAuthorized)
  @Mutation(() => String)
  async captureOrder(
    @Arg("orderID") orderID: string,
    @Ctx() { req }: ExpressContext
  ) {
    const user = await User.findById(req.user?._id).populate("carts");
    if (!user) throw new Error("User not found");
    try {
      const request = new paypal.orders.OrdersCaptureRequest(orderID);
      request.requestBody({});
      const client = createPaypalClient();
      const response = await client.execute(request);

      const products = user.carts as any as ProductType[];
      const order = await Order.create(
        generateOrderDocumentFields({ user, order: response, products })
      );

      user.carts = [];
      await user.save();
      if (order.paymentStatus === "COMPLETED") {
        await order.sendConfirmationEmail();
      }

      await order.sendNotificationToAdmin();
      return response.result.id;
    } catch (ex) {
      const error = parseValueIfJSONString(ex.message);
      if (typeof error === "string") throw new Error(error);

      throw new Error(error.message);
    }
  }

  @UseMiddleware(IsAdmin)
  @Mutation(() => String)
  async updateOrder(
    @Arg("params") { id, paymentStatus, orderStatus }: UpdateOrderInput
  ) {
    if (!Types.ObjectId.isValid(id)) throw new Error("Invalid ObjectID");

    const order = await Order.findById(id);
    if (!order) throw new Error("Order not found");

    if (
      order.paymentStatus === "COMPLETED" &&
      order.paymentStatus !== paymentStatus
    ) {
      throw new Error("Payment status cannot be updated after being completed");
    }

    if (
      order.orderStatus === "DELIVERED" &&
      order.orderStatus !== orderStatus
    ) {
      throw new Error("Order status cannot be updated after being delivered");
    }

    if (paymentStatus === "COMPLETED" && order.paymentStatus !== "COMPLETED") {
      await order.sendConfirmationEmail();
    }

    await order.updateOne({ orderStatus, paymentStatus });

    return "Success";
  }
}
