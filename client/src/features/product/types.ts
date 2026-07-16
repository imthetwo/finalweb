import type {
  CpuSpec, GpuSpec, RamSpec, MotherboardSpec,
  PsuSpec, CaseSpec, CoolerSpec, MonitorSpec, StorageSpec, LaptopSpec,
  PcBuildSpec, FurnitureSpec,
} from "@/types/api";

export type SpecRow = { label: string; value: string };

export type SpecsTableProps = {
  cpuSpec?: CpuSpec | null;
  gpuSpec?: GpuSpec | null;
  ramSpec?: RamSpec | null;
  motherboardSpec?: MotherboardSpec | null;
  psuSpec?: PsuSpec | null;
  caseSpec?: CaseSpec | null;
  coolerSpec?: CoolerSpec | null;
  monitorSpec?: MonitorSpec | null;
  storageSpec?: StorageSpec | null;
  laptopSpec?: LaptopSpec | null;
  pcBuildSpec?: PcBuildSpec | null;
  furnitureSpec?: FurnitureSpec | null;
};
