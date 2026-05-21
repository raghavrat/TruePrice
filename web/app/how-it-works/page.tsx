import Link from "next/link";
import { InstallCTA } from "../components/InstallCTA";
import { SiteFooter } from "../components/SiteFooter";

const STEPS = [
  {
    n: "1",
    title: "It watches active time and data",
    body: "As you browse, TruePrice tracks how long each site is actively in front of you and roughly how much data it loads — entirely on your device.",
  },
  {
    n: "2",
    title: "Each site gets a resource profile",
    body: "Common sites use a curated profile. Anything new is profiled once by an AI model (energy per active minute, per MB, and CO₂/water/land multipliers) and cached so it's only ever computed once.",
  },
  {
    n: "3",
    title: "Your activity becomes impact",
    body: "We multiply each site's profile by your actual usage to get energy, then convert to CO₂, water, and land using published coefficients.",
  },
  {
    n: "4",
    title: "Totals roll up over time",
    body: "The popup adds everything into hour, day, week, and month views, with a category breakdown and your worst offenders.",
  },
];

export default function HowItWorks() {
  return (
    <main className="bg-gray-50">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-900">
          ← Back
        </Link>
        <h1 className="mt-6 text-4xl font-bold tracking-tight">How it works</h1>
        <p className="mt-4 text-gray-600">
          TruePrice turns invisible infrastructure into numbers you can act on. Here&apos;s
          the pipeline, end to end.
        </p>

        <ol className="mt-12 space-y-8">
          {STEPS.map((s) => (
            <li key={s.n} className="flex gap-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 font-bold text-white">
                {s.n}
              </span>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{s.title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-gray-600">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-12">
          <InstallCTA />
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
