import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { ALL_ROLES, ROLES } from "@/lib/constants";

const ImageSchema = new Schema(
  {
    publicId: { type: String, default: "" },
    url: { type: String, default: "" },
  },
  { _id: false },
);

const UserSchema = new Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ALL_ROLES, default: ROLES.SALES, index: true },
    position: { type: String, default: "" },

    branchId: { type: Schema.Types.ObjectId, ref: "Branch", index: true },
    departmentId: { type: Schema.Types.ObjectId, ref: "Department" },
    supervisorId: { type: Schema.Types.ObjectId, ref: "User", index: true },

    profilePhoto: { type: ImageSchema, default: () => ({}) },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
  },
  { timestamps: true },
);

UserSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`.trim();
});

UserSchema.set("toJSON", { virtuals: true });
UserSchema.set("toObject", { virtuals: true });

export type UserDoc = InferSchemaType<typeof UserSchema> & { _id: Schema.Types.ObjectId };

export const User: Model<UserDoc> =
  (models.User as Model<UserDoc>) || model<UserDoc>("User", UserSchema);
