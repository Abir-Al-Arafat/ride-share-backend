import { Request, Response } from "express";
import { UserRequest } from "../interfaces/user.interface";
import HTTP_STATUS from "../constants/statusCodes";
import { success, failure } from "../utilities/common";
import RequestedRide from "../models/requestedRide.model";
const rideHistoryForPassenger = async (
  req: UserRequest,
  res: Response
): Promise<Response> => {
  try {
    if (!(req as UserRequest).user || !(req as UserRequest).user!._id) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .send(failure("Please login to view ride history"));
    }

    const passengerId = (req as UserRequest).user?._id;

    const rides = await RequestedRide.find({ passenger: passengerId })
      .populate("driver")
      .sort({ createdAt: -1 });

    if (!rides || !rides.length) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Ride history not found"));
    }

    return res
      .status(HTTP_STATUS.OK)
      .send(success("Ride history found", rides));
  } catch (err) {
    console.log(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Internal server error"));
  }
};

const rideHistoryForDriver = async (
  req: UserRequest,
  res: Response
): Promise<Response> => {
  try {
    if (!(req as UserRequest).user || !(req as UserRequest).user!._id) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .send(failure("Please login to view ride history"));
    }

    const driverId = (req as UserRequest).user?._id;

    const rides = await RequestedRide.find({ driver: driverId })
      .populate("passenger")
      .sort({ createdAt: -1 });

    if (!rides || !rides.length) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Ride history not found"));
    }

    return res
      .status(HTTP_STATUS.OK)
      .send(success("Ride history found", rides));
  } catch (err) {
    console.log(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Internal server error"));
  }
};

export { rideHistoryForPassenger, rideHistoryForDriver };
