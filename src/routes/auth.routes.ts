import passport from "passport";
import jwt, { JwtPayload } from "jsonwebtoken";
import express from "express";
import "../config/passport"; // import passport setup
import { Request, Response, NextFunction, RequestHandler } from "express";

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

routes.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// 2. Handle Google callback
routes.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/login",
  }),
  async (req, res) => {
    try {
      const user = req.user as any;
      console.log("user", user);
      const expiresIn = process.env.JWT_EXPIRES_IN
        ? parseInt(process.env.JWT_EXPIRES_IN, 10)
        : 3600; // default to 1 hour if not set
      const token = jwt.sign(
        { _id: user._id, roles: user.roles },
        process.env.JWT_SECRET ?? "default_secret",
        { expiresIn }
      );

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 3600000,
      });

      // redirect to frontend with token (optional: include as query param)
      res.redirect(`${process.env.CLIENT_URL}/?token=${token}`);
    } catch (error) {
      console.log("error", error);
      res.status(500).send("Internal Server Error");
    }
  }
);

// for signing up
routes.post(
  "/signup",
  // userValidator.create,
  // authValidator.create,
  upload.none(),
  signup
);

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

// // for logging in
// routes.post("/auth/logout", logout);

export default routes;
