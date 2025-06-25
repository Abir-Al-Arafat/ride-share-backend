import { Request, Response } from "express";
import { UserRequest } from "../interfaces/user.interface";
import Chat from "../models/chat.model";
import User from "../models/user.model";
import Message from "../models/message.model";
import { success, failure } from "../utilities/common";
import HTTP_STATUS from "../constants/statusCodes";

const sendMessage = async (req: UserRequest, res: Response) => {
  try {
    if (!(req as UserRequest).user || !(req as UserRequest).user!._id) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .send(failure("Please login to send message"));
    }
    const loggedInUserId = (req as UserRequest).user!._id;

    const { chatId, content } = req.body;

    if (!chatId || !content) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Please provide chatId and content"));
    }
    const newMessage = {
      sender: loggedInUserId,
      content,
      chat: chatId,
    };
    let message = await Message.create(newMessage);
    message = await message.populate("sender", "name username email image");
    message = await message.populate("chat");
    message = await Message.populate(message, {
      path: "chat.users",
      select: "name image email",
    });
    await Chat.findByIdAndUpdate(chatId, {
      latestMessage: message,
    });
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Message sent successfully", message));
  } catch (error: any) {
    console.error(error);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure(error.message));
  }
};

const fetchAllMessages = async (req: Request, res: Response) => {
  try {
    const { chatId } = req.params;
    if (!chatId) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Please provide chatId as parameter"));
    }
    const messages = await Message.find({ chat: chatId })
      .populate("sender", "name image email")
      .populate("chat")
      .sort({ createdAt: -1 });
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Messages fetched successfully", messages));
  } catch (error: any) {
    console.error(error);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure(error.message));
  }
};

export { sendMessage, fetchAllMessages };
