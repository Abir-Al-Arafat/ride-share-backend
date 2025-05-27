import mongoose, { Schema, Document, ObjectId } from "mongoose";

export interface IPassportDocument extends Document {
  user: ObjectId; // Reference to the User
  passportNumber?: string;
  frontImageUrl: string; // URL or path to the front image
  backImageUrl: string; // URL or path to the back image
  verified?: boolean;
}

const PassportDocumentSchema = new Schema<IPassportDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    passportNumber: { type: Number },
    frontImageUrl: { type: String, required: true },
    backImageUrl: { type: String, required: true },
    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model<IPassportDocument>(
  "PassportDocument",
  PassportDocumentSchema
);
