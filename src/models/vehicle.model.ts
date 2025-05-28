import mongoose, { Schema, Document, ObjectId } from "mongoose";

export interface IVehicle extends Document {
  user: ObjectId; // Reference to the User
  carModel: string;
  manufactureYear: number;
  vin: string;
  images: string[]; // Array of image URLs or paths
  createdAt: Date;
  updatedAt: Date;
}

const VehicleSchema = new Schema<IVehicle>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    carModel: { type: String, required: true },
    manufactureYear: { type: Number, required: true },
    vin: {
      type: String,
      required: true,
      // unique: true
    },
    images: [{ type: String }], // Store image URLs or file paths
  },
  { timestamps: true }
);

export default mongoose.model<IVehicle>("Vehicle", VehicleSchema);
