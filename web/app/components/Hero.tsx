import { InstallCTA } from "./InstallCTA";
import { PopupPreview } from "./PopupPreview";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gray-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(16,163,74,0.25),_transparent_60%)]" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 md:grid-cols-2 md:py-28">
        <div>
          <span className="inline-block rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
            Chrome extension · free
          </span>
          <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight md:text-5xl">
            See the natural-resource cost of your browsing.
          </h1>
          <p className="mt-5 max-w-md text-lg text-gray-300">
            TruePrice estimates the energy, CO₂, water, and land behind every site you
            visit — and adds it up across the last hour, day, week, and month.
          </p>
          <div className="mt-8 flex items-center gap-4">
            <InstallCTA />
            <a href="/how-it-works" className="text-sm font-medium text-gray-300 hover:text-white">
              How it works →
            </a>
          </div>
        </div>
        <div className="flex justify-center md:justify-end">
          <PopupPreview />
        </div>
      </div>
    </section>
  );
}
