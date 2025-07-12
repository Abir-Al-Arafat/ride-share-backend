export interface IUser {
  _id: string;
  [key: string]: any;
}
export default interface IMessage {
  chatId: string;
  content: string;
  sender: IUser;
  users: IUser[];
  [key: string]: any;
}
