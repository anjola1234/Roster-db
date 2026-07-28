import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import { getCurrentUser } from "@/lib/session";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display-family",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});
const inter = Inter({
  variable: "--font-body-family",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});
const jetBrainsMono = JetBrains_Mono({
  variable: "--font-mono-family",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "IndexOne — Discover the products building the next wave",
  description:
    "One directory for the companies and institutions shaping the ecosystem, from fintech funding rounds to hospital accreditation. Pilot region: Nigeria.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} ${jetBrainsMono.variable}`}
      style={{
        // Map the loaded font variables onto the design-token names used
        // throughout globals.css (--font-display / --font-body / --font-mono).
        ["--font-display" as string]: "var(--font-display-family), system-ui, sans-serif",
        ["--font-body" as string]: "var(--font-body-family), -apple-system, sans-serif",
        ["--font-mono" as string]: "var(--font-mono-family), ui-monospace, monospace",
      }}
    >
      <body>
        <NavBar user={user} />
        {children}
        <Footer />
      </body>
    </html>
  );
}
