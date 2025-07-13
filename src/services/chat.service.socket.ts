import { Server as SocketIOServer, Socket } from "socket.io";
import IMessage, { IUser } from "../interfaces/message.interface";

// 1. create room
export function handleSetup(socket: Socket) {
  socket.on("setup", (userData) => {
    try {
      let parsedUserData = userData;
      if (typeof userData !== "object") {
        try {
          parsedUserData = JSON.parse(userData);
        } catch (parseErr) {
          console.error("Error parsing user data:", parseErr);
          socket.emit("setup_error", { message: "Invalid user data format." });
          return;
        }
      }

      if (
        typeof parsedUserData !== "object" ||
        !parsedUserData ||
        !parsedUserData._id
      ) {
        console.error("Invalid user data:", parsedUserData);
        socket.emit("setup_error", { message: "User data must have an _id." });
        return;
      }
      socket.join(parsedUserData._id);
      socket.emit("connected", { message: "room created." });
      console.log("User setup complete:", parsedUserData._id);
      console.log("User setup complete:", parsedUserData);
    } catch (error) {
      socket.emit("setup_error", { message: "Internal server error." });
    }
  });
}

// 2. join room (param: room id / chatId)
export function handleJoinRoom(socket: Socket) {
  socket.on("join chat", (room) => {
    console.log("User joining room:", room);
    console.log("User joining room room.chatId:", room.chatId);
    console.log("User joining room room.chatId type:", typeof room.chatId);
    socket.join(room.chatId);
    console.log("User joined room:", room);
  });
}

// 3. get message and send to rooms
export function handleNewMessage(socket: Socket) {
  socket.on("new message", (newMessage) => {
    const { chatId, content, sender, users } = newMessage;
    console.log("New message received:", newMessage);
    if (!users)
      return console.error("Users array is required in new message event");

    (users as IUser[]).forEach((user: IUser) => {
      if (
        user._id == (newMessage as IMessage).sender._id ||
        typeof user._id !== "string"
      )
        return; // Skip sending to self or if _id is not a string
      socket.in(user._id).emit("message received", newMessage);
      console.log("Message sent to user:", user._id);
    });
  });
}

export function registerChatHandlers(io: SocketIOServer) {
  io.on("connection", (socket: Socket) => {
    handleSetup(socket);
    handleJoinRoom(socket);
    handleNewMessage(socket);

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
}
