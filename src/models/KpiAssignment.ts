import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const KpiAssignmentSchema = new Schema(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    kpiId: { type: Schema.Types.ObjectId, ref: "Kpi", required: true },
    targetValue: { type: Number, required: true, min: 0 },
    month: { type: Number, required: true, min: 1, max: 12, index: true },
    year: { type: Number, required: true, index: true },
    assignedBy: { type: Schema.Types.ObjectId, ref: "User" },
    notes: { type: String, default: "" },
  },
  { timestamps: true },
);

// One assignment per employee + KPI + period.
KpiAssignmentSchema.index(
  { employeeId: 1, kpiId: 1, month: 1, year: 1 },
  { unique: true },
);

export type KpiAssignmentDoc = InferSchemaType<typeof KpiAssignmentSchema> & {
  _id: Schema.Types.ObjectId;
};

export const KpiAssignment: Model<KpiAssignmentDoc> =
  (models.KpiAssignment as Model<KpiAssignmentDoc>) ||
  model<KpiAssignmentDoc>("KpiAssignment", KpiAssignmentSchema);
