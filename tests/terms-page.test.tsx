import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import Terms from "../app/terms/page";

test("terms page renders its title and legal navigation", () => {
  render(<Terms />);

  expect(screen.getByRole("heading", { level: 1, name: "Terms of Service" })).toBeDefined();
  expect(screen.getByRole("navigation", { name: "Legal" })).toBeDefined();
});
