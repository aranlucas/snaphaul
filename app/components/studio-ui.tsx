import Link from "next/link";
import type { ReactNode } from "react";

export function Icon({
  name,
  className = "",
}: {
  name: "camera" | "arrow" | "plus" | "close" | "copy" | "check" | "refresh" | "image";
  className?: string;
}) {
  const paths: Record<typeof name, ReactNode> = {
    camera: (
      <>
        <path d="M4 7h4l2-3h4l2 3h4v13H4Z" />
        <circle cx="12" cy="13" r="4" />
      </>
    ),
    arrow: (
      <>
        <path d="M4 12h16M14 6l6 6-6 6" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    copy: (
      <>
        <rect x="8" y="8" width="12" height="13" rx="2" />
        <path d="M16 8V3H3v13h5" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    refresh: (
      <>
        <path d="M20 8a8 8 0 1 0 0 8M20 3v5h-5" />
      </>
    ),
    image: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8" cy="8" r="1" />
        <path d="m3 17 6-6 4 4 3-3 5 5" />
      </>
    ),
  };
  return (
    <svg
      className={`icon ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="Snaphaul home">
      <span className="brand-mark">
        <Icon name="camera" />
      </span>
      snaphaul<span className="brand-dot">.</span>
    </Link>
  );
}

export function Footer() {
  return (
    <footer className="site-footer wrap">
      <Brand />
      <p>Photos in. A head start out.</p>
      <nav aria-label="Legal">
        <Link href="/terms">Terms</Link>
        <Link href="/privacy">Privacy</Link>
      </nav>
    </footer>
  );
}
