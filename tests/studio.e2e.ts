import { test } from "@e2e-dev/web";
import { expect } from "e2e";
import { z } from "zod";

const listing = {
  item_identification: "Synthetic item",
  title: "Blue jacket",
  description: "A blue jacket in used condition.",
  item_specifics: [{ name: "Brand", value: "Fixture Brand" }],
  tags: ["jacket"],
  category: "Clothing",
  price_suggested: 20,
  price_range: [15, 25],
  price_reasoning: "Synthetic estimate",
  photo_notes: ["Blue fabric"],
};

test("seller prepares, edits and copies a draft, recovers from failure, then clears the item", async ({
  app,
  browser,
  screen,
}) => {
  let calls = 0;
  await browser.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: (text: string) => {
          window.sessionStorage.setItem("copied-text", text);

          return Promise.resolve();
        },
      },
    });
  });
  await browser.route("**/api/generate", async (route) => {
    calls++;

    const input = z
      .object({
        marketplace: z.string(),
        brand: z.string(),
        images: z.array(z.string()),
      })
      .parse(JSON.parse(route.request.postData ?? "{}"));

    expect(input.marketplace).toBe("etsy");
    expect(input.brand).toBe("Fixture Brand");
    expect(input.images).toHaveLength(1);
    expect(input.images[0]).toMatch(/^data:image\/jpeg;base64,/);

    if (calls === 2) {
      await route.fulfill({ status: 502, json: { error: "Generation failed, please try again." } });

      return;
    }

    await route.fulfill({ json: { listing, comps: null, remaining: calls === 1 ? 9 : 8 } });
  });
  await app.open("/app");
  await expect(screen.getByRole("button", "Generate my listing")).toBeDisabled();
  // The upload input is visually hidden inside its label; select the file input directly.
  await browser.locator('input[type="file"]').setInputFiles("tests/fixtures/item.png");
  await expect(screen.getByText("1 photo added.")).toBeVisible();
  await screen.getByText("Fill in what photos can’t tell").tap();
  await screen.getByLabel("Brand", { exact: true }).fill("Fixture Brand");
  await screen.getByRole("radio", "Etsy").tap();
  await screen.getByRole("button", "Generate my listing").tap();
  await expect(screen.getByRole("heading", "Etsy draft")).toBeVisible();
  await expect(screen.getByText("9 of 10 generations left")).toBeVisible();
  await screen.getByLabel("Title Editable").fill("Edited jacket title");
  await screen.getByRole("button", "Copy title", { exact: true }).tap();
  await expect(screen.getByText("Title copied.")).toBeVisible();
  expect(await browser.evaluate(() => window.sessionStorage.getItem("copied-text"))).toBe(
    "Edited jacket title",
  );
  await screen.getByRole("button", "Generate a new draft").tap();
  await expect(
    screen.getByRole("alert").filter({ hasText: "Generation failed, please try again." }),
  ).toContainText("Generation failed, please try again.");
  await expect(screen.getByLabel("Title Editable")).toHaveValue("Edited jacket title");
  await screen.getByRole("button", "Try again", { exact: true }).tap();
  await expect(screen.getByText("8 of 10 generations left")).toBeVisible();
  await expect(screen.getByLabel("Title Editable")).toHaveValue("Blue jacket");
  expect(calls).toBe(3);
  await screen.getByRole("button", "New item").tap();
  await expect(screen.getByRole("button", "Generate my listing")).toBeDisabled();
  await expect(screen.getByText("0 photos added.")).toBeVisible();
  await expect(screen.getByLabel("Brand", { exact: true })).toHaveValue("");
  await expect(screen.getByRole("heading", "Etsy draft")).not.toBeVisible();
});
