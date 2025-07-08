import express from "express";
import dotenv from "dotenv";
import path from "path";
import cors from "cors";
import cookieParser from "cookie-parser";
import { Request, Response, NextFunction } from "express";
import passport from "passport";
// import io from "socket.io";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import databaseConnection from "./config/database";
import userRouter from "./routes/user.routes";
import authRouter from "./routes/auth.routes";
import serviceRouter from "./routes/service.routes";
import driverRouter from "./routes/driver.routes";
import rideRouter from "./routes/ride.routes";
import chatRouter from "./routes/chat.routes";
import messageRouter from "./routes/message.routes";

const app = express();
dotenv.config();

app.use(cors({ origin: "*", credentials: true }));

app.use(cookieParser()); // Needed to read cookies
app.use(express.json()); // Parses data as JSON
app.use(express.text()); // Parses data as text
app.use(express.urlencoded({ extended: false })); // Parses data as URL-encoded

// google auth using passport
app.use(passport.initialize());
app.use(passport.session());

// ✅ Handle Invalid JSON Errors
app.use(
  (
    err: SyntaxError & { status?: number; body?: any },
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
      return res.status(400).send({ message: "Invalid JSON format" });
    }
    next();
  }
);

app.use("/public", express.static(path.join(__dirname, "public")));

const baseApiUrl = "/api";

app.use(`${baseApiUrl}/users`, userRouter);
app.use(`${baseApiUrl}/auth`, authRouter);
app.use(`${baseApiUrl}/services`, serviceRouter);
app.use(`${baseApiUrl}/drivers`, driverRouter);
app.use(`${baseApiUrl}/rides`, rideRouter);
app.use(`${baseApiUrl}/chats`, chatRouter);
app.use(`${baseApiUrl}/messages`, messageRouter);

app.get("/", (req, res) => {
  return res.status(200).send({
    name: "Patreon",
    developer: "Abir",
    version: "1.0.0",
    description: "Backend server for Patreon",
    status: "success",
  });
});

// ✅ Handle 404 Routes
app.use((req, res) => {
  return res.status(400).send({ message: "Route does not exist" });
});

// ✅ Handle Global Errors
app.use((err: SyntaxError, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  res.status(500).send({ message: "Internal Server Error" });
});

const PORT = process.env.PORT || 3001;

// Create HTTP server and attach Socket.IO
const httpServer = http.createServer(app);
const io = new SocketIOServer(httpServer, {
  // for closing connection after 60 seconds of inactivity
  pingTimeout: 60000, // 60 seconds
  cors: {
    origin: "*", // Adjust as needed for production
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Socket.IO connection handler
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // chat steps:
  // 1. create room
  socket.on("setup", (userData) => {
    try {
      let parsedUserData = userData;
      if (typeof userData !== "object") {
        try {
          parsedUserData = JSON.parse(userData);
        } catch (parseErr) {
          console.error("Error parsing user data:", parseErr);
          // Send error response to client
          socket.emit("setup_error", { message: "Invalid user data format." });
          return;
        }
      }

      if (
        typeof parsedUserData !== "object" ||
        parsedUserData === null ||
        !parsedUserData._id
      ) {
        console.error("Invalid user data:", parsedUserData);
        // Send error response to client
        socket.emit("setup_error", { message: "User data must have an _id." });
        return;
      }
      // create room based on user ID
      socket.join(parsedUserData._id);
      socket.emit("connected", { message: "room created." }); // Success response
      console.log("User setup complete:", parsedUserData._id);
      console.log("User setup complete:", parsedUserData);
    } catch (error) {
      socket.emit("setup_error", { message: "Internal server error." });
    }
  });
  // 2. join room (param: room id / chatId)
  socket.on("join chat", (room) => {
    //create room with room id / chatId
    socket.join(room); // Join the user to the room id
    console.log("User joined room:", room);
  });

  // 3. get message and send to rooms
  socket.on("new message", (newMessage) => {
    const { chatId, content, sender, users } = newMessage;
    console.log("New message received:", newMessage);
    if (!users)
      return console.error("Users array is required in new message event");
    interface User {
      _id: string;
      [key: string]: any;
    }

    interface Message {
      chatId: string;
      content: string;
      sender: User;
      users: User[];
      [key: string]: any;
    }

    (users as User[]).forEach((user: User) => {
      if (user._id == (newMessage as Message).sender._id) return; // Skip sending to self
      socket.in(user._id).emit("message received", newMessage);
    });
    // io.to(chatId).emit("message received", { chatId, content, sender }); // Broadcast to all clients (or use socket.to(room).emit for rooms)
  });

  // Example event
  socket.on("sendMessage", (data) => {
    // Broadcast to all clients (or use socket.to(room).emit for rooms)
    console.log("Message received:", data);
    io.emit("receiveMessage", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

databaseConnection(() => {
  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});

// export { io }; // Export if you want to use io elsewhere
