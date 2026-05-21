// Static mock of the extension popup, used in the hero.
const METRICS = [
  { label: "Water", value: "12.4 L", sub: "≈ 25 water bottles", accent: "text-blue-600" },
  { label: "CO₂", value: "184 g", sub: "≈ 1.1 km driven", accent: "text-amber-600" },
  { label: "Energy", value: "0.38 kWh", sub: "≈ 31 phone charges", accent: "text-emerald-600" },
  { label: "Land", value: "0.34 m²", sub: "", accent: "text-stone-600" },
];

const BARS = [
  { w: "42%", c: "bg-red-500" },
  { w: "23%", c: "bg-violet-500" },
  { w: "18%", c: "bg-pink-500" },
  { w: "17%", c: "bg-sky-500" },
];

const SITES = [
  { d: "youtube.com", v: "6.1 L · 0.18 kWh" },
  { d: "chatgpt.com", v: "3.0 L · 0.09 kWh" },
  { d: "reddit.com", v: "1.4 L · 0.04 kWh" },
];

export function PopupPreview() {
  return (
    <div className="w-[320px] rounded-2xl border border-gray-200 bg-gray-50 p-4 text-gray-900 shadow-2xl">
      <div className="mb-3 flex items-center gap-2">
        <span className="h-3 w-3 rounded-full bg-emerald-500" />
        <span className="text-sm font-bold">TruePrice</span>
      </div>

      <div className="flex gap-1 rounded-lg bg-gray-200 p-1 text-[11px] font-medium">
        {["Hour", "Day", "Week", "Month"].map((r, i) => (
          <span
            key={r}
            className={`flex-1 rounded-md px-2 py-1 text-center ${
              i === 1 ? "bg-white shadow" : "text-gray-500"
            }`}
          >
            {r}
          </span>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {METRICS.map((m) => (
          <div key={m.label} className="rounded-xl bg-white p-3 shadow-sm">
            <div className="text-[11px] font-medium text-gray-500">{m.label}</div>
            <div className={`mt-1 text-base font-bold ${m.accent}`}>{m.value}</div>
            {m.sub && <div className="mt-0.5 text-[10px] text-gray-400">{m.sub}</div>}
          </div>
        ))}
      </div>

      <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-gray-200">
        {BARS.map((b, i) => (
          <div key={i} className={b.c} style={{ width: b.w }} />
        ))}
      </div>

      <div className="mt-3 space-y-1">
        {SITES.map((s) => (
          <div
            key={s.d}
            className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-[11px] shadow-sm"
          >
            <span className="font-medium text-gray-800">{s.d}</span>
            <span className="text-gray-500">{s.v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
