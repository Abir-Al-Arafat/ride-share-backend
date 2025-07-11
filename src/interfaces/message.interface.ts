import { IUser } from "./user.interface";
export interface IMessage {
  chatId: string;
  content: string;
  sender: IUser;
  users: IUser[];
  [key: string]: any;
}
