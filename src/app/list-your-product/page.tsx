import type { Metadata } from "next";
import ListProductForm from "@/components/ListProductForm";
import { getIndustries, getRegions } from "@/lib/queries";

export const metadata: Metadata = { title: "List Your Product — IndexOne" };

export default async function ListYourProductPage() {
  const [industries, regions] = await Promise.all([getIndustries(), getRegions()]);
  return (
    <main>
      <ListProductForm industries={industries} regions={regions} />
    </main>
  );
}
