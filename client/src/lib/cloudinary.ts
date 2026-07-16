// Shared Cloudinary URL builder — single source of truth.
// Images in server/local_images were uploaded to Cloudinary under TechStore/{folder}/{name}.

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
