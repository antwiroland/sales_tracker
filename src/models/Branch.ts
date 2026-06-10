import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const BranchSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, trim: true },
    location: { type: String, default: "" },
    managerId: { type: Schema.Types.ObjectId, ref: "User" },
    logo: {
      type: new Schema(
        { publicId: { type: String, default: "" }, url: { type: String, default: "" } },
        { _id: false },
      ),
      default: () => ({}),
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export type BranchDoc = InferSchemaType<typeof BranchSchema> & { _id: Schema.Types.ObjectId };

export const Branch: Model<BranchDoc> =
  (models.Branch as Model<BranchDoc>) || model<BranchDoc>("Branch", BranchSchema);
