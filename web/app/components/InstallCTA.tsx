import Link from "next/link";

// Replace with the real Chrome Web Store URL once published.
export const CHROME_STORE_URL = "#";

export function InstallCTA({ label = "Add to Chrome — it's free" }: { label?: string }) {
  return (
    <Link
      href={CHROME_STORE_URL}
      className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-500"
    >
      {label}
    </Link>
  );
}
