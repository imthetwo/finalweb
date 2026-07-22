// Shared Cloudinary URL builder — single source of truth.

const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD ?? "dxbvnueoq";

/**
 * Returns a Cloudinary URL with auto-format + auto-quality + a max width.
 * @param folder Root folder name (e.g. "PCs", "gpu", "funiture")
 * @param file   File name (with or without extension — Cloudinary resolves it)
 * @param w      Max width (px)
 */
export function cdn(folder: string, file: string, w = 600): string {
  const name = file.replace(/\.[^.]+$/, ""); // strip extension
  return `https://res.cloudinary.com/${CLOUD}/image/upload/f_auto,q_auto,w_${w}/TechStore/${folder}/${name}`;
}

// Homepage hero background video, served from Cloudinary.
export const HERO_VIDEO_URL =
  "https://res.cloudinary.com/dxbvnueoq/video/upload/v1784725530/hero_dvbszs.mp4";

// Poster (still shown before the video loads) generated from the hero video's
// own first frame — Cloudinary makes a JPG from any video by inserting `so_0`
// (start offset 0s) and swapping the extension to .jpg, so there's no separate
// poster file to upload or keep in sync.
export const HERO_POSTER_URL = HERO_VIDEO_URL
  .replace("/video/upload/", "/video/upload/so_0/")
  .replace(/\.mp4$/, ".jpg");
