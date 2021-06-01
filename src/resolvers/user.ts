import { ExpressContext } from "apollo-server-express";
import bcrypt from "bcrypt";
import { QueryOptions, Types } from "mongoose";
import {
  Arg,
  Ctx,
  Mutation,
  Query,
  Resolver,
  UseMiddleware,
} from "type-graphql";

import {
  ChangePasswordInput,
  EditProfileInput,
  UserPagination,
  UserType,
} from "../objectTypes/user";
import { Product, User } from "../models";
import { IsAdmin, IsAuthorized, RateLimit } from "../middlewares/auth";
import { ParamsArgs } from "./common";
import {
  changePasswordSchema,
  editProfileSchema,
  getValidationErrors,
} from "../utils/validation";

@Resolver()
export class UserResolver {
  @Query(() => UserType, { nullable: true })
  async me(@Ctx() { req }: ExpressContext) {
    if (req.user) {
      return await User.findById(req.user._id)
        .populate("favourites")
        .populate("carts");
    }
    return null;
  }

  @Query(() => UserPagination)
  @UseMiddleware(IsAdmin)
  async customers(@Arg("params") { pagination, sort }: ParamsArgs) {
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

    const filter = { role: "Customer" };
    return Promise.all([
      User.find(filter, undefined, queryOptions),
      User.countDocuments(filter),
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

  @Query(() => UserType)
  @UseMiddleware(IsAdmin)
  async customer(@Arg("id") id: string) {
    if (!Types.ObjectId.isValid(id)) throw new Error("Invalid ObjectID");

    const user = await User.findById(id);
    if (!user) throw new Error("User not found");

    return user;
  }

  @UseMiddleware(RateLimit(100), IsAuthorized)
  @Mutation(() => String)
  async addToCart(
    @Arg("productId") productId: string,
    @Ctx() { req }: ExpressContext
  ) {
    if (!Types.ObjectId.isValid(productId)) throw new Error("Invalid ObjectID");

    const user = await User.findById(req.user?._id);
    if (!user) throw new Error("User not found");

    if (user.carts.length >= 50)
      throw new Error("Your cart is full. Please remove some items");

    const product = await Product.findById(productId);
    if (!product) throw new Error("Product not found");

    await user.updateOne({
      $push: { carts: productId },
    });

    return "Success";
  }

  @UseMiddleware(RateLimit(5), IsAuthorized)
  @Mutation(() => String)
  async changePassword(
    @Arg("params") params: ChangePasswordInput,
    @Ctx() { req }: ExpressContext
  ) {
    const { password, newPassword } = params;
    const errors = getValidationErrors(params, changePasswordSchema);
    if (errors) throw new Error(JSON.stringify(errors));

    const user = await User.findById(req.user?._id);
    if (!user) throw new Error("User not found");

    const isSamePassword = await bcrypt.compare(password, user.password);
    if (!isSamePassword)
      throw new Error(
        JSON.stringify({
          password: "Password does not match former password",
        })
      );

    const hashedPassword = await bcrypt.hash(newPassword, 15);
    await user.updateOne({ password: hashedPassword });

    return "Success";
  }

  @UseMiddleware(RateLimit(5), IsAuthorized)
  @Mutation(() => String)
  async editProfile(
    @Arg("params") params: EditProfileInput,
    @Ctx() { req }: ExpressContext
  ) {
    const errors = getValidationErrors(params, editProfileSchema);
    if (errors) throw new Error(JSON.stringify(errors));

    const user = await User.findById(req.user?._id);
    if (!user) throw new Error("User not found");

    try {
      await user.updateOne(params);
    } catch (error) {
      throw new Error(
        JSON.stringify({ email: "A user with this email already exists" })
      );
    }

    return "Success";
  }

  @UseMiddleware(RateLimit(100), IsAuthorized)
  @Mutation(() => String)
  async removeFromCart(
    @Arg("productId") productId: string,
    @Arg("all") all: boolean,
    @Ctx() { req }: ExpressContext
  ) {
    if (!Types.ObjectId.isValid(productId)) throw new Error("Invalid ObjectID");

    const user = await User.findById(req.user?._id);
    if (!user) throw new Error("User not found");

    const product = await Product.findById(productId);
    if (!product) throw new Error("Product not found");

    if (all) {
      await user.updateOne({
        $pull: { carts: productId },
      });
    } else {
      const index = user.carts.indexOf(productId);
      if (index !== -1) {
        user.carts.splice(index, 1);
        await user.save();
      }
    }

    return "Success";
  }

  @UseMiddleware(RateLimit(100), IsAuthorized)
  @Mutation(() => String)
  async toggleFavourites(
    @Arg("productId") productId: string,
    @Ctx() { req }: ExpressContext
  ) {
    if (!Types.ObjectId.isValid(productId)) throw new Error("Invalid ObjectID");

    const user = await User.findById(req.user?._id);
    if (!user) throw new Error("User not found");

    const product = await Product.findById(productId);
    if (!product) throw new Error("Product not found");

    if (user.favourites.includes(productId)) {
      await user.updateOne({
        $pull: { favourites: productId },
      });
    } else {
      if (user.favourites.length >= 100)
        throw new Error("Your favourites is full. Please remove some items");

      await user.updateOne({
        $push: { favourites: productId },
      });
    }

    return "Success";
  }
}
