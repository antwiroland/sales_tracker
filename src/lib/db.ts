import mongoose from "mongoose";
import dns from "node:dns";

/**
 * Cache the connection across hot reloads in development and across serverless
 * invocations in production so we don't open a new pool on every request.
 */
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  uri: string | null;
}

declare global {
  // eslint-disable-next-line no-var
  var _mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache =
  global._mongooseCache ?? { conn: null, promise: null, uri: null };
global._mongooseCache = cached;

/**
 * Resolve a `mongodb+srv://` URI into a standard `mongodb://` seed-list URI.
 *
 * Some local/ISP DNS resolvers refuse the SRV/TXT lookups the driver performs
 * for `+srv` URIs (querySrv ECONNREFUSED). We do the lookup ourselves with an
 * explicit Resolver pointed at public DNS. Using a dedicated Resolver instance
 * (rather than the thread-global one) means this works reliably even inside
 * Next.js worker threads, which each have their own default DNS resolver.
 */
async function resolveSrvUri(uri: string): Promise<string> {
  const m = uri.match(
    /^mongodb\+srv:\/\/(?:([^:@/]+)(?::([^@/]+))?@)?([^/?]+)(\/[^?]*)?(\?.*)?$/i,
  );
  if (!m) return uri; // not the shape we expect — let the driver try as-is.

  const [, user, pass, host, path = "", search = ""] = m;

  const resolver = new dns.promises.Resolver();
  try {
    resolver.setServers([...new Set(["8.8.8.8", "1.1.1.1", ...dns.getServers()])]);
  } catch {
    /* keep default servers */
  }

  const [srv, txt] = await Promise.all([
    resolver.resolveSrv(`_mongodb._tcp.${host}`),
    resolver.resolveTxt(host).catch(() => [] as string[][]),
  ]);

  const hosts = srv.map((r) => `${r.name}:${r.port}`).join(",");

  const params = new URLSearchParams(search.replace(/^\?/, ""));
  // +srv implies TLS.
  if (!params.has("tls") && !params.has("ssl")) params.set("tls", "true");
  // Merge options advertised via the TXT record (authSource, replicaSet, …).
  for (const kv of txt.flat().join("&").split("&")) {
    if (!kv) continue;
    const eq = kv.indexOf("=");
    const k = eq === -1 ? kv : kv.slice(0, eq);
    const v = eq === -1 ? "" : kv.slice(eq + 1);
    if (!params.has(k)) params.set(k, v);
  }

  const auth = user ? `${user}${pass ? `:${pass}` : ""}@` : "";
  const db = path && path !== "/" ? path : "/";
  const qs = params.toString();
  return `mongodb://${auth}${hosts}${db}${qs ? `?${qs}` : ""}`;
}

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    throw new Error(
      "MONGODB_URI is not set. Add your MongoDB Atlas connection string to .env.local",
    );
  }

  if (!cached.promise) {
    cached.promise = (async () => {
      const uri = MONGODB_URI.startsWith("mongodb+srv://")
        ? await resolveSrvUri(MONGODB_URI)
        : MONGODB_URI;
      return mongoose.connect(uri, { bufferCommands: false });
    })();
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}
