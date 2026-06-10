import { connectDB } from "./db";
import { AuditLog } from "@/models";
import type { AuditAction } from "./constants";

interface AuditInput {
  actorId?: string;
  actorName?: string;
  action: AuditAction;
  entity?: string;
  entityId?: string;
  meta?: Record<string, unknown>;
  ip?: string;
}

/** Append an audit-trail entry. Failures are swallowed so they never break a request. */
export async function audit(input: AuditInput): Promise<void> {
  try {
    await connectDB();
    await AuditLog.create({
      actorId: input.actorId,
      actorName: input.actorName ?? "",
      action: input.action,
      entity: input.entity ?? "",
      entityId: input.entityId,
      meta: input.meta ?? {},
      ip: input.ip ?? "",
    });
  } catch (err) {
    console.error("[audit] failed to write log:", err);
  }
}
