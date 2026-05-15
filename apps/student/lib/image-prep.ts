/**
 * Image preprocessing for the scan solver.
 *
 * Cheap, deterministic transforms that improve OCR results AND shrink
 * the upload payload:
 *
 *   1. Auto-rotate from EXIF — most phone cameras tag the orientation
 *      rather than physically rotating pixels. MathPix and other OCR
 *      providers don't always respect the EXIF tag, so we re-encode the
 *      image after a no-op manipulation, which Expo applies the
 *      orientation during.
 *   2. Resize so the long edge is at most MAX_DIMENSION px — Grade 9
 *      equations don't need 4032×3024. ~1600px keeps fine detail without
 *      bloating uploads on 3G.
 *   3. Re-encode as JPEG at QUALITY (0–1).
 *
 * Returns a fresh URI plus the resulting MIME / filename.
 *
 * Phase 1 may add: brightness/contrast normalisation, perspective-correct
 * crop, page-edge detection. Out of scope for Phase 0+.
 */

import {
  manipulateAsync,
  SaveFormat,
  type ImageResult,
} from "expo-image-manipulator";

const MAX_DIMENSION = 1600;
const QUALITY = 0.85;

export interface PreparedImage {
  uri: string;
  mimeType: string;
  fileName: string;
  width: number;
  height: number;
}

export async function prepareImageForOcr(
  input: { uri: string; width?: number; height?: number },
): Promise<PreparedImage> {
  const actions = [];

  if (input.width && input.height) {
    const longEdge = Math.max(input.width, input.height);
    if (longEdge > MAX_DIMENSION) {
      const scale = MAX_DIMENSION / longEdge;
      actions.push({
        resize: {
          width: Math.round(input.width * scale),
          height: Math.round(input.height * scale),
        },
      });
    }
  } else {
    // Dimensions unknown — let manipulator do its default fit-to-edge.
    actions.push({ resize: { width: MAX_DIMENSION } });
  }

  // Even with no resize, re-encoding here applies EXIF orientation and
  // strips metadata (privacy benefit too — no GPS coords sent to OCR).
  const result: ImageResult = await manipulateAsync(input.uri, actions, {
    compress: QUALITY,
    format: SaveFormat.JPEG,
  });

  return {
    uri: result.uri,
    mimeType: "image/jpeg",
    fileName: "scan.jpg",
    width: result.width,
    height: result.height,
  };
}
