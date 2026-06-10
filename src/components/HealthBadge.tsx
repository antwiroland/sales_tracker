import { HEALTH, HEALTH_LABELS, type Health } from "@/lib/constants";
import { Badge } from "./ui";

export function HealthBadge({ health }: { health: Health }) {
  const color =
    health === HEALTH.GREEN ? "green" : health === HEALTH.AMBER ? "amber" : "red";
  return <Badge color={color}>{HEALTH_LABELS[health]}</Badge>;
}

export function healthDotClass(health: Health): string {
  return health === HEALTH.GREEN
    ? "bg-emerald-500"
    : health === HEALTH.AMBER
      ? "bg-amber-500"
      : "bg-red-500";
}

export function healthBarClass(health: Health): string {
  return health === HEALTH.GREEN
    ? "bg-emerald-500"
    : health === HEALTH.AMBER
      ? "bg-amber-500"
      : "bg-red-500";
}
