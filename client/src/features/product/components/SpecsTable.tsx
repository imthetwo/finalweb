import type {
  CpuSpec, GpuSpec, RamSpec, MotherboardSpec,
  PsuSpec, CaseSpec, CoolerSpec, MonitorSpec, StorageSpec, LaptopSpec,
  PcBuildSpec, FurnitureSpec,
} from "@/types/api";
import type { SpecRow, SpecsTableProps } from "../types";

function rows(entries: (SpecRow | null | undefined | false | "" | 0)[]): SpecRow[] {
  return entries.filter(Boolean) as SpecRow[];
}

function cpuSpecRows(s: CpuSpec): SpecRow[] {
  return rows([
    { label: "Socket",          value: s.socket },
    { label: "Cores / Threads", value: `${s.cores} cores / ${s.threads} threads` },
    { label: "Base Clock",      value: `${s.baseClockGhz} GHz` },
    { label: "Boost Clock",     value: `up to ${s.boostClockGhz} GHz` },
    s.cacheL3     && { label: "L3 Cache",   value: s.cacheL3 },
    s.generation  && { label: "Generation", value: s.generation },
    { label: "TDP",             value: `${s.tdp}W` },
  ]);
}

function gpuSpecRows(s: GpuSpec): SpecRow[] {
  return rows([
    { label: "VRAM",        value: `${s.vramGb} GB${s.memType ? ` ${s.memType}` : ""}` },
    s.boostClockMhz && { label: "Boost Clock",  value: `${s.boostClockMhz} MHz` },
    s.pcieGen       && { label: "PCIe",          value: `Gen ${s.pcieGen}` },
    s.lengthMm      && { label: "Card Length",   value: `${s.lengthMm} mm` },
    { label: "TDP",         value: `${s.tdp}W` },
  ]);
}

function ramSpecRows(s: RamSpec): SpecRow[] {
  return rows([
    { label: "Capacity",    value: `${s.capacityGb} GB${s.kit ? ` (${s.kit})` : ""}` },
    { label: "Generation",  value: s.generation },
    { label: "Speed",       value: `${s.speedMhz} MHz` },
    // Stored values already include the "CL" prefix (admin form placeholder
    // is "CL30", entered as-is) — don't prepend another one here.
    s.latency && { label: "Latency", value: s.latency },
  ]);
}

function motherboardSpecRows(s: MotherboardSpec): SpecRow[] {
  return rows([
    { label: "Socket",      value: s.socket },
    s.chipset   && { label: "Chipset",     value: s.chipset },
    { label: "Form Factor", value: s.formFactor },
    { label: "Memory",      value: s.ramGen },
    { label: "RAM Slots",   value: String(s.ramSlots) },
    s.maxRamGb  && { label: "Max RAM",    value: `${s.maxRamGb} GB` },
  ]);
}

function psuSpecRows(s: PsuSpec): SpecRow[] {
  return rows([
    { label: "Wattage",    value: `${s.wattage}W` },
    s.efficiency && { label: "Efficiency", value: s.efficiency },
    s.modular    && { label: "Modular",    value: s.modular },
  ]);
}

function caseSpecRows(s: CaseSpec): SpecRow[] {
  return rows([
    { label: "Form Factor Support", value: s.formFactor },
    s.maxGpuLengthMm  && { label: "Max GPU Length",    value: `${s.maxGpuLengthMm} mm` },
    s.radiatorSupport  && { label: "Radiator Support",  value: `${s.radiatorSupport}` },
    s.driveBays        && { label: "Drive Bays",        value: String(s.driveBays) },
  ]);
}

function coolerSpecRows(s: CoolerSpec): SpecRow[] {
  return rows([
    { label: "Type",        value: s.coolerType === "AIO" ? "All-in-One Liquid Cooler" : `${s.coolerType} Air Cooler` },
    s.radiatorSizeMm  && { label: "Radiator",         value: `${s.radiatorSizeMm} mm` },
    s.tdpRating        && { label: "TDP Rating",       value: `up to ${s.tdpRating}W` },
    s.socketSupport    && { label: "Socket Support",   value: s.socketSupport },
  ]);
}

function monitorSpecRows(s: MonitorSpec): SpecRow[] {
  return rows([
    { label: "Size",          value: `${s.sizeIn}"` },
    { label: "Resolution",    value: s.resolution },
    { label: "Refresh Rate",  value: `${s.refreshRateHz} Hz` },
    s.panelType  && { label: "Panel Type",    value: s.panelType },
    s.responseMs && { label: "Response Time", value: `${s.responseMs} ms` },
    s.hdr        && { label: "HDR",           value: "Yes" },
  ]);
}

function storageSpecRows(s: StorageSpec): SpecRow[] {
  const cap = s.capacityGb >= 1000 ? `${s.capacityGb / 1000} TB` : `${s.capacityGb} GB`;
  return rows([
    { label: "Capacity",         value: cap },
    { label: "Type",             value: s.storageType },
    s.interfaceType && { label: "Interface",       value: s.interfaceType },
    s.readMbps      && { label: "Sequential Read",  value: `${s.readMbps} MB/s` },
    s.writeMbps     && { label: "Sequential Write", value: `${s.writeMbps} MB/s` },
  ]);
}

function laptopSpecRows(s: LaptopSpec): SpecRow[] {
  const storage = s.storageGb >= 1000 ? `${s.storageGb / 1000} TB` : `${s.storageGb} GB`;
  return rows([
    { label: "Processor",  value: s.cpu },
    s.gpu           && { label: "Graphics",   value: s.gpu },
    { label: "Memory",     value: `${s.ramGb} GB DDR5` },
    { label: "Storage",    value: `${storage} PCIe NVMe SSD` },
    { label: "Display",    value: `${s.displaySizeIn}"${s.displayResolution ? ` ${s.displayResolution}` : ""}` },
    s.os            && { label: "Operating System", value: s.os },
  ]);
}

const BUILD_TYPE_LABEL: Record<PcBuildSpec["buildType"], string> = {
  GAMING_ESPORT: "Gaming Esport",
  WORKSTATION: "Workstation",
  MINI_SFF: "Mini (SFF)",
};

function pcBuildSpecRows(s: PcBuildSpec): SpecRow[] {
  return rows([{ label: "Build Type", value: BUILD_TYPE_LABEL[s.buildType] }]);
}

const FURNITURE_TYPE_LABEL: Record<FurnitureSpec["furnitureType"], string> = {
  CHAIR: "Gaming Chair",
  DESK: "Gaming Desk",
};

function furnitureSpecRows(s: FurnitureSpec): SpecRow[] {
  return rows([{ label: "Furniture Type", value: FURNITURE_TYPE_LABEL[s.furnitureType] }]);
}

// A single product can carry multiple spec relations at once (e.g. a Prebuilt
// PC has pcBuildSpec + cpuSpec + gpuSpec + ramSpec + storageSpec together) —
// combine every section that's present into one table instead of only
// showing the first match.
export function SpecsTable(props: SpecsTableProps) {
  const specRows: SpecRow[] = [
    ...(props.pcBuildSpec ? pcBuildSpecRows(props.pcBuildSpec) : []),
    ...(props.cpuSpec ? cpuSpecRows(props.cpuSpec) : []),
    ...(props.gpuSpec ? gpuSpecRows(props.gpuSpec) : []),
    ...(props.ramSpec ? ramSpecRows(props.ramSpec) : []),
    ...(props.storageSpec ? storageSpecRows(props.storageSpec) : []),
    ...(props.motherboardSpec ? motherboardSpecRows(props.motherboardSpec) : []),
    ...(props.psuSpec ? psuSpecRows(props.psuSpec) : []),
    ...(props.caseSpec ? caseSpecRows(props.caseSpec) : []),
    ...(props.coolerSpec ? coolerSpecRows(props.coolerSpec) : []),
    ...(props.monitorSpec ? monitorSpecRows(props.monitorSpec) : []),
    ...(props.laptopSpec ? laptopSpecRows(props.laptopSpec) : []),
    ...(props.furnitureSpec ? furnitureSpecRows(props.furnitureSpec) : []),
  ];

  if (specRows.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="mb-4 text-sm font-black uppercase tracking-[0.18em] text-fg">
        <span className="mr-1.5 font-bold opacity-40">{"//"}</span>
        Specifications
      </h2>
      <div className="border border-edge">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-edge bg-elevated">
              <th className="w-2/5 px-4 py-2.5 text-left text-xs font-black uppercase tracking-wider text-muted">
                Specification
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-black uppercase tracking-wider text-muted">
                Details
              </th>
            </tr>
          </thead>
          <tbody>
            {specRows.map((row, i) => (
              <tr key={`${row.label}-${i}`} className={i % 2 === 0 ? "bg-surface" : "bg-elevated"}>
                <td className="border-r border-edge px-4 py-3 font-semibold text-secondary">
                  {row.label}
                </td>
                <td className="px-4 py-3 text-fg">
                  {row.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
