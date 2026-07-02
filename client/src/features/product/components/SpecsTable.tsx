import type {
  CpuSpec, GpuSpec, RamSpec, MotherboardSpec,
  PsuSpec, CaseSpec, CoolerSpec, MonitorSpec, StorageSpec, LaptopSpec,
} from "@/types/api";

type Row = { label: string; value: string };

function rows(entries: (Row | null | false)[]): Row[] {
  return entries.filter(Boolean) as Row[];
}

function cpuRows(s: CpuSpec): Row[] {
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

function gpuRows(s: GpuSpec): Row[] {
  return rows([
    { label: "VRAM",        value: `${s.vramGb} GB${s.memType ? ` ${s.memType}` : ""}` },
    s.boostClockMhz && { label: "Boost Clock",  value: `${s.boostClockMhz} MHz` },
    s.pcieGen       && { label: "PCIe",          value: `Gen ${s.pcieGen}` },
    s.lengthMm      && { label: "Card Length",   value: `${s.lengthMm} mm` },
    { label: "TDP",         value: `${s.tdp}W` },
  ]);
}

function ramRows(s: RamSpec): Row[] {
  return rows([
    { label: "Capacity",    value: `${s.capacityGb} GB${s.kit ? ` (${s.kit})` : ""}` },
    { label: "Generation",  value: s.generation },
    { label: "Speed",       value: `${s.speedMhz} MHz` },
    s.latency && { label: "Latency", value: `CL${s.latency}` },
  ]);
}

function motherboardRows(s: MotherboardSpec): Row[] {
  return rows([
    { label: "Socket",      value: s.socket },
    s.chipset   && { label: "Chipset",     value: s.chipset },
    { label: "Form Factor", value: s.formFactor },
    { label: "Memory",      value: s.ramGen },
    { label: "RAM Slots",   value: String(s.ramSlots) },
    s.maxRamGb  && { label: "Max RAM",    value: `${s.maxRamGb} GB` },
  ]);
}

function psuRows(s: PsuSpec): Row[] {
  return rows([
    { label: "Wattage",    value: `${s.wattage}W` },
    s.efficiency && { label: "Efficiency", value: s.efficiency },
    s.modular    && { label: "Modular",    value: s.modular },
  ]);
}

function caseRows(s: CaseSpec): Row[] {
  return rows([
    { label: "Form Factor Support", value: s.formFactor },
    s.maxGpuLengthMm  && { label: "Max GPU Length",    value: `${s.maxGpuLengthMm} mm` },
    s.radiatorSupport  && { label: "Radiator Support",  value: `${s.radiatorSupport}` },
    s.driveBays        && { label: "Drive Bays",        value: String(s.driveBays) },
  ]);
}

function coolerRows(s: CoolerSpec): Row[] {
  return rows([
    { label: "Type",        value: s.coolerType === "AIO" ? "All-in-One Liquid Cooler" : `${s.coolerType} Air Cooler` },
    s.radiatorSizeMm  && { label: "Radiator",         value: `${s.radiatorSizeMm} mm` },
    s.tdpRating        && { label: "TDP Rating",       value: `up to ${s.tdpRating}W` },
    s.socketSupport    && { label: "Socket Support",   value: s.socketSupport },
  ]);
}

function monitorRows(s: MonitorSpec): Row[] {
  return rows([
    { label: "Size",          value: `${s.sizeIn}"` },
    { label: "Resolution",    value: s.resolution },
    { label: "Refresh Rate",  value: `${s.refreshRateHz} Hz` },
    s.panelType  && { label: "Panel Type",    value: s.panelType },
    s.responseMs && { label: "Response Time", value: `${s.responseMs} ms` },
    s.hdr        && { label: "HDR",           value: "Yes" },
  ]);
}

function storageRows(s: StorageSpec): Row[] {
  const cap = s.capacityGb >= 1000 ? `${s.capacityGb / 1000} TB` : `${s.capacityGb} GB`;
  return rows([
    { label: "Capacity",         value: cap },
    { label: "Type",             value: s.storageType },
    s.interfaceType && { label: "Interface",       value: s.interfaceType },
    s.readMbps      && { label: "Sequential Read",  value: `${s.readMbps} MB/s` },
    s.writeMbps     && { label: "Sequential Write", value: `${s.writeMbps} MB/s` },
  ]);
}

function laptopRows(s: LaptopSpec): Row[] {
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

type Props = {
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
};

export function SpecsTable(props: Props) {
  const specRows: Row[] =
    props.cpuSpec        ? cpuRows(props.cpuSpec) :
    props.gpuSpec        ? gpuRows(props.gpuSpec) :
    props.ramSpec        ? ramRows(props.ramSpec) :
    props.motherboardSpec? motherboardRows(props.motherboardSpec) :
    props.psuSpec        ? psuRows(props.psuSpec) :
    props.caseSpec       ? caseRows(props.caseSpec) :
    props.coolerSpec     ? coolerRows(props.coolerSpec) :
    props.monitorSpec    ? monitorRows(props.monitorSpec) :
    props.storageSpec    ? storageRows(props.storageSpec) :
    props.laptopSpec     ? laptopRows(props.laptopSpec) :
    [];

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
              <tr key={row.label} className={i % 2 === 0 ? "bg-surface" : "bg-elevated"}>
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
