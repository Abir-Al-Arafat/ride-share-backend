import fs from "fs";
import path from "path";
import { Request, Response } from "express";

import { success, failure } from "../utilities/common";
import { IQuery } from "../types/query-params";
import { TUploadFields } from "../types/upload-fields";
import { validationResult } from "express-validator";
import HTTP_STATUS from "../constants/statusCodes";
import User from "../models/user.model";
import Notification from "../models/notification.model";
import { UserRequest } from "../interfaces/user.interface";

const getAllUsers = async (req: Request, res: Response) => {
  try {
    const { role, isAffiliate, isActive } = req.query;
    const query: IQuery = {};

    if (role) {
      query.role = role as string;
    }

    if (typeof isAffiliate !== "undefined") {
      query.isAffiliate = isAffiliate === "true";
    }

    if (typeof isActive !== "undefined") {
      query.isActive = isActive === "true";
    }

    const users = await User.find(query).select("-__v");
    const count = await User.countDocuments(query);

    if (users.length) {
      return res.status(HTTP_STATUS.OK).send(
        success("Successfully received all users", {
          result: users,
          count,
        })
      );
    } else {
      return res.status(HTTP_STATUS.NOT_FOUND).send(failure("Users not found"));
    }
  } catch (error) {
    console.error(error);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Internal server error"));
  }
};

const getOneUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("User was not found"));
    }

    return res
      .status(HTTP_STATUS.OK)
      .send(success("Successfully got the user", user));
  } catch (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).send(`internal server error`);
  }
};

const profile = async (req: Request, res: Response) => {
  try {
    if (!(req as UserRequest)?.user) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("User not logged in"));
    }
    const user = await User.findById((req as UserRequest)?.user?._id).select(
      "-password -__v"
    );

    if (!user) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("User was not found"));
    }
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Successfully got profile", user));
  } catch (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).send(`internal server error`);
  }
};

const updateUserById = async (req: Request, res: Response) => {
  try {
    // const validation = validationResult(req).array();

    // if (validation.length > 0) {
    //   return res
    //     .status(HTTP_STATUS.OK)
    //     .send(failure("Failed to update data", validation[0].msg));
    // }

    if (!req.params.id) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send({ message: "please provide id parameter" });
    }

    // const updatedUserData = req.body;
    const { name, phone } = req.body;

    // const user = await UserModel.findById(req.user._id);
    const user = await User.findById(req.params.id);

    if (!user) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send({ message: "User not found" });
    }

    const files = req.files as TUploadFields;

    console.log("files", files);
    console.log("files", files?.["image"]);

    if (req.files && files?.["image"]) {
      let imageFileName = "";
      if (files?.image[0]) {
        // Add public/uploads link to the image file

        imageFileName = `public/uploads/images/${files?.image[0]?.filename}`;
        user.image = imageFileName;
      }
    }

    user.name = name || user.name;
    user.phone = phone || user.phone;

    await user.save();

    // const updatedUser = await UserModel.findByIdAndUpdate(
    //   req.params.id,
    //   updatedUserData,
    //   // Returns the updated document
    //   { new: true }
    // );

    // if (!updatedUser) {
    //   return res
    //     .status(HTTP_STATUS.NOT_FOUND)
    //     .send({ message: "User not found" });
    // }
    // console.log(updatedUser);
    // updatedUser.__v = undefined;
    return res
      .status(HTTP_STATUS.ACCEPTED)
      .send(success("User data updated successfully", user));
  } catch (error) {
    console.log(error);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send({ message: "INTERNAL SERVER ERROR" });
  }
};

const updateProfileByUser = async (req: Request, res: Response) => {
  try {
    const { name, phone, image } = req.body;
    console.log("body", req.body);
    const user = await User.findById((req as UserRequest).user?._id);
    if (!user) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send({ message: "User not found" });
    }

    const files = req.files as TUploadFields;

    console.log("files", files);
    console.log("files", files?.["image"]);

    if (req.files && files?.["image"]) {
      let imageFileName = "";
      if (files?.image[0]) {
        // Delete old image file if it exists
        if (user.image) {
          const oldImagePath = path.join(__dirname, "../", user.image);
          fs.unlink(oldImagePath, (err) => {
            if (err) {
              console.error("Failed to delete old image:", err);
            }
          });
        }

        // Add public/uploads link to the new image file
        imageFileName = `public/uploads/images/${files?.image[0]?.filename}`;
        user.image = imageFileName;
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      (req as UserRequest).user?._id,
      req.body,
      { new: true }
    );

    if (!updatedUser) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send({ message: "User not found" });
    }

    console.log(updatedUser);
    await user.save();
    return res
      .status(HTTP_STATUS.ACCEPTED)
      .send(success("Profile updated successfully", updatedUser));
  } catch (error) {
    console.log(error);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send({ message: "INTERNAL SERVER ERROR" });
  }
};

// Controller to get notifications by userId
const getNotificationsByUserId = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Please provide userId"));
    }

    // Fetch the user to check if they exist
    const user = await User.findById(userId).populate("notifications");

    if (!user) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("User does not exist"));
    }
    // Return the user's notifications
    res.status(HTTP_STATUS.OK).send({
      message: "Notifications fetched successfully",
      notifications: user.notifications,
    });
    // .json({
    //   message: "Notifications fetched successfully",
    //   notifications: user.notifications,
    // });
  } catch (error) {
    console.error(error);
    res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json({ message: "Internal server error" });
  }
};

// Controller to get notifications
const getAllNotifications = async (req: Request, res: Response) => {
  try {
    // Fetch the user to check if they exist
    const notifications = await Notification.find();

    if (!notifications) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("notification does not exist"));
    }

    res.status(HTTP_STATUS.OK).send({
      message: "All Notifications fetched successfully",
      notifications: notifications,
    });
  } catch (error) {
    console.error(error);
    res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json({ message: "Internal server error" });
  }
};

const updateUserCurrentLocation = async (req: UserRequest, res: Response) => {
  try {
    if (!req.user || !req.user?._id) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .send(failure("please login to update your location"));
    }
    const { longitude, latitude } = req.body;

    if (!longitude || !latitude) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Longitude and latitude are required"));
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          currentLocation: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
        },
      },
      { new: true }
    );
    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).send(failure("User not found"));
    }

    return res
      .status(HTTP_STATUS.OK)
      .send(
        success("Location updated", { currentLocation: user.currentLocation })
      );
  } catch (err) {
    console.log(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Internal server error"));
  }
};

export {
  getAllUsers,
  getOneUserById,
  getNotificationsByUserId,
  getAllNotifications,
  updateUserById,
  profile,
  updateProfileByUser,
  updateUserCurrentLocation,
};
