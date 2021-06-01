import { ObjectType, Field, Int, InputType } from "type-graphql";

@ObjectType("Product", { description: "A product" })
export class ProductType {
  @Field()
  _id: string;

  @Field()
  createdAt: Date;

  @Field()
  image: string;

  @Field()
  name: string;

  @Field()
  price: number;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class ProductPagination {
  @Field(() => [ProductType])
  items: ProductType[];

  @Field(() => Int)
  total: number;
}

@InputType()
export class ProductInput {
  @Field()
  id: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  image?: string;

  @Field()
  price: number;
}
