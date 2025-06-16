import { Request, Response } from "express";
import User from "../models/user.model";
import Notification from "../models/notification.model";
import { success, failure } from "../utilities/common";
import HTTP_STATUS from "../constants/statusCodes";
import { UserRequest } from "../interfaces/user.interface";

// Helper to calculate distance between two lat/lng points in kilometers
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

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
        type: "rideshare_service",
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

const estimateRide = async (req: Request, res: Response) => {
  try {
    const {
      pickupLatitude,
      pickupLongitude,
      destinationLatitude,
      destinationLongitude,
      numberOfKids,
    } = req.body;

    if (
      !pickupLatitude ||
      !pickupLongitude ||
      !destinationLatitude ||
      !destinationLongitude ||
      !numberOfKids
    ) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("All coordinates and number of kids are required"));
    }

    // Calculate distance in kilometers
    const distance = haversineDistance(
      Number(pickupLatitude),
      Number(pickupLongitude),
      Number(destinationLatitude),
      Number(destinationLongitude)
    );

    // Fare calculation logic (customize as needed)
    const baseFare = 5; // base fare in your currency
    const perKmRate = 2; // per km rate
    const perKidRate = 1; // extra per kid

    const estimatedFare =
      baseFare + distance * perKmRate + Number(numberOfKids) * perKidRate;

    // Estimated time (assuming average speed 30km/h)
    const averageSpeed = 30; // km/h
    const estimatedTimeMinutes = (distance / averageSpeed) * 60;

    return res.status(HTTP_STATUS.OK).send(
      success("Estimate calculated", {
        estimatedFare: estimatedFare.toFixed(2),
        estimatedTimeMinutes: Math.ceil(estimatedTimeMinutes),
        distance: distance.toFixed(2),
      })
    );
  } catch (err) {
    console.log(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Internal server error"));
  }
};

export { searchDrivers, requestRide, estimateRide };
