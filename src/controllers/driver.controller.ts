import { Request, Response } from "express";
import User from "../models/user.model";
import Notification from "../models/notification.model";
import { success, failure } from "../utilities/common";
import HTTP_STATUS from "../constants/statusCodes";
import { UserRequest } from "../interfaces/user.interface";

const searchDrivers = async (req: Request, res: Response) => {
  try {
    const { latitude, longitude, radius = 5000 } = req.body; // radius in meters
    console.log("latitude", latitude);
    console.log("typeof latitude", typeof Number(latitude));
    console.log("longitude", longitude);
    console.log("typeof longitude", typeof Number(longitude));
    console.log("typeof radius", typeof radius);

    if (!latitude || !longitude) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("latitude & longitude required"));
    }

    // Find approved drivers within the radius
    const drivers = await User.find({
      driverApprovalStatus: "approved",
      currentLocation: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [Number(longitude), Number(latitude)],
          },
          $maxDistance: radius,
        },
      },
    });

    if (!drivers.length) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("No drivers found"));
    }

    return res.status(HTTP_STATUS.OK).send(success("Drivers found", drivers));
  } catch (err) {
    console.log(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Internal server error"));
  }
};

const requestRide = async (req: Request, res: Response) => {
  try {
    if (!(req as UserRequest)?.user || !(req as UserRequest).user?._id) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("please login to request a ride"));
    }
    const { latitude, longitude, destination, radius = 5000 } = req.body;
    const userId = (req as UserRequest).user?._id;

    // Find drivers as above
    const drivers = await User.find({
      driverApprovalStatus: "approved",
      currentLocation: {
        $near: {
          $geometry: { type: "Point", coordinates: [longitude, latitude] },
          $maxDistance: radius,
        },
      },
    });

    if (!drivers.length) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("No drivers found"));
    }

    // Notify drivers (create notifications)
    const notifications = await Notification.insertMany(
      drivers.map((driver) => ({
        passenger: userId,
        title: "New Ride Request",
        message: `A user requested a ride to ${destination}`,
        type: "service",
        uploader: driver._id,
      }))
    );

    return res
      .status(HTTP_STATUS.OK)
      .send(
        success("Ride request sent to drivers", { drivers, notifications })
      );
  } catch (err) {
    console.log(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Internal server error"));
  }
};

export { searchDrivers, requestRide };
