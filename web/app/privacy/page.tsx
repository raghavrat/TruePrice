import Link from "next/link";
import { SiteFooter } from "../components/SiteFooter";

const POINTS = [
  {
    title: "Tracking is local-first",
    body: "Your browsing activity — active time, bytes, and visit counts — is accumulated in the extension's local storage on your device. Nothing about your activity leaves the browser unless you turn on sync.",
  },
  {
    title: "We never store full URLs",
    body: "Impact is aggregated per domain. Page paths, query strings, and content are never recorded or transmitted.",
  },
  {
    title: "What the AI proxy sees",
    body: "To profile a site we haven't seen before, the extension sends only its bare domain name (e.g. example.com) to our proxy, which returns a resource profile. No user identity, history, or page data is attached.",
  },
  {
    title: "Cloud sync is opt-in",
    body: "If you sign in and enable sync, your aggregate totals (per day, per category) are stored against your account so you can see them across devices. Domain-level rows are stored hashed. You can turn sync off or sign out at any time.",
  },
  {
    title: "The 'all sites' permission",
    body: "The extension requests access to all sites so it can show the on-page badge and measure data transfer. It reads resource-timing metadata only — never the content of the pages you view.",
  },
];

export default function Privacy() {
  return (
    <main className="bg-gray-50">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-900">
          ← Back
        </Link>
        <h1 className="mt-6 text-4xl font-bold tracking-tight">Privacy</h1>
        <p className="mt-4 text-gray-600">
          TruePrice only works if you trust it. Here&apos;s exactly what it does and
          doesn&apos;t do with your data.
        </p>

        <div className="mt-12 space-y-6">
          {POINTS.map((p) => (
            <div key={p.title} className="rounded-2xl border border-gray-200 bg-white p-6">
              <h2 className="font-semibold text-gray-900">{p.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{p.body}</p>
            </div>
          ))}
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
