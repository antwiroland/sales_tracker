import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "./auth";
import { can, type Permission } from "./rbac";
import type { Role } from "./constants";

export interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  role: Role;
  branchId?: string | null;
  image?: string | null;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user) return null;
  return session.user as SessionUser;
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new ApiError(401, "Unauthorized");
  return user;
}

export async function requirePermission(permission: Permission): Promise<SessionUser> {
  const user = await requireUser();
  if (!can(user.role, permission)) throw new ApiError(403, "Forbidden");
  return user;
}

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

/** Convert thrown errors into JSON responses with appropriate status codes. */
export function fail(err: unknown) {
  if (err instanceof ApiError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  if (err instanceof ZodError) {
    return NextResponse.json(
      { error: "Validation failed", details: err.flatten() },
      { status: 422 },
    );
  }
  // Duplicate key (e.g. unique invoice/email)
  if (typeof err === "object" && err && (err as { code?: number }).code === 11000) {
    return NextResponse.json({ error: "Duplicate entry" }, { status: 409 });
  }
  console.error("[api] unhandled error:", err);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

/** Wrap a route handler so thrown ApiError / Zod errors become clean responses. */
export function route<Args extends unknown[]>(
  fn: (...args: Args) => Promise<Response>,
) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (err) {
      return fail(err);
    }
  };
}
