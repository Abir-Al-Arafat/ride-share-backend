import mongoose, { Schema, Document, ObjectId } from "mongoose";

export interface IRequestedRide extends Document {
  estimatedFare: number;
  estimatedTimeMinutes: number;
  distance: number;
  numberOfKids: number;
  pickupLatitude: number;
  pickupLongitude: number;
  pickupPlace: string;
  destination: string;
  passenger: ObjectId;
  availableRiders: ObjectId[];
}

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
    passenger: { type: Schema.Types.ObjectId, ref: "User" },
    availableRiders: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

export default mongoose.model<IRequestedRide>(
  "RequestedRide",
  RequestedRideSchema
);
