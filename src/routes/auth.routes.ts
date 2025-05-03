import express from "express";
import { Request, Response, NextFunction, RequestHandler } from "express";

import {
  signup,
  login,
  sendVerificationCodeToPhone,
  sendOTP,
  verifyEmail,
} from "../controllers/auth.controller";
import multer from "multer";

import { userValidator, authValidator } from "../middlewares/validation";
import {
  isAuthorizedUser,
  isAuthorizedAdmin,
  isAuthorizedSuperAdmin,
} from "../middlewares/authValidationJWT";
// const { authValidator } = require("../middleware/authValidation");
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

// routes.post(
//   "/auth/create-admin",
//   // userValidator.create,
//   // authValidator.create,
//   isAuthorizedSuperAdmin,
//   createAdmin
// );

// routes.post(
//   "/auth/connect-stripe-account",
//   isAuthorizedUser,
//   connectStripeAccount
// );

// routes.post(
//   "/auth/forgot-password",
//   // userValidator.create,
//   // authValidator.create,
//   forgotPassword
// );

// routes.post(
//   "/auth/reset-password",
//   // userValidator.create,
//   // authValidator.create,
//   resetPassword
// );

// routes.post(
//   "/auth/change-password",
//   // userValidator.create,
//   // authValidator.create,
//   changePassword
// );

// // for approving doctor
// routes.post(
//   "/auth/approve-affiliate",
//   // userValidator.create,
//   // authValidator.create,
//   isAuthorizedAdmin,
//   approveAffiliate
// );

// // for canceling doctor
// routes.post(
//   "/auth/cancel-affiliate",
//   // userValidator.create,
//   // authValidator.create,
//   isAuthorizedAdmin,
//   cancelAffiliate
// );

// for logging in
// routes.post("/auth/login-as-doctor", authValidator.login, loginAsDoctor);

// // for logging in
// routes.post("/auth/logout", logout);

export default routes;
