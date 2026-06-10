import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const KpiSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    category: { type: String, default: "Sales" },
    unit: { type: String, default: "currency" }, // currency | count | percent
    weight: { type: Number, default: 1, min: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export type KpiDoc = InferSchemaType<typeof KpiSchema> & { _id: Schema.Types.ObjectId };

export const Kpi: Model<KpiDoc> =
  (models.Kpi as Model<KpiDoc>) || model<KpiDoc>("Kpi", KpiSchema);
