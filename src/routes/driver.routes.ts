import express from "express";

import {
  signup,
  becomeADriver,
  approveDriver,
  rejectDriver,
  login,
  sendVerificationCodeToPhone,
  sendOTP,
  verifyEmail,
  resetPassword,
  changePassword,
} from "../controllers/auth.controller";
import { searchDrivers, requestRide } from "../controllers/driver.controller";
import multer from "multer";

import {
  userValidator,
  authValidator,
  driverValidator,
} from "../middlewares/validation";
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
  "/signup",
  // userValidator.create,
  // authValidator.create,
  upload.none(),
  signup
);

routes.get("/search-drivers", upload.none(), isAuthorizedUser, searchDrivers);
routes.post("/request-ride", upload.none(), isAuthorizedUser, requestRide);

routes.post(
  "/become-a-driver",
  // userValidator.create,
  // authValidator.create,
  isAuthorizedUser,
  fileUpload(),
  driverValidator.becomeADriver,
  becomeADriver
);

routes.post(
  "/approve-driver",
  // userValidator.create,
  // authValidator.create,
  // isAuthorizedAdmin,
  upload.none(),
  approveDriver
);

routes.post(
  "/reject-driver",
  // userValidator.create,
  // authValidator.create,
  // isAuthorizedAdmin,
  upload.none(),
  rejectDriver
);

routes.post(
  "/send-verification-code-to-phone",
  // userValidator.create,
  // authValidator.create,
  upload.none(),
  sendVerificationCodeToPhone
);

routes.post(
  "/verify-email",
  // userValidator.create,
  // authValidator.create,
  upload.none(),
  verifyEmail
);

routes.post(
  "/send-otp",
  // userValidator.create,
  // authValidator.create,
  upload.none(),
  sendOTP
);

// for logging in
routes.post("/login", upload.none(), login);

routes.post("/reset-password", authValidator.resetPassword, resetPassword);

routes.post(
  "/change-password",
  upload.none(),
  isAuthorizedUser,
  changePassword
);

export default routes;
