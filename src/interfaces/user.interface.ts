import { Model, ObjectId } from "mongoose";
import { Request } from "express";

export interface IUser {
  _id?: ObjectId | string;
  name?: string;
  username?: string;
  email?: string;
  password?: string;
  dob?: Date; //optional
  role?: string;
  roles?: string[];
  [key: string]: any;
}

export interface UserRequest extends Request {
  user?: IUser;
}
