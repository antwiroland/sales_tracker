import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { User } from "@/models";
import { ok, route, requireUser, ApiError } from "@/lib/api";
import { audit } from "@/lib/audit";
import { AUDIT_ACTIONS } from "@/lib/constants";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

export const PUT = route(async (req: Request) => {
  const actor = await requireUser();
  await connectDB();
  const { currentPassword, newPassword } = schema.parse(await req.json());

  const user = await User.findById(actor.id).select("+password");
  if (!user) throw new ApiError(404, "User not found");

  const matches = await bcrypt.compare(currentPassword, user.password);
  if (!matches) throw new ApiError(400, "Current password is incorrect");

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  await audit({
    actorId: actor.id,
    actorName: actor.name ?? "",
    action: AUDIT_ACTIONS.PROFILE_UPDATED,
    entity: "User",
    entityId: actor.id,
    meta: { fields: ["password"] },
  });

  return ok({ success: true });
});
