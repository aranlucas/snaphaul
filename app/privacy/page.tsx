import { Brand, Footer } from "../components/studio-ui";

export const metadata = { title: "Privacy Policy — Snaphaul" };

export default function Privacy() {
  return (
    <>
      <header className="site-header wrap">
        <Brand />
      </header>
      <main className="legal wrap">
        <h1>Privacy Policy</h1>
        <p className="text-gray-500">Last updated: August 21, 2026</p>
        <p>
          Snaphaul stores an anonymous session cookie to count your free generations — no name,
          email, or account is collected. Photos you upload and the details you type are sent to our
          AI provider (OpenRouter) solely to generate your listing and are not stored by us after
          the request completes. We do not sell your data. Questions? Reach us via the contact
          information shown when we enable accounts.
        </p>
      </main>
      <Footer />
    </>
  );
}
