import { Request, Response } from "express";
import Chat from "../models/chat.model";
import User from "../models/user.model";
import { success, failure } from "../utilities/common";
import HTTP_STATUS from "../constants/statusCodes";
import { UserRequest } from "../interfaces/user.interface";

// create/fetch 1 on 1 chat
const accessChat = async (req: UserRequest, res: Response) => {
  try {
    if (!(req as UserRequest).user || !(req as UserRequest).user!._id) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .send(failure("Please login to create/access chat"));
    }

    const { userId } = req.body; // the userId of the person you want to chat with
    if (!userId) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Please provide user id you want to connect with"));
    }
    const loggedInUserId = (req as UserRequest).user!._id;

    let isChat = await Chat.find({
      //   isGroupChat: false,
      $and: [
        // { users: { $elemMatch: { $eq: req.user._id } } },
        { users: { $elemMatch: { $eq: loggedInUserId } } },
        { users: { $elemMatch: { $eq: userId } } },
      ],
    })
      .populate("users", "email image currentLocation roles username name")
      .populate("latestMessage");

    isChat = await Chat.populate(isChat, {
      path: "latestMessage.sender",
      select: "name image email",
    });
    if (isChat.length)
      return res.status(HTTP_STATUS.OK).send(success("Chat found", isChat[0]));

    const chatData = {
      chatName: "sender",
      users: [loggedInUserId, userId],
    };

    const createdChat = await Chat.create(chatData);
    const fullChat: any = await Chat.findOne({ _id: createdChat._id }).populate(
      "users",
      "email image currentLocation roles username name"
    );

    res.status(HTTP_STATUS.OK).send(success("Chat created", fullChat));
  } catch (error) {
    console.log(error);
    res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Internal server error"));
  }
};

// fetch all chats of a particular user
const fetchChats = async (req: Request, res: Response) => {
  try {
    if (!(req as UserRequest).user || !(req as UserRequest).user!._id) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .send(failure("Please login to fetch your chats"));
    }
    const loggedInUserId = (req as UserRequest).user!._id;
    // Chat.find({ users: { $elemMatch: { $eq: req.user._id } } })
    // Chat.find({ users: { $elemMatch: { $eq: loggedInUserId } } })
    //   .populate("users", "-password")
    //   // .populate("groupAdmin", "-password")
    //   .populate("latestMessage")
    //   .sort({ updatedAt: -1 })
    //   .then(async (results) => {
    //     results = await User.populate(results, {
    //       path: "latestMessage.sender",
    //       select: "name pic email",
    //     });
    //     res.status(HTTP_STATUS.OK).send(results);
    //   });
    let isChat = await Chat.find({
      users: { $elemMatch: { $eq: loggedInUserId } },
    })
      .populate("users", "-password")
      // .populate("groupAdmin", "-password")
      .populate("latestMessage")
      .sort({ updatedAt: -1 });
    isChat = await Chat.populate(isChat, {
      path: "latestMessage.sender",
      select: "name pic email",
    });
    if (isChat.length)
      return res
        .status(HTTP_STATUS.OK)
        .send(success("All Chats found", isChat));
    return res.status(HTTP_STATUS.OK).send(failure("No chats found"));
  } catch (error) {
    console.log(error);
    res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Internal server error"));
  }
};

export { accessChat, fetchChats };
