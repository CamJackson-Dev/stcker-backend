import { IUser } from "src/models/user";

declare global {
  namespace Express {
    interface Request {
      user: IUser | null;
    }
  }
}
