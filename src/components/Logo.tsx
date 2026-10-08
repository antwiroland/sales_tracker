import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";

/** The BeBest "B" tile. Same artwork as public/brand/bebest-mark.svg. */
export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      role="img"
      aria-label={APP_NAME}
      className={cn("shrink-0", className)}
    >
      <defs>
        <linearGradient id="bebest-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4f7bff" />
          <stop offset="1" stopColor="#1f38bd" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="url(#bebest-g)" />
      <path
        fill="#fff"
        fillRule="evenodd"
        d="M18 14h16a10 10 0 0 1 6.9 17.2A11 11 0 0 1 35 51H18zM26 21.5v7h7a3.5 3.5 0 0 0 0-7zM26 35.5v8h8a4 4 0 0 0 0-8z"
      />
      <path
        fill="#fbbf24"
        d="M49 9l1.9 5.1L56 16l-5.1 1.9L49 23l-1.9-5.1L42 16l5.1-1.9z"
      />
    </svg>
  );
}

/** "BeBest" wordmark. `onDark` switches to white text for dark/brand backgrounds. */
export function Wordmark({ onDark = false, className }: { onDark?: boolean; className?: string }) {
  return (
    <span className={cn("font-extrabold tracking-tight", className)}>
      <span className={onDark ? "text-white" : "text-slate-900"}>Be</span>
      <span className={onDark ? "text-brand-300" : "text-brand-600"}>Best</span>
    </span>
  );
}
