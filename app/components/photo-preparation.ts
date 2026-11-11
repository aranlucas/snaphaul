"use client";

import { createContext } from "react";
import imageCompression from "browser-image-compression";
import { MAX_IMAGE_BYTES } from "@/lib/listing-contract";

/** Turn a selected photo into the compressed data URL sent for generation. */
export type PreparePhoto = (file: File) => Promise<string>;

export async function compressPhoto(file: File): Promise<string> {
  const out = await imageCompression(file, {
    maxSizeMB: 0.4,
    maxWidthOrHeight: 1024,
    useWebWorker: false,
    fileType: "image/jpeg",
  });

  if (out.size > MAX_IMAGE_BYTES) {
    throw new Error("Image could not be reduced");
  }

  return imageCompression.getDataUrlFromFile(out);
}

// Compression needs a real browser canvas; tests provide a synthetic implementation.
export const PhotoPreparation = createContext<PreparePhoto>(compressPhoto);
