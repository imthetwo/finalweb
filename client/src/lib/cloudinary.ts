// Shared Cloudinary URL builder — single source of truth.
// Ảnh trong server/local_images đã upload lên Cloudinary dưới TechStore/{folder}/{name}.

const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD ?? "dxbvnueoq";

/**
 * Trả về URL Cloudinary với auto-format + auto-quality + giới hạn width.
 * @param folder Tên folder gốc (vd "PCs", "gpu", "funiture")
 * @param file   Tên file (có hoặc không phần mở rộng — Cloudinary tự resolve)
 * @param w      Width tối đa (px)
 */
export function cdn(folder: string, file: string, w = 600): string {
  const name = file.replace(/\.[^.]+$/, ""); // strip extension
  return `https://res.cloudinary.com/${CLOUD}/image/upload/f_auto,q_auto,w_${w}/TechStore/${folder}/${name}`;
}
