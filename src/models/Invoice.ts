import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { INVOICE_STATUS } from "@/lib/constants";

const InvoiceSchema = new Schema(
  {
    invoiceNumber: { type: String, required: true, trim: true },
    employeeId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", index: true },
    kpiId: { type: Schema.Types.ObjectId, ref: "Kpi" },

    customerName: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    description: { type: String, default: "" },
    notes: { type: String, default: "" },
    invoiceDate: { type: Date, required: true },

    image: {
      type: new Schema(
        { publicId: { type: String, default: "" }, url: { type: String, default: "" } },
        { _id: false },
      ),
      default: () => ({}),
    },

    status: {
      type: String,
      enum: Object.values(INVOICE_STATUS),
      default: INVOICE_STATUS.SUBMITTED,
      index: true,
    },

    supervisorId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    approvalDate: { type: Date },
    rejectionReason: { type: String, default: "" },
    clarificationNote: { type: String, default: "" },

    // Period the invoice counts toward (derived from invoiceDate at submit time).
    month: { type: Number, index: true },
    year: { type: Number, index: true },
  },
  { timestamps: true },
);

InvoiceSchema.index({ employeeId: 1, status: 1, month: 1, year: 1 });

export type InvoiceDoc = InferSchemaType<typeof InvoiceSchema> & {
  _id: Schema.Types.ObjectId;
};

export const Invoice: Model<InvoiceDoc> =
  (models.Invoice as Model<InvoiceDoc>) || model<InvoiceDoc>("Invoice", InvoiceSchema);
