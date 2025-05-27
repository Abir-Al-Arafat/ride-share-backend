import mongoose, { Schema, Document, ObjectId } from "mongoose";

export interface ILicenceDocument extends Document {
  user: ObjectId; // Reference to the User
  licenceNumber?: string;
  frontImageUrl: string; // URL or path to the front image
  backImageUrl: string; // URL or path to the back image
  verified?: boolean;
  expiryDate?: Date;
}

const LicenceDocumentSchema = new Schema<ILicenceDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    licenceNumber: { type: String },
    frontImageUrl: { type: String, required: true },
    backImageUrl: { type: String, required: true },
    verified: { type: Boolean, default: false },
    expiryDate: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model<ILicenceDocument>(
  "Licence",
  LicenceDocumentSchema
);
