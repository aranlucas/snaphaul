"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import imageCompression from "browser-image-compression";
import { MARKETPLACE_CONFIG, MARKETPLACES, Marketplace } from "@/lib/marketplaces";

type Listing = {
  item_identification: string;
  title: string;
  description: string;
  item_specifics: { name: string; value: string }[];
  tags: string[];
  category: string;
  price_suggested: number;
  price_range: [number, number];
  price_reasoning: string;
  photo_notes: string[];
};

type Comps = {
  count: number;
  median: number;
  p25: number;
  p75: number;
};

const FREE_LIMIT = 10;

const LOADING_STEPS = [
  "Identifying your item… 🔍",
  "Studying the details… 👀",
  "Writing your title… ✍️",
  "Choosing the right keywords… 🏷️",
  "Pricing it… 💰",
];

function fullListingText(l: Listing): string {
  const specs = l.item_specifics.map((s) => `${s.name}: ${s.value}`).join("\n");
  return `${l.title}

${l.description}

Item specifics:
${specs}

Tags: ${l.tags.join(", ")}
Suggested price: $${l.price_suggested} (range $${l.price_range[0]}–${l.price_range[1]})`;
}

export default function GeneratorPage() {
  const [images, setImages] = useState<string[]>([]);
  const [marketplace, setMarketplace] = useState<Marketplace>("ebay");
  const [brand, setBrand] = useState("");
  const [condition, setCondition] = useState("");
  const [size, setSize] = useState("");
  const [flaws, setFlaws] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [listing, setListing] = useState<Listing | null>(null);
  const [listingFor, setListingFor] = useState<Marketplace | null>(null);
  const [comps, setComps] = useState<Comps | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Rotate status messages during generation so the wait feels alive
  useEffect(() => {
    if (!loading) return;
    const t = setInterval(() => setLoadingStep((s) => Math.min(s + 1, LOADING_STEPS.length - 1)), 4000);
    return () => clearInterval(t);
  }, [loading]);

  async function compress(file: File): Promise<string> {
    const out = await imageCompression(file, {
      maxSizeMB: 0.4,
      maxWidthOrHeight: 1024,
      useWebWorker: true,
      fileType: "image/jpeg",
    });
    return imageCompression.getDataUrlFromFile(out);
  }

  async function addFiles(files: File[]) {
    const picked = files.filter((f) => f.type.startsWith("image/")).slice(0, 5 - images.length);
    if (!picked.length) return;
    const compressed = await Promise.all(picked.map(compress));
    setImages((prev) => [...prev, ...compressed].slice(0, 5));
  }

  // Paste-to-upload: resellers screenshot items constantly
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const files = Array.from(e.clipboardData?.items ?? [])
        .filter((i) => i.kind === "file")
        .map((i) => i.getAsFile())
        .filter((f): f is File => f !== null);
      if (files.length) addFiles(files);
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  });

  async function generate(targetMarketplace?: Marketplace) {
    const mp = targetMarketplace ?? marketplace;
    if (targetMarketplace) setMarketplace(targetMarketplace);
    if (!images.length || loading) return;
    setLoading(true);
    setLoadingStep(0);
    setError("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marketplace: mp,
          images,
          brand: brand || undefined,
          condition: condition || undefined,
          size: size || undefined,
          flaws: flaws || undefined,
          originalPrice: originalPrice || undefined,
          notes: notes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      setListing(data.listing);
      setListingFor(mp);
      setComps(data.comps ?? null);
      setRemaining(data.remaining);
      // On mobile/tablet the results render below the fold — bring them into view
      if (window.matchMedia("(max-width: 1023px)").matches && resultsRef.current) {
        resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function copy(label: string, text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(""), 1500);
  }

  const inputCls =
    "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none";

  const otherMarketplaces = MARKETPLACES.filter((m) => m !== (listingFor ?? marketplace));
  const titleLimit = MARKETPLACE_CONFIG[listingFor ?? marketplace].titleLimit;

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="sticky top-0 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="text-xl font-bold text-indigo-600">
            Snaphaul
          </Link>
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
            {remaining === null ? `${FREE_LIMIT} free listings · no signup` : `${remaining} of ${FREE_LIMIT} free left`}
          </span>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-2">
        {/* Input */}
        <section className="space-y-4">
          <div
            role="button"
            tabIndex={0}
            aria-label="Upload item photos"
            onClick={() => fileRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                fileRef.current?.click();
              }
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              addFiles(Array.from(e.dataTransfer.files));
            }}
            className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              dragActive ? "border-indigo-500 bg-indigo-50" : "border-gray-300 bg-white hover:border-indigo-400"
            }`}
          >
            <p className="font-medium text-gray-700">📸 Drop photos here, click to upload, or paste (⌘V)</p>
            <p className="mt-1 text-sm text-gray-400">1–5 photos. More photos = better listing.</p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                addFiles(Array.from(e.target.files ?? []));
                e.target.value = "";
              }}
            />
          </div>
          <p className="text-center text-xs text-gray-400">
            🔒 Photos are only used to generate your listing — never stored or shared.
          </p>

          {images.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {images.map((img, i) => (
                <div key={i} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt={`upload ${i + 1}`} className="h-20 w-20 rounded-lg object-cover" />
                  <button
                    onClick={() => setImages(images.filter((_, j) => j !== i))}
                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-gray-800 text-xs text-white"
                    aria-label={`Remove photo ${i + 1}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">Marketplace</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" aria-label="Marketplace">
              {MARKETPLACES.map((m) => (
                <button
                  key={m}
                  role="radio"
                  aria-checked={marketplace === m}
                  onClick={() => setMarketplace(m)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                    marketplace === m
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                      : "border-gray-300 bg-white text-gray-600 hover:border-gray-400"
                  }`}
                >
                  {MARKETPLACE_CONFIG[m].name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <input className={inputCls} placeholder="Brand (optional)" value={brand} onChange={(e) => setBrand(e.target.value)} />
            <input className={inputCls} placeholder="Condition (optional)" value={condition} onChange={(e) => setCondition(e.target.value)} />
            <input className={inputCls} placeholder="Size / measurements" value={size} onChange={(e) => setSize(e.target.value)} />
            <input className={inputCls} placeholder="Original price" value={originalPrice} onChange={(e) => setOriginalPrice(e.target.value)} />
            <input className={`${inputCls} col-span-2`} placeholder="Flaws or wear (optional)" value={flaws} onChange={(e) => setFlaws(e.target.value)} />
            <input className={`${inputCls} col-span-2`} placeholder="Anything else the AI should know" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <button
            onClick={() => generate()}
            disabled={!images.length || loading}
            className="w-full rounded-lg bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading
              ? LOADING_STEPS[loadingStep]
              : images.length
                ? "Generate listing ✨"
                : `Add ${images.length === 0 ? "photos" : "more photos"} to generate`}
          </button>
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}{" "}
              {remaining === 0 ? (
                <span>Unlimited access is coming soon.</span>
              ) : (
                <button onClick={() => generate()} className="font-semibold underline">
                  Try again
                </button>
              )}
            </p>
          )}
        </section>

        {/* Output */}
        <section className="space-y-4" ref={resultsRef}>
          {!listing && !loading && (
            <div className="flex h-full min-h-64 flex-col items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-6 text-center text-gray-400">
              <p className="text-4xl">📦</p>
              <p className="font-medium text-gray-500">Your optimized listing will appear here</p>
              <p className="text-sm">1. Add photos → 2. Pick a marketplace → 3. Copy your listing</p>
            </div>
          )}
          {loading && (
            <div className="flex h-full min-h-64 flex-col items-center justify-center gap-3 rounded-xl border border-indigo-100 bg-white px-6 text-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
              <p className="font-medium text-gray-700">{LOADING_STEPS[loadingStep]}</p>
              <p className="text-xs text-gray-400">Takes about 15 seconds — worth it.</p>
            </div>
          )}
          {listing && !loading && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-white">
                <p className="font-semibold">
                  ✨ {MARKETPLACE_CONFIG[listingFor ?? marketplace].name} listing ready
                </p>
                <button
                  onClick={() => copy("full", fullListingText(listing))}
                  className="rounded-lg bg-white/15 px-3 py-1.5 text-sm font-medium transition hover:bg-white/25"
                >
                  {copied === "full" ? "✓ Copied everything" : "Copy full listing"}
                </button>
              </div>

              <Card title="Title" onCopy={() => copy("title", listing.title)} copied={copied === "title"}>
                <p className="font-semibold text-gray-900">{listing.title}</p>
                <p className={`mt-1 text-xs ${listing.title.length <= titleLimit ? "text-green-600" : "text-red-500"}`}>
                  {listing.title.length}/{titleLimit} characters — fits {MARKETPLACE_CONFIG[listingFor ?? marketplace].name}&apos;s limit
                </p>
              </Card>
              <Card title="Description" onCopy={() => copy("desc", listing.description)} copied={copied === "desc"}>
                <p className="whitespace-pre-wrap text-sm text-gray-700">{listing.description}</p>
              </Card>
              <Card title="Item specifics" onCopy={() => copy("specs", listing.item_specifics.map((s) => `${s.name}: ${s.value}`).join("\n"))} copied={copied === "specs"}>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  {listing.item_specifics.map((s, i) => (
                    <div key={i}>
                      <dt className="text-gray-400">{s.name}</dt>
                      <dd className="text-gray-800">{s.value}</dd>
                    </div>
                  ))}
                </dl>
              </Card>
              <Card title="Tags / keywords" onCopy={() => copy("tags", listing.tags.join(", "))} copied={copied === "tags"}>
                <div className="flex flex-wrap gap-1.5">
                  {listing.tags.map((t, i) => (
                    <span key={i} className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs text-indigo-700">
                      {t}
                    </span>
                  ))}
                </div>
              </Card>
              <Card title="Suggested price" onCopy={() => copy("price", `$${listing.price_suggested}`)} copied={copied === "price"}>
                <p className="text-2xl font-bold text-green-600">
                  ${listing.price_suggested}
                  <span className="ml-2 text-sm font-normal text-gray-400">range ${listing.price_range[0]}–${listing.price_range[1]}</span>
                </p>
                <p className="mt-1 text-sm text-gray-600">{listing.price_reasoning}</p>
                {comps && (
                  <p className="mt-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
                    📊 Live eBay data: {comps.count} similar listings asking a median of ${comps.median}
                    <span className="text-green-600"> (${comps.p25}–${comps.p75})</span>
                  </p>
                )}
              </Card>
              <Card title="What the AI saw">
                <p className="mb-2 text-sm text-gray-600">{listing.item_identification}</p>
                <ul className="list-inside list-disc text-sm text-gray-600">
                  {listing.photo_notes.map((n, i) => (
                    <li key={i}>{n}</li>
                  ))}
                </ul>
                <p className="mt-2 text-sm text-gray-600">📂 Category: {listing.category}</p>
              </Card>

              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <p className="mb-2 text-sm font-medium text-gray-700">Also list this on</p>
                <div className="flex flex-wrap gap-2">
                  {otherMarketplaces.map((m) => (
                    <button
                      key={m}
                      onClick={() => generate(m)}
                      disabled={loading}
                      className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 transition hover:border-indigo-400 disabled:opacity-40"
                    >
                      {MARKETPLACE_CONFIG[m].name}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => generate()}
                  disabled={loading}
                  className="mt-3 w-full rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-40"
                >
                  ↻ Regenerate this listing
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

function Card({
  title,
  children,
  onCopy,
  copied,
}: {
  title: string;
  children: React.ReactNode;
  onCopy?: () => void;
  copied?: boolean;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400">{title}</h3>
        {onCopy && (
          <button onClick={onCopy} className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200">
            {copied ? "✓ Copied" : "Copy"}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}
