import { Brand, Footer } from "../components/studio-ui";

export const metadata = { title: "Terms of Service — Snaphaul" };

export default function Terms() {
  return (
    <>
      <header className="site-header wrap">
        <Brand />
      </header>
      <main className="legal wrap">
        <h1>Terms of Service</h1>
        <p className="text-gray-500">Last updated: August 21, 2026</p>
        <p>
          Snaphaul (&quot;we&quot;) provides AI-generated listing suggestions for online
          marketplaces. By using Snaphaul you agree to these terms. Snaphaul is currently in free
          beta; we may introduce paid plans later. Generated content is a suggestion only — you are
          responsible for the accuracy, compliance, and legality of listings you publish, and for
          complying with each marketplace&apos;s own rules (some, including Etsy, restrict
          AI-generated content). We provide the service &quot;as is&quot; with no warranty. We may
          limit free usage at any time.
        </p>
      </main>
      <Footer />
    </>
  );
}
