import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6">
        <span className="text-2xl font-bold text-indigo-600">Snaphaul</span>
        <Link href="/app" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
          Try it free →
        </Link>
      </header>

      <section className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-6xl">
          Snap a photo.<br />
          <span className="text-indigo-600">Get a listing that sells.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
          Snaphaul turns your item photos into optimized eBay, Etsy, Poshmark, and Mercari listings —
          SEO title, full description, item specifics, tags, and a suggested price. In seconds, not 10 minutes per item.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/app" className="rounded-xl bg-indigo-600 px-8 py-3.5 text-lg font-semibold text-white shadow-lg hover:bg-indigo-700">
            Generate your first listing — free
          </Link>
        </div>
        <p className="mt-3 text-sm text-gray-400">10 free listings. No signup required.</p>
      </section>

      <section className="mx-auto grid max-w-5xl gap-6 px-4 pb-20 sm:grid-cols-3">
        {[
          ["📸", "Photo to listing", "Upload 1–5 photos. Snaphaul identifies the item, brand, condition, and flaws."],
          ["🔍", "Marketplace-optimized", "Titles within character limits, the right keywords, and tags for eBay, Etsy, Poshmark, or Mercari."],
          ["💰", "Price with confidence", "A suggested price and range based on brand, condition, and resale value."],
        ].map(([emoji, title, body]) => (
          <div key={title} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="text-3xl">{emoji}</div>
            <h3 className="mt-3 font-semibold text-gray-900">{title}</h3>
            <p className="mt-1 text-sm text-gray-600">{body}</p>
          </div>
        ))}
      </section>

      <footer className="border-t bg-white py-6 text-center text-sm text-gray-400">
        Snaphaul · <Link href="/terms" className="hover:underline">Terms</Link> · <Link href="/privacy" className="hover:underline">Privacy</Link>
      </footer>
    </main>
  );
}
