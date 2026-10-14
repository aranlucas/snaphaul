import { createEvent, fireEvent, render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import GeneratorPage from "../app/app/page";

test("leaving the photo drop zone for a non-DOM target clears its active state", () => {
  render(<GeneratorPage />);
  const sheet = screen.getByText("Choose photos").closest(".contact-sheet");

  expect(sheet).toBeInstanceOf(HTMLElement);

  if (!(sheet instanceof HTMLElement)) {
    throw new Error("Missing photo drop zone");
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
    throw new Error("Missing photo drop zone");
  }

  fireEvent.dragOver(sheet);
  const leave = createEvent.dragLeave(sheet);
  Object.defineProperty(leave, "relatedTarget", { value: chooser });
  fireEvent(sheet, leave);
  expect(sheet.classList.contains("is-dragging")).toBe(true);
});
