import type { Metadata } from "next";
import { Suspense } from "react";
import DirectoryApp from "@/components/DirectoryApp";
import { getFeatures, getIndustries, getRegions } from "@/lib/queries";

export const metadata: Metadata = { title: "Directory — IndexOne" };

export default async function DirectoryPage() {
  const [industries, regions, features] = await Promise.all([getIndustries(), getRegions(), getFeatures()]);

  return (
    <main>
      <Suspense>
        <DirectoryApp industries={industries} regions={regions} features={features} />
      </Suspense>
    </main>
  );
}
