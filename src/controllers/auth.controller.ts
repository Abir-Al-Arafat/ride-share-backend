import { Request, Response } from "express";
import { validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import twilio from "twilio";
import { success, failure, generateRandomCode } from "../utilities/common";
import User from "../models/user.model";
import Phone from "../models/phone.model";
import Notification from "../models/notification.model";
import passportModel from "../models/passportDocument.model";
import licenceModel from "../models/licence.model";

import HTTP_STATUS from "../constants/statusCodes";
import { emailWithNodemailerGmail } from "../config/email.config";
import { CreateUserQueryParams } from "../types/query-params";

import { IUser } from "../interfaces/user.interface";
import { TUploadFields } from "../types/upload-fields";
import passport from "passport";
// import { UserRequest } from "./users.controller";

export interface UserRequest extends Request {
  user?: IUser;
}

const sendVerificationCodeToPhone = async (req: Request, res: Response) => {
  try {
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID as string,
      process.env.TWILIO_AUTH_TOKEN as string
    );

    const { phone } = req.body;

    if (!phone) {
      return res.status(400).send(success("Phone number is required"));
    }

    const phoneNumberVerifyCode = generateRandomCode(4);

    const newPhone = await Phone.create({
      email: phone,
      phoneNumberVerifyCode,
    });

    const message = await client.messages.create({
      body: `Your verification code is ${phoneNumberVerifyCode}`,
      from: "+14176203785",
      to: phone,
    });

    await newPhone.save();

    console.log("verification", message);

    return res.status(HTTP_STATUS.OK).send(
      success("Verification code sent successfully", {
        message,
      })
    );
  } catch (err) {
    console.log(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("INTERNAL SERVER ERROR"));
  }
};

const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { email, emailVerifyCode } = req.body;

    if (!email || !emailVerifyCode) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Please provide phone number and code"));
    }

    const isVerified = await User.findOne({
      email,
      emailVerifyCode,
    });

    if (isVerified) {
      isVerified.emailVerified = true;
      await isVerified.save();
      return res
        .status(HTTP_STATUS.OK)
        .send(success("Email verified successfully"));
    }
    return res
      .status(HTTP_STATUS.BAD_REQUEST)
      .send(failure("Invalid verification code"));
  } catch (err) {
    console.log(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(`INTERNAL SERVER ERROR`);
  }
};

const signup = async (req: Request, res: Response) => {
  try {
    // const validation = validationResult(req).array();
    // console.log(validation);
    // if (validation.length > 0) {
    //   return res
    //     .status(HTTP_STATUS.OK)
    //     .send(failure("Failed to add the user", validation[0].msg));
    // }

    // if (req.body.role === "admin") {
    //   return res
    //     .status(HTTP_STATUS.UNPROCESSABLE_ENTITY)
    //     .send(failure(`Admin cannot be signed up`));
    // }

    console.log("req.body", req.body);

    if (!req.body.email || !req.body.password) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("please provide mail and password"));
    }

    const emailCheck = await User.findOne({ email: req.body.email });

    if (emailCheck && !emailCheck.emailVerified) {
      const emailVerifyCode = generateRandomCode(4);
      emailCheck.emailVerifyCode = emailVerifyCode;
      await emailCheck.save();

      const emailData = {
        email: emailCheck.email,
        subject: "Account Activation Email",
        html: `
                        <div style="max-width: 500px; background: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1); text-align: center; font-family: Arial, sans-serif;">
        <h6 style="font-size: 16px; color: #333;">Hello, ${
          emailCheck?.name || emailCheck?.email || "User"
        }</h6>
        <p style="font-size: 14px; color: #555;">Your email verification code is:</p>
        <div style="font-size: 24px; font-weight: bold; color: #d32f2f; background: #f8d7da; display: inline-block; padding: 10px 20px; border-radius: 5px; margin-top: 10px;">
          ${emailVerifyCode}
        </div>
        <p style="font-size: 14px; color: #555;">Please use this code to verify your email.</p>
      </div>
                        
                      `,
      };
      emailWithNodemailerGmail(emailData);

      return res
        .status(HTTP_STATUS.OK)
        .send(success("Please verify your email"));
    }

    if (emailCheck) {
      return res
        .status(HTTP_STATUS.UNPROCESSABLE_ENTITY)
        .send(failure(`User with email: ${req.body.email} already exists`));
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    const emailVerifyCode = generateRandomCode(4);

    const newUser = await User.create({
      email: req.body.email,
      roles: req.body.roles || "user",
      password: hashedPassword,
      emailVerifyCode,
    });

    const emailData = {
      email: req.body.email,
      subject: "Account Activation Email",
      html: `
                    <h6>Hello, ${newUser?.name || newUser?.email || "User"}</h6>
                    <p>Your email verification code is <h6>${emailVerifyCode}</h6> to verify your email</p>
                    
                  `,
    };

    emailWithNodemailerGmail(emailData);

    const expiresIn = process.env.JWT_EXPIRES_IN
      ? parseInt(process.env.JWT_EXPIRES_IN, 10)
      : 3600; // default to 1 hour if not set

    // const token = jwt.sign(
    //   newUser.toObject(),
    //   process.env.JWT_SECRET ?? "default_secret",
    //   {
    //     expiresIn,
    //   }
    // );

    // payload, secret, JWT expiration
    const token = jwt.sign(
      {
        _id: newUser._id,
        roles: newUser.roles,
      },
      process.env.JWT_SECRET ?? "default_secret",
      {
        expiresIn,
      }
    );
    res.setHeader("Authorization", token);
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production" ? true : false,
      maxAge: expiresIn * 1000,
    });
    if (newUser) {
      return res
        .status(HTTP_STATUS.OK)
        .send(success("Account created successfully ", { newUser, token }));
    }
    return res
      .status(HTTP_STATUS.BAD_REQUEST)
      .send(failure("Account couldnt be created"));
  } catch (err) {
    console.log(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Internal server error"));
  }
};

const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Please provide email and password"));
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res
        .status(HTTP_STATUS.UNPROCESSABLE_ENTITY)
        .send(failure("Invalid email or password"));
    }

    const isMatch = await bcrypt.compare(password, user.password!);

    if (!isMatch) {
      return res
        .status(HTTP_STATUS.UNPROCESSABLE_ENTITY)
        .send(failure("Invalid email or password"));
    }

    const expiresIn = process.env.JWT_EXPIRES_IN
      ? parseInt(process.env.JWT_EXPIRES_IN, 10)
      : 3600; // default to 1 hour if not set

    // const token = jwt.sign(
    //   user.toObject(),
    //   process.env.JWT_SECRET ?? "default_secret",
    //   {
    //     expiresIn,
    //   }
    // );

    // payload, secret, JWT expiration
    const token = jwt.sign(
      {
        _id: user._id,
        roles: user.roles,
      },
      process.env.JWT_SECRET ?? "default_secret",
      {
        expiresIn,
      }
    );

    res.setHeader("Authorization", token);

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production" ? true : false,
      maxAge: expiresIn * 1000,
    });

    return res
      .status(HTTP_STATUS.OK)
      .send(success("Login successful", { user, token }));
  } catch (err) {
    console.log(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Internal server error"));
  }
};

const sendOTP = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Please provide email"));
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(HTTP_STATUS.UNPROCESSABLE_ENTITY)
        .send(failure("User not found"));
    }

    const otp = generateRandomCode(4);

    user.emailVerifyCode = otp;

    user.emailVerified = false;

    await user.save();

    const emailData = {
      email: user.email,
      subject: "OTP Verification",
      html: `
                    <h6>Hello, ${user.name || user.email || "User"}</h6>
                    <p>Your OTP is <h6>${otp}</h6> to verify your account</p>
                    
                  `,
    };

    emailWithNodemailerGmail(emailData);

    return res
      .status(HTTP_STATUS.OK)
      .send(success("OTP sent successfully", { otp }));
  } catch (err) {
    console.log(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Internal server error"));
  }
};

const resetPassword = async (req: Request, res: Response) => {
  try {
    const validation = validationResult(req).array();
    console.log(validation);
    if (validation.length > 0) {
      return res
        .status(HTTP_STATUS.OK)
        .send(failure("Password reset failed", validation[0].msg));
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(HTTP_STATUS.UNPROCESSABLE_ENTITY)
        .send(failure("User not found"));
    }

    if (!user.emailVerified) {
      return res
        .status(HTTP_STATUS.UNPROCESSABLE_ENTITY)
        .send(failure("Please verify your email first"));
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;

    await user.save();

    return res
      .status(HTTP_STATUS.OK)
      .send(success("Password reset successfully"));
  } catch (err) {
    console.log(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Internal server error"));
  }
};

const changePassword = async (req: UserRequest, res: Response) => {
  try {
    // const validation = validationResult(req).array();
    // console.log(validation);
    // if (validation.length > 0) {
    //   return res
    //     .status(HTTP_STATUS.OK)
    //     .send(failure("Password reset failed", validation[0].msg));
    // }

    const { oldPassword, newPassword, confirmNewPassword } = req.body;

    if (!oldPassword || !newPassword || !confirmNewPassword) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(
          failure(
            "Please provide old password, new password and confirm new password"
          )
        );
    }

    const user = await User.findById(req.user?._id).select("+password");

    if (!user) {
      return res
        .status(HTTP_STATUS.UNPROCESSABLE_ENTITY)
        .send(failure("User not found, please login "));
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password!);

    if (!isMatch) {
      return res
        .status(HTTP_STATUS.UNPROCESSABLE_ENTITY)
        .send(failure("Old password is incorrect"));
    }

    if (newPassword !== confirmNewPassword) {
      return res
        .status(HTTP_STATUS.UNPROCESSABLE_ENTITY)
        .send(failure("New password and confirm password do not match"));
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;

    await user.save();

    return res
      .status(HTTP_STATUS.OK)
      .send(success("Password changed successfully"));
  } catch (err) {
    console.log(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Internal server error"));
  }
};

const becomeADriver = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    if (!req.user || !req.user._id) {
      return res
        .status(HTTP_STATUS.UNPROCESSABLE_ENTITY)
        .send(failure("User not logged in"));
    }
    const user = await User.findById(req.user._id);
    if (!user) {
      return res
        .status(HTTP_STATUS.UNPROCESSABLE_ENTITY)
        .send(failure("User not found"));
    }
    const validation = validationResult(req).array();
    console.log(validation);
    if (validation.length > 0) {
      return res
        .status(HTTP_STATUS.OK)
        .send(failure("Failed to add the user", validation[0].msg));
    }

    const { name, phone, address, drivingCity } = req.body;

    const files = req.files as TUploadFields;
    console.log("files", files);

    if (
      !req.files ||
      files?.["passportFront"]?.length === 0 ||
      files?.["passportBack"]?.length === 0
    ) {
      return res
        .status(HTTP_STATUS.UNPROCESSABLE_ENTITY)
        .send(failure("Please upload your passport front and back images"));
    }

    if (
      !req.files ||
      files?.["drivingLicenseFront"]?.length === 0 ||
      files?.["drivingLicenseBack"]?.length === 0
    ) {
      return res
        .status(HTTP_STATUS.UNPROCESSABLE_ENTITY)
        .send(
          failure("Please upload your driving license front and back images")
        );
    }

    let passportFront = "";
    let passportBack = "";

    if (req.files && files?.["passportFront"] && files?.["passportBack"]) {
      if (files?.passportFront[0] && files?.passportBack[0]) {
        // Add public/uploads link to the new image file
        passportFront = `public/uploads/images/${files?.passportFront[0]?.filename}`;
        passportBack = `public/uploads/images/${files?.passportBack[0]?.filename}`;
      }
    }

    let drivingLicenseFront = "";
    let drivingLicenceBack = "";
    if (
      req.files &&
      files?.["drivingLicenseFront"] &&
      files?.["drivingLicenceBack"]
    ) {
      if (files?.drivingLicenseFront[0] && files?.drivingLicenceBack[0]) {
        // Add public/uploads link to the new image file
        drivingLicenseFront = `public/uploads/images/${files?.drivingLicenseFront[0]?.filename}`;
        drivingLicenceBack = `public/uploads/images/${files?.drivingLicenceBack[0]?.filename}`;
      }
    }
    let licence;
    let passport;
    if (
      passportFront &&
      passportBack &&
      drivingLicenseFront &&
      drivingLicenceBack
    ) {
      licence = await licenceModel.create({
        user: req.user._id,
        frontImageUrl: drivingLicenseFront,
        backImageUrl: drivingLicenceBack,
      });
      passport = await passportModel.create({
        user: req.user._id,
        frontImageUrl: passportFront,
        backImageUrl: passportBack,
      });

      if (!passport) {
        return res
          .status(HTTP_STATUS.UNPROCESSABLE_ENTITY)
          .send(failure("Failed to save passport"));
      }

      if (!licence) {
        return res
          .status(HTTP_STATUS.UNPROCESSABLE_ENTITY)
          .send(failure("Failed to save driving licence"));
      }
    }
    let selfieImage = "";
    if (req.files && files?.["image"] && files?.["image"][0]) {
      // Add public/uploads link to the new image file
      selfieImage = `public/uploads/images/${files?.image[0]?.filename}`;
    }
    if (selfieImage) {
      user.selfieForDriverApproval = selfieImage;
    }

    user.name = name || user.name;
    user.phone = phone || user.phone;
    user.address = address || user.address;
    user.drivingCity = drivingCity || user.drivingCity;

    if (passport) user.passportDocument = (passport as any)._id;
    if (licence) user.licenceDocument = (licence as any)._id;

    user.driverApprovalStatus = "pending";

    await user.save();

    return res
      .status(HTTP_STATUS.OK)
      .send(success("User added successfully", user));
  } catch (err) {
    console.log(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Internal server error"));
  }
};

export {
  signup,
  becomeADriver,
  login,
  sendVerificationCodeToPhone,
  sendOTP,
  verifyEmail,
  resetPassword,
  changePassword,
};
