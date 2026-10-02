"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import imageCompression from "browser-image-compression";
import { MARKETPLACE_CONFIG, MARKETPLACES, type Marketplace } from "@/lib/marketplaces";
import { Brand, Footer, Icon } from "../components/studio-ui";

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
type Comps = { count: number; median: number; p25: number; p75: number };
type Photo = { id: number; src: string; name: string };
const EMPTY_DETAILS = {
  brand: "",
  condition: "",
  size: "",
  flaws: "",
  originalPrice: "",
  notes: "",
};
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_BYTES = 20 * 1024 * 1024;

function fullListingText(l: Listing) {
  return `${l.title}\n\n${l.description}\n\nItem specifics:\n${l.item_specifics.map((s) => `${s.name}: ${s.value}`).join("\n")}\n\nCategory: ${l.category}\nTags: ${l.tags.join(", ")}\nSuggested price: $${l.price_suggested} (range $${l.price_range[0]}–${l.price_range[1]})`;
}

export default function GeneratorPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [marketplace, setMarketplace] = useState<Marketplace>("ebay");
  const [details, setDetails] = useState(EMPTY_DETAILS);
  const [listing, setListing] = useState<Listing | null>(null);
  const [listingFor, setListingFor] = useState<Marketplace>("ebay");
  const [comps, setComps] = useState<Comps | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [notice, setNotice] = useState("");
  const [copyNotice, setCopyNotice] = useState("");
  const [copied, setCopied] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [revision, setRevision] = useState(0);
  const [draftRevision, setDraftRevision] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLElement>(null);
  const photosRef = useRef<Photo[]>([]);
  const uploadEpoch = useRef(0);
  const uploadBusy = useRef(false);
  const photoId = useRef(0);
  const revisionRef = useRef(0);
  const requestRef = useRef<AbortController | null>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(true);
  const copyToken = useRef(0);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      // oxlint-disable-next-line react-hooks/exhaustive-deps -- Invalidate the latest clipboard operation on unmount.
      copyToken.current++;
      // oxlint-disable-next-line react-hooks/exhaustive-deps -- Invalidate the latest async upload on unmount.
      uploadEpoch.current++;
      requestRef.current?.abort();
      if (copyTimer.current) clearTimeout(copyTimer.current);
    };
  }, []);

  function changed() {
    revisionRef.current++;
    setRevision(revisionRef.current);
  }
  function updatePhotos(next: Photo[]) {
    photosRef.current = next;
    setPhotos(next);
    changed();
  }

  async function addFiles(files: File[]) {
    if (uploadBusy.current || requestRef.current || !files.length) return;
    const epoch = uploadEpoch.current;
    uploadBusy.current = true;
    setUploading(true);
    setUploadError("");
    setNotice("");
    const errors: string[] = [];
    const added: Photo[] = [];
    const available = 5 - photosRef.current.length;
    for (const file of files) {
      if (!ACCEPTED.includes(file.type)) {
        errors.push(`${file.name}: use JPEG, PNG, WebP or GIF.`);
        continue;
      }
      if (file.size > MAX_FILE_BYTES) {
        errors.push(`${file.name}: exceeds 20 MB. Choose a smaller image.`);
        continue;
      }
      if (added.length >= available) {
        errors.push("You can add up to 5 photos. Remove one to make room.");
        break;
      }
      try {
        const out = await imageCompression(file, {
          maxSizeMB: 0.4,
          maxWidthOrHeight: 1024,
          useWebWorker: false,
          fileType: "image/jpeg",
        });
        if (out.size > 1024 * 1024) throw new Error("Image could not be reduced");
        const src = await imageCompression.getDataUrlFromFile(out);
        added.push({ id: ++photoId.current, src, name: file.name });
      } catch {
        errors.push(`${file.name}: couldn’t read this photo. Try another image.`);
      }
      if (epoch !== uploadEpoch.current || !mounted.current) return;
    }
    if (epoch !== uploadEpoch.current || !mounted.current) return;
    if (added.length) updatePhotos([...photosRef.current, ...added]);
    setUploadError(errors.join(" "));
    setUploading(false);
    uploadBusy.current = false;
  }

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const files = Array.from(event.clipboardData?.items ?? [])
        .filter((i) => i.kind === "file")
        .map((i) => i.getAsFile())
        .filter((f): f is File => f !== null);
      if (files.length) {
        event.preventDefault();
        void addFiles(files);
      }
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  });

  function cancel() {
    requestRef.current?.abort();
    requestRef.current = null;
    setLoading(false);
    setNotice("Stopped waiting. A request already sent may still finish and use a generation.");
  }

  function reset() {
    copyToken.current++;
    requestRef.current?.abort();
    requestRef.current = null;
    uploadEpoch.current++;
    uploadBusy.current = false;
    setUploading(false);
    setLoading(false);
    updatePhotos([]);
    setDetails(EMPTY_DETAILS);
    setMarketplace("ebay");
    setListing(null);
    setComps(null);
    setError("");
    setUploadError("");
    setCopyNotice("");
    setCopied("");
    setDragActive(false);
    setNotice("Studio cleared. Ready for your next item.");
    fileRef.current?.focus();
  }

  async function generate(target?: Marketplace) {
    if (!photosRef.current.length || requestRef.current || uploadBusy.current || remaining === 0)
      return;
    const mp = target ?? marketplace;
    if (target && target !== marketplace) {
      setMarketplace(target);
      changed();
    }
    const sourceRevision = revisionRef.current;
    const controller = new AbortController();
    requestRef.current = controller;
    copyToken.current++;
    setLoading(true);
    setError("");
    setNotice("");
    setCopyNotice("");
    setCopied("");
    const timeout = setTimeout(() => controller.abort(), 90000);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          marketplace: mp,
          images: photosRef.current.map((p) => p.src),
          ...Object.fromEntries(Object.entries(details).filter(([, value]) => value.trim())),
        }),
      });
      const data = await res.json();
      if (requestRef.current !== controller || !mounted.current) return;
      if (!res.ok) {
        if (res.status === 429) setRemaining(0);
        throw new Error(data.error || "Couldn’t generate a draft. Try again.");
      }
      if (
        !data.listing ||
        typeof data.listing.title !== "string" ||
        !Array.isArray(data.listing.item_specifics)
      )
        throw new Error("The response was incomplete. Try again.");
      setListing(data.listing);
      setListingFor(mp);
      setDraftRevision(sourceRevision);
      setComps(data.comps ?? null);
      if (typeof data.remaining === "number") setRemaining(data.remaining);
      requestAnimationFrame(() => {
        if (!mounted.current || requestRef.current !== null) return;
        resultsRef.current?.focus({ preventScroll: true });
        if (window.matchMedia("(max-width: 1023px)").matches)
          resultsRef.current?.scrollIntoView({
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
              ? "auto"
              : "smooth",
            block: "start",
          });
      });
    } catch (e) {
      if (requestRef.current !== controller || !mounted.current) return;
      setError(
        controller.signal.aborted
          ? "This request took too long. You can try again; the earlier request may still finish."
          : e instanceof Error
            ? e.message
            : "Couldn’t reach the service. Check your connection and try again.",
      );
    } finally {
      clearTimeout(timeout);
      if (requestRef.current === controller) {
        requestRef.current = null;
        if (mounted.current) setLoading(false);
      }
    }
  }

  async function copy(label: string, text: string) {
    const token = ++copyToken.current;
    if (copyTimer.current) clearTimeout(copyTimer.current);
    setCopied("");
    setCopyNotice("");
    try {
      await navigator.clipboard.writeText(text);
      if (!mounted.current || token !== copyToken.current) return;
      setCopied(label);
      setCopyNotice(`${label} copied.`);
      copyTimer.current = setTimeout(() => {
        if (mounted.current) setCopied("");
      }, 2200);
    } catch {
      if (mounted.current && token === copyToken.current)
        setCopyNotice("Clipboard access was denied. Select the draft text and copy it manually.");
    }
  }

  const titleLimit = MARKETPLACE_CONFIG[listingFor].titleLimit;
  const busy = loading || uploading;
  const stale = listing && revision !== draftRevision;
  function copyButton(label: string, text: string) {
    return (
      <button
        type="button"
        className="button button-small button-outline"
        disabled={loading}
        onClick={() => void copy(label, text)}
      >
        <Icon name={copied === label ? "check" : "copy"} />
        {copied === label ? "Copied" : `Copy ${label.toLowerCase()}`}
      </button>
    );
  }

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to studio
      </a>
      <header className="site-header wrap">
        <Brand />
        <nav aria-label="Main">
          <Link className="nav-link" href="/#workflow">
            How it works
          </Link>
          <span className="allowance">
            {remaining === null
              ? "10 free generations / session"
              : `${remaining} of 10 generations left`}
          </span>
        </nav>
      </header>
      <main id="main" className="studio wrap">
        <div className="studio-intro">
          <div>
            <h1>Your listing studio.</h1>
            <p>Start with the item. Leave with a draft you can make your own.</p>
          </div>
          <button
            type="button"
            className="button button-outline"
            onClick={reset}
            disabled={!photos.length && !listing && !busy && !Object.values(details).some(Boolean)}
          >
            <Icon name="refresh" />
            New item
          </button>
        </div>
        <div className="studio-grid">
          <form
            className="source-panel"
            onSubmit={(event) => {
              event.preventDefault();
              void generate();
            }}
          >
            <fieldset disabled={busy} className="photo-fieldset">
              <legend className="section-heading">
                <span>Your photos</span>
                <span className="count">{photos.length} / 5</span>
              </legend>
              <div
                className={`contact-sheet ${dragActive ? "is-dragging" : ""}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (!busy) setDragActive(true);
                }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node | null))
                    setDragActive(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                  void addFiles(Array.from(e.dataTransfer.files));
                }}
              >
                {photos.length ? (
                  <div className="photo-grid">
                    {photos.map((photo, i) => (
                      <figure className="photo-frame" key={photo.id}>
                        {/* Data URLs are already compressed locally; an image optimizer cannot fetch them. */}
                        {/* oxlint-disable-next-line next/no-img-element */}
                        <img src={photo.src} alt={`View ${i + 1}: ${photo.name}`} />
                        <figcaption>
                          <span>{String(i + 1).padStart(2, "0")}</span>
                          <span>{i === 0 ? "Main view" : "Detail view"}</span>
                        </figcaption>
                        <button
                          className="photo-remove"
                          type="button"
                          aria-label={`Remove photo ${i + 1}`}
                          onClick={() =>
                            updatePhotos(photosRef.current.filter((p) => p.id !== photo.id))
                          }
                        >
                          <Icon name="close" />
                        </button>
                      </figure>
                    ))}
                  </div>
                ) : (
                  <div className="upload-empty">
                    <Icon name="camera" />
                    <h2>
                      Let the photos
                      <br />
                      do the talking.
                    </h2>
                    <p>
                      Drop your item photos here,
                      <br />
                      or choose them below.
                    </p>
                  </div>
                )}
                <label
                  className={`upload-button button ${busy || photos.length === 5 ? "is-disabled" : ""}`}
                >
                  <Icon name="plus" />
                  {uploading
                    ? "Preparing photos…"
                    : photos.length
                      ? "Add another view"
                      : "Choose photos"}
                  <input
                    ref={fileRef}
                    type="file"
                    accept={ACCEPTED.join(",")}
                    multiple
                    disabled={busy || photos.length === 5}
                    onChange={(e) => {
                      void addFiles(Array.from(e.target.files ?? []));
                      e.target.value = "";
                    }}
                  />
                </label>
                <p className="upload-hint">
                  JPEG, PNG, WebP or GIF · Up to 20 MB each
                  <br />
                  You can also paste images from your clipboard.
                </p>
              </div>
            </fieldset>
            <output className="upload-feedback">
              {uploading
                ? "Preparing your photos. You can clear the studio to stop."
                : `${photos.length} photo${photos.length === 1 ? "" : "s"} added.`}
            </output>
            {uploadError && (
              <p className="feedback feedback-error" role="alert">
                {uploadError}
              </p>
            )}
            <fieldset className="marketplace-fieldset" disabled={busy}>
              <legend className="section-heading">Choose your marketplace</legend>
              <div className="marketplace-grid">
                {MARKETPLACES.map((mp) => (
                  <label
                    className={`marketplace-option ${marketplace === mp ? "is-selected" : ""}`}
                    key={mp}
                  >
                    <input
                      type="radio"
                      name="marketplace"
                      value={mp}
                      checked={marketplace === mp}
                      onChange={() => {
                        setMarketplace(mp);
                        changed();
                      }}
                    />
                    <span>{MARKETPLACE_CONFIG[mp].name}</span>
                    <span className="radio-mark" aria-hidden="true" />
                  </label>
                ))}
              </div>
              <p className="fine marketplace-guidance">
                {marketplace === "etsy"
                  ? "Check Etsy eligibility: vintage, handmade or craft supplies."
                  : `A title tailored to ${MARKETPLACE_CONFIG[marketplace].name}’s ${MARKETPLACE_CONFIG[marketplace].titleLimit}-character limit.`}
              </p>
            </fieldset>
            <details className="seller-details">
              <summary>
                <span>Fill in what photos can’t tell</span>
                <span className="fine">Optional</span>
              </summary>
              <p className="fine">Your details take priority over photo interpretation.</p>
              <fieldset disabled={busy} className="detail-grid">
                {(
                  [
                    ["brand", "Brand", "e.g. Levi’s", 200],
                    ["condition", "Condition", "e.g. Gently used", 200],
                    ["size", "Size / measurements", "e.g. M, 22 in pit to pit", 200],
                    ["originalPrice", "Original price", "e.g. $90 USD", 50],
                    ["flaws", "Flaws or wear", "Be specific about marks or damage", 500],
                    ["notes", "Anything else", "Material, age, what’s included…", 1000],
                  ] as const
                ).map(([key, label, placeholder, max]) => (
                  <label
                    className={key === "flaws" || key === "notes" ? "field field-wide" : "field"}
                    key={key}
                  >
                    <span>{label}</span>
                    <input
                      placeholder={placeholder}
                      maxLength={max}
                      value={details[key]}
                      onChange={(e) => {
                        setDetails((prev) => ({ ...prev, [key]: e.target.value }));
                        changed();
                      }}
                    />
                  </label>
                ))}
              </fieldset>
            </details>
            <div className="generate-actions">
              <button
                type="submit"
                className="button button-green generate-button"
                disabled={!photos.length || busy || remaining === 0}
              >
                {loading
                  ? "Generating your draft…"
                  : uploading
                    ? "Preparing photos…"
                    : listing
                      ? "Generate a new draft"
                      : "Generate my listing"}
                <Icon name="arrow" />
              </button>
              {loading && (
                <button type="button" className="button button-outline" onClick={cancel}>
                  Cancel
                </button>
              )}
            </div>
            {!photos.length && <p className="fine">Add at least one photo to get started.</p>}
            {listing && (
              <p className="fine">
                A new draft replaces your edits. Copy anything you want to keep first.
              </p>
            )}
            {error && (
              <div className="feedback feedback-error" role="alert">
                <p>{error}</p>
                {remaining !== 0 && (
                  <button
                    type="button"
                    className="text-button"
                    disabled={busy}
                    onClick={() => void generate()}
                  >
                    Try again
                  </button>
                )}
              </div>
            )}
            {notice && <output className="feedback">{notice}</output>}
            <p className="privacy-note">
              Photos and details go to OpenRouter to generate your draft. Snaphaul doesn’t save
              them. <Link href="/privacy">Privacy</Link>
            </p>
            <p className="fine quota-note">
              The free allowance is based on browser cookies, can reset, and isn’t a per-person
              quota. Another draft uses another generation.
            </p>
          </form>
          <section
            className="draft-panel"
            ref={resultsRef}
            tabIndex={-1}
            aria-label="Listing draft"
            aria-busy={loading}
          >
            {loading && (
              // This live status includes headings, so it uses a flow-content container.
              // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
              <div className="generation-status" role="status">
                <span className="waiting-mark" aria-hidden="true" />
                <div>
                  <h2>Making room for the words.</h2>
                  <p>
                    Generating a {MARKETPLACE_CONFIG[marketplace].name} draft from your photos. Wait
                    times vary.
                  </p>
                  <p className="fine">You can cancel waiting without clearing your item.</p>
                </div>
              </div>
            )}
            {!listing && !loading && (
              <div className="draft-empty">
                <h2>
                  A good draft starts
                  <br />
                  with a good view.
                </h2>
                <ul>
                  <li>
                    <span>Front & back</span>
                    <p>Show the whole item in clear light.</p>
                  </li>
                  <li>
                    <span>The small print</span>
                    <p>Include a readable brand or size label.</p>
                  </li>
                  <li>
                    <span>The honest details</span>
                    <p>Get close to flaws, texture and wear.</p>
                  </li>
                </ul>
                <p>Your title, description, specifics and price guidance will appear here.</p>
                <Link className="text-link" href="/#example">
                  See a sample transformation <Icon name="arrow" />
                </Link>
              </div>
            )}
            {listing && (
              <div className="listing-editor">
                <div className="editor-heading">
                  <div>
                    <h2>{MARKETPLACE_CONFIG[listingFor].name} draft</h2>
                    <p>Ready for your final say.</p>
                  </div>
                  {copyButton("Full listing", fullListingText(listing))}
                </div>
                <p className="review-note">
                  Review every claim before publishing. This draft stays in this page only.
                </p>
                {stale && (
                  <p className="feedback">
                    Your source changed. This draft uses the earlier photos and details; generate
                    again to update it.
                  </p>
                )}
                <output className="copy-feedback" aria-live="polite">
                  {copyNotice}
                </output>
                <div className="editor-section">
                  <div className="editor-label">
                    <label htmlFor="listing-title">
                      Title <span>Editable</span>
                    </label>
                    {copyButton("Title", listing.title)}
                  </div>
                  <textarea
                    id="listing-title"
                    className="title-input"
                    rows={2}
                    value={listing.title}
                    disabled={loading}
                    onChange={(e) => setListing({ ...listing, title: e.target.value })}
                  />
                  <p className={`fine ${listing.title.length > titleLimit ? "limit-warning" : ""}`}>
                    {listing.title.length} / {titleLimit} characters ·{" "}
                    {listing.title.length > titleLimit
                      ? "Over the marketplace limit — shorten before publishing."
                      : "Within the marketplace limit."}
                  </p>
                </div>
                <div className="editor-section">
                  <div className="editor-label">
                    <label htmlFor="listing-description">
                      Description <span>Editable</span>
                    </label>
                    {copyButton("Description", listing.description)}
                  </div>
                  <textarea
                    id="listing-description"
                    className="description-input"
                    rows={8}
                    value={listing.description}
                    disabled={loading}
                    onChange={(e) => setListing({ ...listing, description: e.target.value })}
                  />
                </div>
                <div className="editor-section">
                  <div className="editor-label">
                    <h3>Item specifics</h3>
                    {copyButton(
                      "Specifics",
                      listing.item_specifics.map((s) => `${s.name}: ${s.value}`).join("\n"),
                    )}
                  </div>
                  <dl className="specifics">
                    {listing.item_specifics.map((s, i) => (
                      <div key={i}>
                        <dt>{s.name}</dt>
                        <dd>{s.value}</dd>
                      </div>
                    ))}
                  </dl>
                  <p className="category">
                    <span>Suggested category</span>
                    {listing.category}
                  </p>
                </div>
                <div className="editor-section">
                  <div className="editor-label">
                    <h3>Tags & keywords</h3>
                    {copyButton("Tags", listing.tags.join(", "))}
                  </div>
                  <ul className="tag-list">
                    {listing.tags.map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                </div>
                <aside className="price-guidance">
                  <div className="editor-label">
                    <h3>Suggested price · USD</h3>
                    {copyButton("Price", `$${listing.price_suggested}`)}
                  </div>
                  <div className="price-line">
                    <strong>${listing.price_suggested}</strong>
                    <span>
                      Range ${listing.price_range[0]}–${listing.price_range[1]}
                    </span>
                  </div>
                  <p>{listing.price_reasoning}</p>
                  {comps && (
                    <p className="comps-note">
                      {comps.count} live eBay listings ask a median of ${comps.median} (${comps.p25}
                      –${comps.p75}). Asking prices aren’t sold prices.
                    </p>
                  )}
                  <p className="fine">
                    A suggestion, not a valuation. Check comparable items before setting your price.
                  </p>
                </aside>
                <details className="observations">
                  <summary>What the AI noticed</summary>
                  <p>{listing.item_identification}</p>
                  <ul>
                    {listing.photo_notes.map((n, i) => (
                      <li key={i}>{n}</li>
                    ))}
                  </ul>
                </details>
                <div className="rework">
                  <h3>Try another marketplace</h3>
                  <p>Creates a new draft and replaces this one. Copy your edits first.</p>
                  <div>
                    {MARKETPLACES.filter((mp) => mp !== listingFor).map((mp) => (
                      <button
                        type="button"
                        className="button button-outline"
                        key={mp}
                        disabled={busy || remaining === 0 || !photos.length}
                        onClick={() => void generate(mp)}
                      >
                        {MARKETPLACE_CONFIG[mp].name}
                        <Icon name="arrow" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
