import express from "express";

import {
  sendMessage,
  fetchAllMessages,
} from "../controllers/message.controller";
import multer from "multer";

import { isAuthorizedUser } from "../middlewares/authValidationJWT";

import fileUpload from "../middlewares/fileUpload";

const routes = express();
const upload = multer();

routes.post("/send", upload.none(), isAuthorizedUser, sendMessage);

routes.get(
  "/get-all-messages/:chatId",
  //   upload.none(),
  isAuthorizedUser,
  fetchAllMessages
);

export default routes;
