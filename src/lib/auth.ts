import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { authConfig } from "./auth.config";
import { connectDB } from "./db";
import { User } from "@/models";
import type { Role } from "./constants";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        await connectDB();
        const user = await User.findOne({ email: email.toLowerCase() })
          .select("+password firstName lastName email role branchId profilePhoto isActive")
          .lean();

        if (!user || !user.isActive) return null;
        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return null;

        // Best-effort last-login stamp (don't block sign-in on failure).
        User.updateOne({ _id: user._id }, { lastLoginAt: new Date() }).catch(() => {});

        return {
          id: String(user._id),
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          role: user.role as Role,
          branchId: user.branchId ? String(user.branchId) : null,
          image: user.profilePhoto?.url || null,
        };
      },
    }),
  ],
});
