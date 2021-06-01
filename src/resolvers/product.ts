import { Types, QueryOptions } from "mongoose";
import { Arg, Mutation, Query, Resolver, UseMiddleware } from "type-graphql";

import { IsAdmin } from "../middlewares/auth";
import { Product } from "../models";
import {
  ProductPagination,
  ProductType,
  ProductInput,
} from "../objectTypes/product";
import { ParamsArgs } from "./common";
import { AWS_BUCKET } from "../config";
import { IProduct } from "../models/product";
import { createS3Client } from "../utils/helpers";

@Resolver()
export class ProductResolver {
  @Query(() => ProductPagination)
  async products(@Arg("params", { nullable: true }) args: ParamsArgs) {
    let queryOptions: QueryOptions | null | undefined;

    if (args?.pagination) {
      const { page, perPage } = args.pagination;
      if (page && perPage) {
        queryOptions = {
          limit: perPage,
          skip: (page - 1) * perPage,
        };
      }
    }

    if (args?.sort) {
      const { field, order } = args.sort;
      if (field && order) {
        queryOptions = {
          ...queryOptions,
          sort: { [field]: order === "ASC" ? 1 : -1 },
        };
      }
    }

    return Promise.all([
      Product.find({}, undefined, queryOptions),
      Product.estimatedDocumentCount(),
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

  @Query(() => ProductType)
  async product(@Arg("id") id: string) {
    if (!Types.ObjectId.isValid(id)) throw new Error("Invalid ObjectID");

    const product = await Product.findById(id);
    if (!product) throw new Error("Product not found");

    return product;
  }

  @Query(() => String)
  @UseMiddleware(IsAdmin)
  async getProductPresignedUrl(@Arg("id", { nullable: true }) id?: string) {
    if (id) {
      if (!Types.ObjectId.isValid(id)) throw new Error("Invalid ObjectID");

      const product = await Product.findById(id);
      if (!product) throw new Error("Product not found");
    }
    const productId = id || new Types.ObjectId().toHexString();

    const s3Client = createS3Client();

    const secondsInFiveMinutes = 60 * 5;
    return await s3Client.getSignedUrlPromise("putObject", {
      Bucket: AWS_BUCKET,
      Key: `products/${productId}`,
      Expires: secondsInFiveMinutes,
    });
  }

  @Mutation(() => String)
  @UseMiddleware(IsAdmin)
  async createProduct(@Arg("params") params: ProductInput) {
    const { id, image, name, price } = params;
    if (!Types.ObjectId.isValid(id)) throw new Error("Invalid ObjectID");

    await Product.create({
      _id: id,
      image,
      name,
      price,
    });
    return "Success";
  }

  @Mutation(() => String)
  @UseMiddleware(IsAdmin)
  async updateProduct(@Arg("params") params: ProductInput) {
    const { id, image, name, price } = params;
    if (!Types.ObjectId.isValid(id)) {
      throw new Error("Invalid ObjectID");
    }

    const update: Partial<IProduct> = {
      name,
      price,
    };
    if (image) {
      update.image = image;
    }

    const result = await Product.updateOne(
      { _id: id },
      { $set: update },
      { new: true }
    );

    if (!result.nModified) throw new Error("Product not found");
    return "Success";
  }

  @Mutation(() => String)
  @UseMiddleware(IsAdmin)
  async deleteProduct(@Arg("id") id: string) {
    if (!Types.ObjectId.isValid(id)) throw new Error("Invalid ObjectID");

    const product = await Product.findById(id);
    if (!product) throw new Error("Product not found");

    if (product.image) {
      const s3Client = createS3Client();
      try {
        await s3Client
          .deleteObject({
            Bucket: AWS_BUCKET,
            Key: `products/${id}`,
          })
          .promise();
      } catch (error) {
        throw new Error(error.message);
      }
    }

    await product.deleteOne();
    return "Success";
  }
}
