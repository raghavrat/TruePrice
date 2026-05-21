import { FAQ } from "./components/FAQ";
import { FeatureGrid } from "./components/FeatureGrid";
import { Hero } from "./components/Hero";
import { ImpactExamples } from "./components/ImpactExamples";
import { InstallCTA } from "./components/InstallCTA";
import { SiteFooter } from "./components/SiteFooter";

export default function Home() {
  return (
    <main className="bg-gray-50">
      <Hero />
      <FeatureGrid />
      <ImpactExamples />
      <FAQ />
      <section className="bg-gray-50 px-6 pb-24 text-center">
        <h2 className="text-2xl font-bold tracking-tight">Know what you spend online.</h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-gray-600">
          Install TruePrice and watch the hidden cost of your browsing add up — then
          shrink it.
        </p>
        <div className="mt-6">
          <InstallCTA />
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
