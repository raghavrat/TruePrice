import Link from "next/link";
import { SiteFooter } from "../components/SiteFooter";

const COEFFICIENTS = [
  {
    name: "Energy per data transferred",
    value: "0.81 kWh / GB",
    source: "Sustainable Web Design model (v4)",
  },
  {
    name: "Grid carbon intensity (global avg)",
    value: "480 gCO₂ / kWh",
    source: "IEA, ~2023 (regional options in settings)",
  },
  {
    name: "Water intensity of electricity",
    value: "1.8 L / kWh",
    source: "Blended generation + datacenter cooling",
  },
  {
    name: "Land footprint of energy",
    value: "0.0009 m² / kWh",
    source: "Annualized, solar-equivalent",
  },
];

export default function Methodology() {
  return (
    <main className="bg-gray-50">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-900">
          ← Back
        </Link>
        <h1 className="mt-6 text-4xl font-bold tracking-tight">Methodology</h1>
        <p className="mt-4 text-gray-600">
          TruePrice estimates impact in two layers: a per-site resource profile, and
          your actual usage. Energy is the base unit; everything else is derived from it.
        </p>

        <h2 className="mt-12 text-xl font-semibold">The calculation</h2>
        <pre className="mt-4 overflow-x-auto rounded-xl bg-gray-900 p-4 text-xs leading-relaxed text-gray-100">
{`energy (Wh) = whPerMinuteActive × activeMinutes
            + whPerMbTransferred × MB

kWh   = energy / 1000
CO₂   = kWh × gridIntensity × co2Multiplier
water = kWh × 1.8 L/kWh   × waterMultiplier
land  = kWh × 0.0009 m²   × landMultiplier`}
        </pre>

        <h2 className="mt-12 text-xl font-semibold">Base coefficients</h2>
        <div className="mt-4 overflow-hidden rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-left text-gray-600">
              <tr>
                <th className="px-4 py-3 font-medium">Coefficient</th>
                <th className="px-4 py-3 font-medium">Value</th>
                <th className="px-4 py-3 font-medium">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {COEFFICIENTS.map((c) => (
                <tr key={c.name}>
                  <td className="px-4 py-3 text-gray-800">{c.name}</td>
                  <td className="px-4 py-3 font-mono text-gray-900">{c.value}</td>
                  <td className="px-4 py-3 text-gray-500">{c.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 className="mt-12 text-xl font-semibold">Per-site profiles</h2>
        <p className="mt-4 text-sm leading-relaxed text-gray-600">
          High-traffic sites ship with hand-tuned profiles. Everything else is profiled
          once by an open model (<code>gpt-oss-120b</code>) that estimates energy per
          active minute, energy per MB, and any carbon/water/land multipliers. Every
          generated profile is validated against sanity bounds and cached globally, so a
          domain is only ever profiled once — keeping the system fast and inexpensive.
        </p>

        <h2 className="mt-12 text-xl font-semibold">What this is not</h2>
        <p className="mt-4 text-sm leading-relaxed text-gray-600">
          These are directional estimates, not metered measurements. Real consumption
          varies with video quality, device efficiency, caching, and the carbon mix of
          the data centers and your local grid. Use TruePrice to compare and reduce, not
          to audit.
        </p>
      </div>
      <SiteFooter />
    </main>
  );
}
