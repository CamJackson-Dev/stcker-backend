import { ObjectType, Field, Int, InputType } from "type-graphql";
import { ProductType } from "./product";

@ObjectType("User", { description: "A user" })
export class UserType {
  @Field()
  _id: string;

  @Field(() => [ProductType])
  carts: ProductType[];

  @Field()
  createdAt: Date;

  @Field()
  email: string;

  @Field()
  isEmailVerified: boolean;

  @Field(() => [ProductType])
  favourites: ProductType[];

  @Field()
  firstname: string;

  @Field()
  lastname: string;

  @Field()
  updatedAt: Date;

  @Field()
  role: string;
}

@ObjectType()
export class UserPagination {
  @Field(() => [UserType])
  items: UserType[];

  @Field(() => Int)
  total: number;
}

@InputType()
export class EditProfileInput {
  @Field()
  firstname: string;

  @Field()
  lastname: string;

  @Field()
  email: string;
}

@InputType()
export class ChangePasswordInput {
  @Field()
  password: string;

  @Field()
  newPassword: string;
}
