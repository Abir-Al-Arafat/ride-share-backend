import express from "express";

import {
  rideHistoryForPassenger,
  rideHistoryForDriver,
} from "../controllers/ride.controller";
import multer from "multer";

import {
  isAuthorizedUser,
  isAuthorizedAdmin,
  isAuthorizedSuperAdmin,
} from "../middlewares/authValidationJWT";

import fileUpload from "../middlewares/fileUpload";

const routes = express();
const upload = multer();

routes.get(
  "/history/passenger",
  //   upload.none(),
  isAuthorizedUser,
  rideHistoryForPassenger
);

routes.get(
  "/history/driver",
  //   upload.none(),
  isAuthorizedUser,
  rideHistoryForDriver
);

export default routes;
