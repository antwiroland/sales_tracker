import { connectDB } from "./db";
import { Notification } from "@/models";
import type { NotificationType } from "./constants";

interface NotifyInput {
  userId: string;
  type: NotificationType;
  title: string;
  message?: string;
  link?: string;
}

export async function notify(input: NotifyInput): Promise<void> {
  try {
    await connectDB();
    await Notification.create({
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message ?? "",
      link: input.link ?? "",
    });
  } catch (err) {
    console.error("[notify] failed:", err);
  }
}

export async function notifyMany(inputs: NotifyInput[]): Promise<void> {
  if (inputs.length === 0) return;
  try {
    await connectDB();
    await Notification.insertMany(
      inputs.map((i) => ({
        userId: i.userId,
        type: i.type,
        title: i.title,
        message: i.message ?? "",
        link: i.link ?? "",
      })),
    );
  } catch (err) {
    console.error("[notifyMany] failed:", err);
  }
}
