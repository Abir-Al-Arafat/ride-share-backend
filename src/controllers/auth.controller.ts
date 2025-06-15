import { Request, Response } from "express";
import { validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import twilio from "twilio";
import { success, failure, generateRandomCode } from "../utilities/common";
import User from "../models/user.model";
import Phone from "../models/phone.model";
import Notification from "../models/notification.model";
import passportIdentityModel from "../models/passportIdentity.model";
import Licence from "../models/licence.model";
import Vehicle from "../models/vehicle.model";

import HTTP_STATUS from "../constants/statusCodes";
import { emailWithNodemailerGmail } from "../config/email.config";
import { CreateUserQueryParams } from "../types/query-params";

import { TUploadFields } from "../types/upload-fields";
import { UserRequest } from "../interfaces/user.interface";

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

    if (user?.googleId) {
      return res
        .status(HTTP_STATUS.UNPROCESSABLE_ENTITY)
        .send(failure("Please login with google account"));
    }

    if (!user) {
      return res
        .status(HTTP_STATUS.UNPROCESSABLE_ENTITY)
        .send(failure("Invalid email or password"));
    }

    if (!user.password) {
      return res
        .status(HTTP_STATUS.UNPROCESSABLE_ENTITY)
        .send(failure("password not set"));
    }

    if (!user.emailVerified) {
      return res
        .status(HTTP_STATUS.UNPROCESSABLE_ENTITY)
        .send(failure("Please verify your email"));
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
  req: UserRequest,
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
        .send(failure("Failed to apply as a driver", validation[0].msg));
    }

    const {
      name,
      phone,
      address,
      drivingCity,
      carModel,
      manufactureYear,
      vin,
    } = req.body;

    const files = req.files as TUploadFields;
    console.log("files", files);
    console.log("req.files", req.files);
    console.log(
      `files?.["passportIdFront"]?.length`,
      files?.["passportIdFront"]?.length
    );
    console.log(
      `files?.["passportIdBack"]?.length`,
      files?.["passportIdBack"]?.length
    );

    if (
      !req.files ||
      !files?.["passportIdFront"]?.length ||
      !files?.["passportIdBack"]?.length
    ) {
      return res
        .status(HTTP_STATUS.UNPROCESSABLE_ENTITY)
        .send(
          failure("Please upload your passport or id front and back images")
        );
    }

    if (
      !req.files ||
      !files?.["drivingLicenseFront"] ||
      !files?.["drivingLicenseBack"]
    ) {
      return res
        .status(HTTP_STATUS.UNPROCESSABLE_ENTITY)
        .send(
          failure("Please upload your driving license front and back images")
        );
    }

    let passportIdFront = "";
    let passportIdBack = "";

    if (req.files && files?.["passportIdFront"] && files?.["passportIdBack"]) {
      if (files?.passportIdFront[0] && files?.passportIdBack[0]) {
        // Add public/uploads link to the new image file
        passportIdFront = `public/uploads/images/${files?.passportIdFront[0]?.filename}`;
        passportIdBack = `public/uploads/images/${files?.passportIdBack[0]?.filename}`;
      }
    }

    let drivingLicenseFront = "";
    let drivingLicenseBack = "";
    if (
      req.files &&
      files?.["drivingLicenseFront"] &&
      files?.["drivingLicenseBack"]
    ) {
      if (files?.drivingLicenseFront[0] && files?.drivingLicenseBack[0]) {
        // Add public/uploads link to the new image file
        drivingLicenseFront = `public/uploads/images/${files?.drivingLicenseFront[0]?.filename}`;
        drivingLicenseBack = `public/uploads/images/${files?.drivingLicenseBack[0]?.filename}`;
      }
    }
    let licence;
    let passportID;
    console.log(
      "passportIdFront",
      passportIdFront,
      passportIdBack,
      drivingLicenseFront,
      drivingLicenseBack
    );
    if (
      passportIdFront &&
      passportIdBack &&
      drivingLicenseFront &&
      drivingLicenseBack
    ) {
      licence = await Licence.create({
        user: req.user._id,
        frontImageUrl: drivingLicenseFront,
        backImageUrl: drivingLicenseBack,
      });
      passportID = await passportIdentityModel.create({
        user: req.user._id,
        frontImageUrl: passportIdFront,
        backImageUrl: passportIdBack,
      });

      if (!passportID) {
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
    if (!req.files || !files?.["image"]) {
      return res
        .status(HTTP_STATUS.UNPROCESSABLE_ENTITY)
        .send(failure("Please upload your selfie image for driver approval"));
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

    if (passportID) user.passportIdentity = (passportID as any)._id;
    if (licence) user.licenceDocument = (licence as any)._id;

    let carImages;
    if (files?.["carImages"] && files?.["carImages"][0]) {
      carImages = files?.carImages.map((file) => {
        return `public/uploads/images/${file.filename}`;
      });
    }

    const vinExists = await Vehicle.findOne({ vin });
    if (vinExists) {
      return res
        .status(HTTP_STATUS.UNPROCESSABLE_ENTITY)
        .send(failure("VIN already exists"));
    }

    const newVehicle = await Vehicle.create({
      user: user._id,
      carModel,
      manufactureYear,
      vin,
      images: carImages,
    });

    if (!newVehicle) {
      return res
        .status(HTTP_STATUS.UNPROCESSABLE_ENTITY)
        .send(failure("Failed to save vehicle details"));
    }

    user.driverApprovalStatus = "pending";

    await user.save();

    const admins = await User.find({
      roles: { $in: ["admin", "superadmin"] },
    }).select("_id");

    if (!admins) {
      console.error("No admins found");
    }

    const adminIds = admins.map((admin) => admin._id);

    const notification = await Notification.create({
      applicant: user._id,
      title: "Driver Application",
      message: "driver application is under review",
      type: "driver_application",
      admins: adminIds,
    });

    if (!notification) {
      console.error("Failed to save notification");
    }

    return res
      .status(HTTP_STATUS.OK)
      .send(success("driver application submitted", user));
  } catch (err) {
    console.log(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Internal server error"));
  }
};

const approveDriver = async (req: UserRequest, res: Response) => {
  try {
    const { driverId } = req.body;
    const driver = await User.findById(driverId);
    console.log("driver", driver);
    if (!driver) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Driver not found"));
    }

    driver.driverApprovalStatus = "approved";
    driver.roles.push("driver");

    await driver.save();
    return res.status(HTTP_STATUS.OK).send(success("Driver approved", driver));
  } catch (err) {
    console.log(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Internal server error"));
  }
};

const rejectDriver = async (req: UserRequest, res: Response) => {
  try {
    const { driverId } = req.body;
    const driver = await User.findById(driverId);
    if (!driver) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Driver not found"));
    }
    driver.driverApprovalStatus = "rejected";
    driver.roles = driver.roles.filter((role) => role !== "driver");
    await driver.save();
    return res.status(HTTP_STATUS.OK).send(success("Driver rejected", driver));
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
  approveDriver,
  rejectDriver,
  login,
  sendVerificationCodeToPhone,
  sendOTP,
  verifyEmail,
  resetPassword,
  changePassword,
};
