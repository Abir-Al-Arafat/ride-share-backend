import { Document, ObjectId } from "mongoose";
export default interface IRequestedRide extends Document {
  estimatedFare: number;
  estimatedTimeMinutes: number;
  distance: number;
  numberOfKids: number;
  pickupLatitude: number;
  pickupLongitude: number;
  pickupPlace: string;
  destination: string;
  passenger: ObjectId;
  driver: ObjectId;
  availableDrivers: ObjectId[];
  status: string;
  estimatedTimeFormatted: string;
  estimatedTimeReadable: string;
  otp: Number;
}
