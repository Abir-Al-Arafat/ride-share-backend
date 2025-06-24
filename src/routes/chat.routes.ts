import passport from "passport";
import jwt, { JwtPayload } from "jsonwebtoken";
import express from "express";
import "../config/passport"; // import passport setup
import { Request, Response, NextFunction, RequestHandler } from "express";

import { accessChat, fetchChats } from "../controllers/chat.controller";
import multer from "multer";

import {
  isAuthorizedUser,
  isAuthorizedAdmin,
  isAuthorizedSuperAdmin,
} from "../middlewares/authValidationJWT";

import fileUpload from "../middlewares/fileUpload";

const routes = express();
const upload = multer();

// for signing up
routes.post(
  "/access",
  // userValidator.create,
  // authValidator.create,
  isAuthorizedUser,
  upload.none(),
  accessChat
);

routes.get(
  "/fetch",
  // userValidator.create,
  // authValidator.create,
  isAuthorizedUser,
  upload.none(),
  fetchChats
);

export default routes;
