import express from "express";
import { Request, Response, NextFunction, RequestHandler } from "express";
import {
  getAllUsers,
  getOneUserById,
  getNotificationsByUserId,
  getAllNotifications,
  updateUserById,
  profile,
  updateProfileByUser,
  updateUserCurrentLocation,
} from "../controllers/users.controller";

import {
  isAuthorizedUser,
  isAuthorizedAdmin,
  isAuthorizedSuperAdmin,
} from "../middlewares/authValidationJWT";

import fileUpload from "../middlewares/fileUpload";

const routes = express();

// /api/users

routes.get("/", getAllUsers);

// /api/users/123
routes.get("/:id", getOneUserById);

routes.get("/auth/profile", isAuthorizedUser, profile);

// /api/users

routes.patch(
  "/auth/update-profile-by-user",
  isAuthorizedUser,
  fileUpload(),
  updateProfileByUser
);

routes.patch("/update-location", isAuthorizedUser, updateUserCurrentLocation);

export default routes;
