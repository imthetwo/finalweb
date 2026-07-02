/**
 * Fix orphaned memory images in Cloudinary:
 * 1. Rename 2110201626450_jvsfjd (G.Skill Trident Z5 RGB) → gskill-trident-z5-rgb-ddr5
 * 2. Delete 164016510810_dwbldj  (G.Skill Ripjaws S5, no matching product)
 * 3. Update G.Skill Trident Z5 RGB product imageUrl in DB
 */

import { prisma } from "./prisma-client";
import "dotenv/config";

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME!;
const API_KEY    = process.env.CLOUDINARY_API_KEY!;
const API_SECRET = process.env.CLOUDINARY_API_SECRET!;

function authHeader() {
  return "Basic " + Buffer.from(`${API_KEY}:${API_SECRET}`).toString("base64");
}

async function renameAsset(fromPublicId: string, toPublicId: string) {
  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/rename`;
  const body = new URLSearchParams({
    from_public_id: fromPublicId,
    to_public_id:   toPublicId,
    overwrite:      "false",
  });
  const res = await fetch(url, {
    method:  "POST",
    headers: { Authorization: authHeader(), "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const json = await res.json() as Record<string, unknown>;
  if (!res.ok) throw new Error(`Rename failed: ${JSON.stringify(json)}`);
  console.log(`  Renamed → ${toPublicId}`);
  return json;
}

async function deleteAssets(publicIds: string[]) {
  const params = publicIds.map((id) => `public_ids[]=${encodeURIComponent(id)}`).join("&");
  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/resources/image/upload?${params}`;
  const res = await fetch(url, {
    method:  "DELETE",
    headers: { Authorization: authHeader() },
  });
  const json = await res.json() as Record<string, unknown>;
  if (!res.ok) throw new Error(`Delete failed: ${JSON.stringify(json)}`);
  console.log(`  Deleted ${publicIds.join(", ")}`);
  return json;
}

async function main() {
  const OLD_TRIDENT  = "2110201626450_jvsfjd";
  const NEW_TRIDENT  = "TechStore/memory/gskill-trident-z5-rgb-ddr5";
  const RIPJAWS_S5   = "164016510810_dwbldj";
  const NEW_IMAGE_URL = `https://res.cloudinary.com/dxbvnueoq/image/upload/f_auto,q_auto,w_600/${NEW_TRIDENT}`;

  console.log("1. Renaming G.Skill Trident Z5 RGB image...");
  await renameAsset(OLD_TRIDENT, NEW_TRIDENT);

  console.log("2. Deleting G.Skill Ripjaws S5 orphan (no product)...");
  await deleteAssets([RIPJAWS_S5]);

  console.log("3. Updating G.Skill Trident Z5 RGB product in DB...");
  const result = await prisma.product.updateMany({
    where: { name: { contains: "Trident Z5 RGB DDR5" } },
    data:  { imageUrl: NEW_IMAGE_URL },
  });
  console.log(`   Updated ${result.count} product(s)`);

  console.log("\nDone.");
}

main().catch(console.error);
