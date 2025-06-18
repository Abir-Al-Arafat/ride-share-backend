import { Request, Response } from "express";
import User from "../models/user.model";
import Notification from "../models/notification.model";
import RequestedRide from "../models/requestedRide.model";
import { success, failure } from "../utilities/common";
import HTTP_STATUS from "../constants/statusCodes";
import { IUser, UserRequest } from "../interfaces/user.interface";
import mongoose from "mongoose";
import formatMinutesSeconds from "../utilities/timeFormatter";
import { haversineDistance } from "../utilities/distance";

// Helper to calculate distance between two lat/lng points in kilometers
// function haversineDistance(
//   lat1: number,
//   lon1: number,
//   lat2: number,
//   lon2: number
// ): number {
//   const toRad = (x: number) => (x * Math.PI) / 180;
//   const R = 6371; // Earth's radius in km
//   const dLat = toRad(lat2 - lat1);
//   const dLon = toRad(lon2 - lon1);
//   const a =
//     Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//     Math.cos(toRad(lat1)) *
//       Math.cos(toRad(lat2)) *
//       Math.sin(dLon / 2) *
//       Math.sin(dLon / 2);
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

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

    const estimatedTime = (distance / averageSpeed) * 60; // in minutes (float)

    const {
      formatted: estimatedTimeFormatted,
      readable: estimatedTimeReadable,
    } = formatMinutesSeconds(estimatedTime);

    return res.status(HTTP_STATUS.OK).send(
      success("Estimate calculated", {
        estimatedFare: estimatedFare.toFixed(2),
        estimatedTimeMinutes: Math.ceil(estimatedTime),
        estimatedTimeFormatted, // "1:30"
        estimatedTimeReadable,
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

const requestRide = async (req: Request, res: Response) => {
  try {
    if (!(req as UserRequest).user || !(req as UserRequest).user!._id) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .send(failure("Please login to request a ride"));
    }
    const {
      estimatedFare,
      estimatedTimeMinutes,
      distance,
      numberOfKids,
      pickupLatitude,
      pickupLongitude,
      pickupPlace,
      destination,
    } = req.body;

    const passenger = (req as UserRequest).user?._id;

    if (
      !estimatedFare ||
      !estimatedTimeMinutes ||
      !distance ||
      !numberOfKids ||
      !pickupLatitude ||
      !pickupLongitude ||
      !pickupPlace ||
      !destination
    ) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(
          failure(
            "estimatedFare, estimatedTimeMinutes, distance, numberOfKids, pickupLatitude, pickupLongitude, pickupPlace, destination are required"
          )
        );
    }

    // Find available drivers near the pickup location
    const radius = 5000; // meters, or get from req.body if needed
    const drivers = await User.find({
      driverApprovalStatus: "approved",
      currentLocation: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [pickupLongitude, pickupLatitude],
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
    const driverIds = drivers.map((driver) => driver._id);

    console.log("driverIds", driverIds);
    // Create the requested ride
    const requestedRide = await RequestedRide.create({
      estimatedFare,
      estimatedTimeMinutes,
      distance,
      numberOfKids,
      pickupLatitude,
      pickupLongitude,
      pickupPlace,
      destination,
      passenger,
      availableDrivers: driverIds,
    });

    console.log("requestedRide", requestedRide);

    if (!requestedRide) {
      return res
        .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
        .send(failure("Error creating requested ride"));
    }

    // Notify drivers
    const notifications = await Notification.insertMany(
      drivers.map((driver) => ({
        passenger: passenger,
        title: "New Ride Request",
        message: `A user requested a ride to ${destination}`,
        type: "rideshare_service",
        driver: driver._id,
        requestedRide: requestedRide._id,
      }))
    );

    console.log("notifications", notifications);

    if (!notifications.length) {
      return res
        .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
        .send(failure("Error creating notifications"));
    }

    return res.status(HTTP_STATUS.OK).send(
      success("Ride request created and drivers notified", {
        requestedRide,
        drivers,
      })
    );
  } catch (err) {
    console.log(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Internal server error"));
  }
};

const findRequestedRidesForDriver = async (req: Request, res: Response) => {
  try {
    if (!(req as UserRequest).user || !(req as UserRequest).user!._id) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .send(failure("Please login to find requested rides"));
    }
    console.log("roles ", (req as UserRequest).user?.roles!.includes("driver"));
    console.log("roles ", (req as UserRequest).user?.roles!);
    if (!(req as UserRequest).user?.roles!.includes("driver")) {
      return res
        .status(HTTP_STATUS.FORBIDDEN)
        .send(failure("Only drivers can find requested rides"));
    }

    const { status } = req.query;

    const driverId = (req as UserRequest).user?._id;

    if (!driverId || !status) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("driverId and status are required"));
    }

    const rides = await RequestedRide.find({
      availableDrivers: driverId,
      status: status,
    });

    return res
      .status(HTTP_STATUS.OK)
      .send(success("Requested rides found", rides));
  } catch (err) {
    console.log(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Internal server error"));
  }
};

const requestedRideById = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;

    if (!id) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Requested ride ID is required"));
    }

    const requestedRide = await RequestedRide.findById(id)
      .populate("passenger")
      .populate("availableDrivers");

    if (!requestedRide) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Requested ride not found"));
    }

    return res
      .status(HTTP_STATUS.OK)
      .send(success("Requested ride found", requestedRide));
  } catch (err) {
    console.log(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Internal server error"));
  }
};

const acceptRideRequestByDriver = async (req: UserRequest, res: Response) => {
  try {
    if (!(req as UserRequest).user || !(req as UserRequest).user!._id) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .send(failure("Please login to find requested rides"));
    }
    const { requestedRideId } = req.params;
    const driverId = req.user?._id;

    if (!requestedRideId || !driverId) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("requestedRideId required"));
    }

    // Find the requested ride and populate passenger
    const ride = await RequestedRide.findById(requestedRideId)
      .populate("passenger")
      .select("-createdAt -updatedAt -__v -availableDrivers");

    if (!ride) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Requested ride not found"));
    }

    // if (ride.status === "accepted") {
    //   return res
    //     .status(HTTP_STATUS.BAD_REQUEST)
    //     .send(failure("Ride has already been accepted"));
    // }

    // Find driver and passenger locations
    const driver = await User.findById(driverId);
    const passenger = ride.passenger as any;

    if (!driver?.currentLocation?.coordinates) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Location data missing for driver "));
    }
    if (!passenger?.currentLocation?.coordinates) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Location data missing for passenger"));
    }
    const [driverLng, driverLat] = driver.currentLocation.coordinates;
    const [passengerLng, passengerLat] = passenger.currentLocation.coordinates;

    // Calculate distance in km
    const distance = haversineDistance(
      driverLat,
      driverLng,
      passengerLat,
      passengerLng
    );

    // Estimate time (assuming average speed 30km/h)
    const averageSpeed = 30; // km/h

    const estimatedTime = (distance / averageSpeed) * 60; // in minutes (float)
    const minutes = Math.floor(estimatedTime);
    const seconds = Math.round((estimatedTime - minutes) * 60);

    const estimatedTimeFormatted = `${minutes}:${seconds
      .toString()
      .padStart(2, "0")}`; // e.g., "1:30"
    const estimatedTimeReadable = `${minutes} minute${
      minutes !== 1 ? "s" : ""
    }${seconds > 0 ? ` ${seconds} second${seconds !== 1 ? "s" : ""}` : ""}`; // e.g., "1 minute 30 seconds"

    // Update ride status to accepted and save driver info if needed
    ride.status = "accepted";
    ride.driver = driverId; // If you want to track which driver accepted
    await ride.save();

    // const notification = await Notification.create({
    //   passenger: passenger._id,
    //   driver: driver._id,
    //   title: "Ride accepted",
    //   message: "Your ride has been accepted by a driver",
    // });

    return res.status(HTTP_STATUS.OK).send(
      success("Ride accepted", {
        ride,
        passenger,
        driverLocation: driver.currentLocation,
        passengerLocation: passenger.currentLocation,
        distance: distance.toFixed(2),
        estimatedTimeMinutes: Math.ceil(estimatedTime),
        estimatedTimeFormatted, // "1:30"
        estimatedTimeReadable,
      })
    );
  } catch (err) {
    console.log(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Internal server error"));
  }
};

export {
  searchDrivers,
  requestRide,
  requestedRideById,
  acceptRideRequestByDriver,
  estimateRide,
  findRequestedRidesForDriver,
};
