import mongoose, { Schema, Document, ObjectId } from "mongoose";
import IRequestedRide from "../interfaces/requestedRide.interface";
// export interface IRequestedRide extends Document {
//   estimatedFare: number;
//   estimatedTimeMinutes: number;
//   distance: number;
//   numberOfKids: number;
//   pickupLatitude: number;
//   pickupLongitude: number;
//   pickupPlace: string;
//   destination: string;
//   passenger: ObjectId;
//   driver: ObjectId;
//   availableDrivers: ObjectId[];
//   status: string;
//   estimatedTimeFormatted: string;
//   estimatedTimeReadable: string;
// }

const RequestedRideSchema = new Schema<IRequestedRide>(
  {
    estimatedFare: { type: Number },
    estimatedTimeMinutes: { type: Number },
    distance: { type: Number },
    numberOfKids: { type: Number },
    pickupLatitude: { type: Number },
    pickupLongitude: { type: Number },
    pickupPlace: { type: String },
    destination: { type: String },
    estimatedTimeFormatted: { type: String },
    estimatedTimeReadable: { type: String },
    passenger: { type: Schema.Types.ObjectId, ref: "User" },
    availableDrivers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    status: {
      type: String,
      enum: [
        "requested",
        "accepted",
        "arrivedAtPickup",
        "in_progress",
        "completed",
        "cancelled",
      ],
      default: "requested",
    },
    driver: { type: Schema.Types.ObjectId, ref: "User" },
    otp: { type: Number },
  },
  { timestamps: true }
);

export default mongoose.model<IRequestedRide>(
  "RequestedRide",
  RequestedRideSchema
);
