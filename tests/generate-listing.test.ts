import assert from "node:assert/strict";
import { afterEach, test, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../app/api/generate/route";
import syntheticImages from "./synthetic-images.json";
import { generateListing, MAX_IMAGE_BYTES, MAX_REQUEST_BYTES } from "../lib/generate-listing";

// Synthetic 1x1 PNG. No user photos or external services are used in this suite.
const PNG = syntheticImages.png;
const image = `data:image/png;base64,${PNG}`;
const listing = {
  item_identification: "A synthetic test item",
  title: "Test item",
  description: "Generated with a local adapter",
  item_specifics: [{ name: "Condition", value: "Test" }],
  tags: ["test"],
  category: "Test",
  price_suggested: 10,
  price_range: [5, 15] as [number, number],
  price_reasoning: "Test estimate",
  photo_notes: ["Synthetic image"],
};

type Dependencies = Parameters<typeof generateListing>[1];
function adapters(overrides: Partial<Dependencies> = {}) {
  const attempts: Parameters<Dependencies["generate"]>[0][] = [];
  const searches: string[] = [];
  const dependencies: Dependencies = {
    models: ["local-first", "local-fallback"],
    async generate(input) {
      attempts.push(input);
      return listing;
    },
    async getComps(title) {
      searches.push(title);
      return null;
    },
    ...overrides,
  };
  return { dependencies, attempts, searches };
}
function request(body: unknown = { marketplace: "ebay", images: [image] }, headers?: HeadersInit) {
  return new Request("http://localhost/api/generate", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

for (const [name, value] of Object.entries({
  "malformed data URL": "data:image/jpeg,not-base64",
  "unsupported SVG": "data:image/svg+xml;base64,PHN2Zy8+",
  "unsupported MIME type": `data:image/tiff;base64,${PNG}`,
  "external URL": "https://example.com/photo.png",
  "empty base64": "data:image/png;base64,",
  "invalid base64 alphabet": "data:image/png;base64,%%%?",
  "embedded whitespace": `data:image/png;base64,${PNG}\n`,
  "extra padding": `data:image/png;base64,${PNG}===`,
  "noncanonical padding bits": "data:image/png;base64,iVBORw0KGgp=",
  "MIME and content mismatch": `data:image/jpeg;base64,${PNG}`,
  "text instead of image": `data:image/png;base64,${Buffer.from("not an image").toString("base64")}`,
  "missing image header": "data:image/png;base64,AA==",
})) {
  test(`${name} is rejected before any provider work`, async () => {
    const { dependencies, attempts, searches } = adapters();
    assert.deepEqual(
      await generateListing(request({ marketplace: "ebay", images: [value] }), dependencies),
      { kind: "invalid-input" },
    );
    assert.equal(attempts.length, 0);
    assert.equal(searches.length, 0);
  });
}

for (const body of [
  { marketplace: "unknown", images: [image] },
  { marketplace: "ebay", images: [] },
  { marketplace: "ebay", images: Array(6).fill(image) },
  { marketplace: "ebay", images: [image, "data:image/jpeg,broken"] },
  { marketplace: "ebay", images: [image], notes: "x".repeat(1001) },
  { marketplace: "ebay", images: [10] },
  null,
]) {
  test(`invalid fields are rejected: ${JSON.stringify(body).slice(0, 80)}`, async () => {
    const { dependencies, attempts } = adapters();
    assert.deepEqual(await generateListing(request(body), dependencies), { kind: "invalid-input" });
    assert.equal(attempts.length, 0);
  });
}

test("oversized base64 and decoded images are rejected", async () => {
  // +1 has the same encoded length as the limit, so this exercises decoded size.
  for (const size of [MAX_IMAGE_BYTES + 1, MAX_IMAGE_BYTES + 3]) {
    const bytes = Buffer.alloc(size);
    Buffer.from(PNG, "base64").copy(bytes);
    const { dependencies, attempts } = adapters();
    assert.deepEqual(
      await generateListing(
        request({
          marketplace: "ebay",
          images: [`data:image/png;base64,${bytes.toString("base64")}`],
        }),
        dependencies,
      ),
      { kind: "invalid-input" },
    );
    assert.equal(attempts.length, 0);
  }
});

test("invalid JSON and missing bodies are invalid input", async () => {
  for (const body of ["{broken", undefined]) {
    const { dependencies, attempts } = adapters();
    const req = new Request("http://localhost/api/generate", { method: "POST", body });
    assert.deepEqual(await generateListing(req, dependencies), { kind: "invalid-input" });
    assert.equal(attempts.length, 0);
  }
});

test("oversized Content-Length is rejected before reading the body", async () => {
  const req = request(undefined, { "Content-Length": String(MAX_REQUEST_BYTES + 1) });
  const { dependencies, attempts } = adapters();
  assert.deepEqual(await generateListing(req, dependencies), { kind: "too-large" });
  assert.equal(req.bodyUsed, false);
  assert.equal(attempts.length, 0);
});

for (const length of [undefined, "1"]) {
  test(`stream limit holds with ${length ? "false" : "missing"} Content-Length and cancels the reader`, async () => {
    let cancelled = false;
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        controller.enqueue(new Uint8Array(1024 * 1024));
      },
      cancel() {
        cancelled = true;
      },
    });
    const init: RequestInit & { duplex: string } = {
      method: "POST",
      body: stream,
      duplex: "half",
      headers: length ? { "Content-Length": length } : undefined,
    };
    const { dependencies, attempts } = adapters();
    assert.deepEqual(
      await generateListing(new Request("http://localhost/api/generate", init), dependencies),
      { kind: "too-large" },
    );
    assert.equal(cancelled, true);
    assert.equal(attempts.length, 0);
  });
}

test("valid images and seller details reach one model as decoded bytes", async () => {
  const { dependencies, attempts, searches } = adapters();
  const outcome = await generateListing(
    request({
      marketplace: "etsy",
      images: Array(5).fill(image),
      brand: "Synthetic brand",
      flaws: "Test scratch",
    }),
    dependencies,
  );
  assert.deepEqual(outcome, { kind: "generated", listing, comps: null });
  assert.equal(attempts.length, 1);
  assert.equal(attempts[0].images.length, 5);
  assert.equal(attempts[0].images[0].mediaType, "image/png");
  assert.deepEqual(Buffer.from(attempts[0].images[0].data), Buffer.from(PNG, "base64"));
  assert.match(attempts[0].prompt, /Etsy/);
  assert.match(attempts[0].prompt, /Synthetic brand/);
  assert.match(attempts[0].prompt, /Test scratch/);
  assert.deepEqual(searches, [listing.title]);
});

test("fallback reuses validated input and stops after success", async () => {
  const attempts: Parameters<Dependencies["generate"]>[0][] = [];
  const { dependencies } = adapters({
    models: ["fails", "works", "unused"],
    async generate(input) {
      attempts.push(input);
      if (input.model === "fails") throw new Error("Mock provider failure");
      return listing;
    },
  });
  assert.equal((await generateListing(request(), dependencies)).kind, "generated");
  assert.deepEqual(
    attempts.map((attempt) => attempt.model),
    ["fails", "works"],
  );
  assert.equal(attempts[0].images, attempts[1].images);
  assert.equal(attempts[0].prompt, attempts[1].prompt);
});

test("all providers failing returns a safe typed error without comparisons", async () => {
  let calls = 0;
  const { dependencies, searches } = adapters({
    async generate() {
      calls++;
      throw new Error("private provider diagnostic");
    },
  });
  assert.deepEqual(await generateListing(request(), dependencies), { kind: "provider-failed" });
  assert.equal(calls, 2);
  assert.deepEqual(searches, []);
});

test("malformed model output falls back instead of returning an invalid listing", async () => {
  let calls = 0;
  const { dependencies } = adapters({
    async generate() {
      calls++;
      return calls === 1 ? ({} as typeof listing) : listing;
    },
  });
  assert.equal((await generateListing(request(), dependencies)).kind, "generated");
  assert.equal(calls, 2);
});

test("eBay failure keeps a successful listing with explicit absent comparisons", async () => {
  const { dependencies, attempts } = adapters({
    async getComps() {
      throw new Error("Mock eBay outage");
    },
  });
  assert.deepEqual(await generateListing(request(), dependencies), {
    kind: "generated",
    listing,
    comps: null,
  });
  assert.equal(attempts.length, 1);
});

test("successful comparisons are returned unchanged", async () => {
  const comps = { count: 5, median: 10, p25: 5, p75: 15 };
  const { dependencies } = adapters({
    async getComps() {
      return comps;
    },
  });
  assert.deepEqual(await generateListing(request(), dependencies), {
    kind: "generated",
    listing,
    comps,
  });
});

for (const [name, body, status, headers] of [
  [
    "the original malformed-data-URL regression",
    JSON.stringify({ marketplace: "ebay", images: ["data:image/jpeg,broken"] }),
    400,
    {},
  ],
  ["invalid JSON", "{broken", 400, {}],
  ["oversized body", "{}", 413, { "Content-Length": String(MAX_REQUEST_BYTES + 1) }],
] as const) {
  test(`route maps ${name} to ${status} without consuming allowance`, async () => {
    const req = new NextRequest("http://localhost/api/generate", { method: "POST", body, headers });
    const res = await POST(req);
    assert.equal(res.status, status);
    assert.equal(res.headers.has("set-cookie"), false);
    assert.equal("detail" in (await res.json()), false);
  });
}

test("exhausted advisory allowance is rejected before reading the request", async () => {
  const req = new NextRequest("http://localhost/api/generate", {
    method: "POST",
    body: "{broken",
    headers: { Cookie: "sh_session=test; sh_used_test=10" },
  });
  assert.equal((await POST(req)).status, 429);
  assert.equal(req.bodyUsed, false);
});

for (const [format, encoded] of Object.entries(syntheticImages)) {
  test(`synthetic ${format} is accepted with the correct media type`, async () => {
    const { dependencies, attempts } = adapters();
    assert.equal(
      (
        await generateListing(
          request({ marketplace: "ebay", images: [`data:image/${format};base64,${encoded}`] }),
          dependencies,
        )
      ).kind,
      "generated",
    );
    assert.equal(attempts[0].images[0].mediaType, `image/${format}`);
  });
}

test("non-ASCII bytes cannot masquerade as a GIF signature", async () => {
  const bytes = Buffer.from(syntheticImages.gif, "base64");
  bytes[0] |= 128;
  const { dependencies, attempts } = adapters();
  assert.deepEqual(
    await generateListing(
      request({
        marketplace: "ebay",
        images: [`data:image/gif;base64,${bytes.toString("base64")}`],
      }),
      dependencies,
    ),
    { kind: "invalid-input" },
  );
  assert.equal(attempts.length, 0);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

function mockProviderEnvironment() {
  vi.stubEnv("OPENROUTER_API_KEY", "synthetic-local-test-key");
  vi.stubEnv("EBAY_CLIENT_ID", undefined);
  vi.stubEnv("EBAY_CLIENT_SECRET", undefined);
}

test("the route counts one successful generated listing using an offline HTTP adapter", async () => {
  mockProviderEnvironment();
  let calls = 0;
  vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
    calls++;
    return Response.json({
      id: "synthetic-completion",
      object: "chat.completion",
      created: 0,
      model: "synthetic-local-model",
      choices: [
        {
          index: 0,
          message: { role: "assistant", content: JSON.stringify(listing) },
          finish_reason: "stop",
        },
      ],
      usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
    });
  });
  const res = await POST(
    new NextRequest("http://localhost/api/generate", {
      method: "POST",
      body: JSON.stringify({ marketplace: "ebay", images: [image] }),
      headers: { Cookie: "sh_session=synthetic; sh_used_synthetic=8" },
    }),
  );
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { listing, comps: null, remaining: 1 });
  assert.equal(res.cookies.get("sh_used_synthetic")?.value, "9");
  assert.equal(calls, 1);
});

test("provider failure through the route does not consume allowance or reveal diagnostics", async () => {
  mockProviderEnvironment();
  let calls = 0;
  vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
    calls++;
    throw new Error("synthetic-private-provider-diagnostic");
  });
  const res = await POST(
    new NextRequest("http://localhost/api/generate", {
      method: "POST",
      body: JSON.stringify({ marketplace: "ebay", images: [image] }),
    }),
  );
  assert.equal(res.status, 502);
  assert.equal(res.headers.has("set-cookie"), false);
  assert.deepEqual(await res.json(), { error: "Generation failed, please try again." });
  assert.ok(calls > 0);
});
