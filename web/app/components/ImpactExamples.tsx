const EXAMPLES = [
  { activity: "1 hour of HD video", water: "16 L water", extra: "≈ 32 water bottles" },
  { activity: "1 hour of AI chat", water: "32 L water", extra: "≈ 0.2 bathtubs" },
  { activity: "1 hour of social scroll", water: "9 L water", extra: "≈ 18 water bottles" },
  { activity: "1 hour of reading news", water: "5 L water", extra: "≈ 10 water bottles" },
];

export function ImpactExamples() {
  return (
    <section className="bg-gray-950 py-20 text-white">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="text-center text-3xl font-bold tracking-tight">
          An hour online, in real terms
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm text-gray-400">
          Rough estimates — your actual numbers depend on quality, device, and grid.
          TruePrice computes them from your real activity.
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {EXAMPLES.map((e) => (
            <div
              key={e.activity}
              className="rounded-2xl border border-white/10 bg-white/5 p-6"
            >
              <div className="text-sm text-gray-300">{e.activity}</div>
              <div className="mt-3 text-2xl font-bold text-emerald-300">{e.water}</div>
              <div className="mt-1 text-xs text-gray-400">{e.extra}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
