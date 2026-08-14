import type { Metadata } from "next";
import { Suspense } from "react";
import DirectoryApp from "@/components/DirectoryApp";
import { getFeatures, getIndustries, getRegionTree } from "@/lib/queries";

export const metadata: Metadata = { title: "Directory — IndexOne" };

export default async function DirectoryPage() {
  // All three levels, so the region filter can offer countries, states and
  // cities rather than states alone.
  const [industries, regions, features] = await Promise.all([
    getIndustries(),
    getRegionTree(),
    getFeatures(),
  ]);

  return (
    <main>
      <Suspense>
        <DirectoryApp industries={industries} regions={regions} features={features} />
      </Suspense>
    </main>
  );
}
