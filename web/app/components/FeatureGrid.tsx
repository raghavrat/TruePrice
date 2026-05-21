const FEATURES = [
  {
    title: "Per-site impact",
    body: "A floating badge on every page shows that site's live resource cost as you browse.",
  },
  {
    title: "Combined totals",
    body: "Your popup rolls up everything into hour, day, week, and month views — water, CO₂, energy, and land.",
  },
  {
    title: "Category breakdown",
    body: "See where your footprint really goes: video, AI, social, search, and more.",
  },
  {
    title: "Smart estimates",
    body: "Known sites use a curated model; unknown ones are profiled once by AI and cached — so it stays fast and cheap.",
  },
  {
    title: "Private by default",
    body: "Tracking happens locally. Only anonymized domain names are ever sent for profiling. Cloud sync is opt-in.",
  },
  {
    title: "Relatable numbers",
    body: "Abstract kWh become phone charges, water bottles, and kilometers driven.",
  },
];

export function FeatureGrid() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <h2 className="text-center text-3xl font-bold tracking-tight">
        Everything your browser never told you
      </h2>
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
          >
            <h3 className="text-lg font-semibold text-gray-900">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">{f.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
