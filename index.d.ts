import * as express from "express";
import { IUser } from "./src/interfaces/user.interface";

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}
