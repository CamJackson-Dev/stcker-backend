import { ObjectType, Field, Int, InputType } from "type-graphql";

@ObjectType("Address")
export class AddressType {
  @Field()
  address: string;

  @Field()
  city: string;

  @Field()
  country: string;

  @Field()
  email: string;

  @Field()
  fullname: string;

  @Field()
  phoneNumber: string;

  @Field()
  postalCode: string;

  @Field()
  state: string;
}

@ObjectType("OrderItem")
export class OrderItemType {
  @Field()
  _id: string;

  @Field()
  name: string;

  @Field()
  quantity: number;

  @Field()
  price: number;
}

@ObjectType("Order")
export class OrderType {
  @Field()
  _id: string;

  @Field()
  createdAt: Date;

  @Field()
  grossAmount: number;

  @Field(() => [OrderItemType])
  items: OrderItemType[];

  @Field()
  orderId: string;

  @Field()
  orderStatus: string; // PENDING -> PLACED -> SHIPPING -> DELIVERED

  @Field()
  paymentStatus: string; // CREATED | APPROVED | VOIDED | COMPLETED | PAYER_ACTION_REQUIRED | SAVED

  @Field(() => AddressType)
  shippingDetails: AddressType;

  @Field()
  user: string;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class OrderPagination {
  @Field(() => [OrderType])
  items: OrderType[];

  @Field(() => Int)
  total: number;
}

@InputType()
export class UpdateOrderInput {
  @Field()
  id: string;

  @Field()
  paymentStatus: string; // CREATED | APPROVED | VOIDED | COMPLETED | PAYER_ACTION_REQUIRED | SAVED

  @Field()
  orderStatus: string; // PENDING -> PLACED -> SHIPPING -> DELIVERED
}
