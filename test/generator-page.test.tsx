import { createEvent, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { z } from "zod";
import GeneratorPage from "@/app/app/page";
import { PhotoPreparation } from "@/app/components/photo-preparation";

test("leaving the photo drop zone for a non-DOM target clears its active state", () => {
  render(<GeneratorPage />);
  const sheet = screen.getByText("Choose photos").closest(".contact-sheet");

  expect(sheet).toBeInstanceOf(HTMLElement);

  if (!(sheet instanceof HTMLElement)) {
    throw new TypeError("Missing photo drop zone");
  }

  fireEvent.dragOver(sheet);
  expect(sheet.classList.contains("is-dragging")).toBe(true);
  const leave = createEvent.dragLeave(sheet);
  Object.defineProperty(leave, "relatedTarget", { value: window });
  fireEvent(sheet, leave);
  expect(sheet.classList.contains("is-dragging")).toBe(false);
});

test("moving within the photo drop zone keeps its active state", () => {
  render(<GeneratorPage />);
  const chooser = screen.getByText("Choose photos");
  const sheet = chooser.closest(".contact-sheet");

  if (!(sheet instanceof HTMLElement)) {
    throw new TypeError("Missing photo drop zone");
  }

  fireEvent.dragOver(sheet);
  const leave = createEvent.dragLeave(sheet);
  Object.defineProperty(leave, "relatedTarget", { value: chooser });
  fireEvent(sheet, leave);
  expect(sheet.classList.contains("is-dragging")).toBe(true);
});

const draftFor = {
  ebay: { title: "Blue jacket for eBay", tags: ["jacket"] },
  etsy: { title: "Vintage blue jacket for Etsy", tags: ["vintage jacket"] },
};

const RequestSchema = z.object({ marketplace: z.enum(["ebay", "etsy"]) });

function stubGenerationService() {
  const requests: string[] = [];

  vi.stubGlobal("matchMedia", () => ({ matches: false }));
  vi.stubGlobal("fetch", (_url: string, init: RequestInit) => {
    const { marketplace } = RequestSchema.parse(JSON.parse(z.string().parse(init.body)));

    requests.push(marketplace);

    return Promise.resolve(
      Response.json({
        listing: {
          item_identification: "Synthetic item",
          description: `Synthetic ${marketplace} description`,
          item_specifics: [{ name: "Brand", value: "Fixture Brand" }],
          category: "Clothing",
          price_suggested: 20,
          price_range: [15, 25],
          price_reasoning: "Synthetic estimate",
          photo_notes: ["Blue fabric"],
          ...draftFor[marketplace],
        },
        comps: null,
        remaining: 10 - requests.length,
      }),
    );
  });

  return requests;
}

async function generateEditedEbayThenEtsyDraft() {
  const { container } = render(
    // jsdom has no canvas; a synthetic JPEG data URL stands in for compression.
    <PhotoPreparation value={() => Promise.resolve("data:image/jpeg;base64,/9j/2wBD")}>
      <GeneratorPage />
    </PhotoPreparation>,
  );

  const input = container.querySelector('input[type="file"]');

  if (!(input instanceof HTMLInputElement)) {
    throw new TypeError("Missing photo input");
  }

  fireEvent.change(input, {
    target: { files: [new File(["synthetic"], "item.png", { type: "image/png" })] },
  });
  await screen.findByText("1 photo added.");
  fireEvent.click(screen.getByRole("button", { name: "Generate my listing" }));
  await screen.findByRole("heading", { name: "eBay draft" });
  fireEvent.change(screen.getByLabelText(/^Title/), { target: { value: "My edited eBay title" } });
  fireEvent.click(screen.getByRole("button", { name: "Etsy" }));
  await screen.findByRole("heading", { name: "Etsy draft" });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

test("a new marketplace draft keeps the edited draft it replaced and can swap back without a request", async () => {
  const requests = stubGenerationService();
  await generateEditedEbayThenEtsyDraft();

  expect(screen.getByLabelText(/^Title/)).toHaveProperty("value", draftFor.etsy.title);
  expect(
    screen.getByText("The eBay draft you had before, with your edits, is kept on this page."),
  ).toBeDefined();

  fireEvent.click(screen.getByRole("button", { name: "Restore previous draft" }));

  expect(screen.getByRole("heading", { name: "eBay draft" })).toBeDefined();
  expect(screen.getByLabelText(/^Title/)).toHaveProperty("value", "My edited eBay title");
  expect(screen.getByRole("radio", { name: "eBay" })).toHaveProperty("checked", true);
  expect(screen.queryByText(/Your source changed/)).toBeNull();
  expect(screen.getByText("The Etsy draft you had before is kept on this page.")).toBeDefined();

  fireEvent.click(screen.getByRole("button", { name: "Restore previous draft" }));

  expect(screen.getByRole("heading", { name: "Etsy draft" })).toBeDefined();
  expect(screen.getByLabelText(/^Title/)).toHaveProperty("value", draftFor.etsy.title);
  expect(requests).toEqual(["ebay", "etsy"]);
});

test("clearing the studio discards the restorable draft", async () => {
  stubGenerationService();
  await generateEditedEbayThenEtsyDraft();
  expect(screen.getByRole("button", { name: "Restore previous draft" })).toBeDefined();

  fireEvent.click(screen.getByRole("button", { name: "New item" }));

  expect(screen.queryByRole("button", { name: "Restore previous draft" })).toBeNull();
  expect(screen.queryByRole("heading", { name: "Etsy draft" })).toBeNull();
});
