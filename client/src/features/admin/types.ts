// Map category name → spec key — shared between ProductSpecFields (renders
// the right field set) and useProductFormModal (prefills it on edit).
export type SpecKey =
  | "cpuSpec" | "gpuSpec" | "ramSpec" | "motherboardSpec" | "psuSpec"
  | "caseSpec" | "coolerSpec" | "monitorSpec" | "storageSpec" | "laptopSpec"
  | "pcBuildSpec" | "furnitureSpec";
