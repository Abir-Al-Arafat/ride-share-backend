import express from "express";
import dotenv from "dotenv";
import path from "path";
import cors from "cors";
import cookieParser from "cookie-parser";
import { Request, Response, NextFunction } from "express";
import passport from "passport";
import http from "http";
import { initSocket } from "./config/socket";
import { registerChatHandlers } from "./services/chat.service.socket";
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
    name: "Kids Ride Sharing Backend",
    developer: "Abir",
    version: "1.0.0",
    description: "Backend server for Kids Ride Sharing Backendnd",
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
const io = initSocket(httpServer);

// Register chat handlers
registerChatHandlers(io);

databaseConnection(() => {
  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
