import mongoose, { Schema, Document, ObjectId } from "mongoose";

export interface IPassportIdentity extends Document {
  user: ObjectId; // Reference to the User
  passportNumber?: string;
  frontImageUrl: string; // URL or path to the front image
  backImageUrl: string; // URL or path to the back image
  verified?: boolean;
}

const PassportIdentitySchema = new Schema<IPassportIdentity>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    passportNumber: { type: Number },
    frontImageUrl: { type: String, required: true },
    backImageUrl: { type: String, required: true },
    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model<IPassportIdentity>(
  "PassportIdentity",
  PassportIdentitySchema
);
