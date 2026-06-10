import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const AuditLogSchema = new Schema(
  {
    actorId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    actorName: { type: String, default: "" },
    action: { type: String, required: true, index: true },
    entity: { type: String, default: "" },
    entityId: { type: Schema.Types.ObjectId },
    meta: { type: Schema.Types.Mixed, default: {} },
    ip: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export type AuditLogDoc = InferSchemaType<typeof AuditLogSchema> & {
  _id: Schema.Types.ObjectId;
};

export const AuditLog: Model<AuditLogDoc> =
  (models.AuditLog as Model<AuditLogDoc>) ||
  model<AuditLogDoc>("AuditLog", AuditLogSchema);
