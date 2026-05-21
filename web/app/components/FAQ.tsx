const QA = [
  {
    q: "How accurate are the numbers?",
    a: "They're informed estimates, not meter readings. We combine a transferred-bytes energy model with per-category and per-site profiles. Treat them as a directional guide, not a precise audit.",
  },
  {
    q: "Does this slow down my browser?",
    a: "No. All math runs in the background from lightweight signals (active time and bytes). The on-page badge is a tiny isolated element.",
  },
  {
    q: "What data leaves my device?",
    a: "By default, only domain names of sites we haven't profiled yet — never full URLs, page content, or personal data. Cloud sync of your aggregate totals is strictly opt-in.",
  },
  {
    q: "Why does it ask for access to all sites?",
    a: "The per-site badge and byte measurement need to run on the pages you visit. We never read page content beyond resource-timing metadata.",
  },
];

export function FAQ() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-20">
      <h2 className="text-center text-3xl font-bold tracking-tight">Questions</h2>
      <dl className="mt-10 space-y-6">
        {QA.map((item) => (
          <div key={item.q} className="rounded-2xl border border-gray-200 bg-white p-6">
            <dt className="font-semibold text-gray-900">{item.q}</dt>
            <dd className="mt-2 text-sm leading-relaxed text-gray-600">{item.a}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
