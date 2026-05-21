import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-gray-500 sm:flex-row">
        <span className="font-semibold text-gray-700">TruePrice</span>
        <nav className="flex gap-6">
          <Link href="/how-it-works" className="hover:text-gray-900">
            How it works
          </Link>
          <Link href="/methodology" className="hover:text-gray-900">
            Methodology
          </Link>
          <Link href="/privacy" className="hover:text-gray-900">
            Privacy
          </Link>
        </nav>
        <span className="text-xs text-gray-400">Estimates, not meter readings.</span>
      </div>
    </footer>
  );
}
