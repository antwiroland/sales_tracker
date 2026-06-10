import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Notification } from "@/models";
import { ok, route, requireUser } from "@/lib/api";

export const GET = route(async (req: Request) => {
  const user = await requireUser();
  await connectDB();
  const { searchParams } = new URL(req.url);
  const filter: Record<string, unknown> = { userId: user.id };
  if (searchParams.get("unread") === "true") filter.read = false;

  const [notifications, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).limit(50).lean(),
    Notification.countDocuments({ userId: user.id, read: false }),
  ]);
  return ok({ notifications, unreadCount });
});

const patchSchema = z.object({
  ids: z.array(z.string()).optional(),
  all: z.boolean().optional(),
});

export const PATCH = route(async (req: Request) => {
  const user = await requireUser();
  await connectDB();
  const body = patchSchema.parse(await req.json().catch(() => ({})));

  const filter: Record<string, unknown> = { userId: user.id };
  if (!body.all && body.ids?.length) filter._id = { $in: body.ids };

  await Notification.updateMany(filter, { read: true });
  const unreadCount = await Notification.countDocuments({ userId: user.id, read: false });
  return ok({ unreadCount });
});
