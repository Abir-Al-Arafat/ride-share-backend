import { Model, ObjectId } from "mongoose";
import { Request } from "express";

export interface IUser {
  _id?: ObjectId;
  name?: string;
  username?: string;
  email?: string;
  password?: string;
  dob?: Date; //optional
  role?: string;
}

export interface UserRequest extends Request {
  user?: IUser;
}
