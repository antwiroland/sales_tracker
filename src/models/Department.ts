import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const DepartmentSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    branchId: { type: Schema.Types.ObjectId, ref: "Branch" },
  },
  { timestamps: true },
);

export type DepartmentDoc = InferSchemaType<typeof DepartmentSchema> & {
  _id: Schema.Types.ObjectId;
};

export const Department: Model<DepartmentDoc> =
  (models.Department as Model<DepartmentDoc>) ||
  model<DepartmentDoc>("Department", DepartmentSchema);
