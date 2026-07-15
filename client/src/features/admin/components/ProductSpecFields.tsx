"use client";

// Map category name → spec key
export type SpecKey =
  | "cpuSpec" | "gpuSpec" | "ramSpec" | "motherboardSpec" | "psuSpec"
  | "caseSpec" | "coolerSpec" | "monitorSpec" | "storageSpec" | "laptopSpec"
  | "pcBuildSpec" | "furnitureSpec";

export const NAME_TO_SPEC: Record<string, SpecKey> = {
  "processors (cpu)": "cpuSpec",
  "processors": "cpuSpec",
  "cpu": "cpuSpec",
  "graphics cards (gpu)": "gpuSpec",
  "graphics cards": "gpuSpec",
  "gpu": "gpuSpec",
  "ram": "ramSpec",
  "motherboards": "motherboardSpec",
  "power supplies": "psuSpec",
  "pc cases": "caseSpec",
  "cpu coolers": "coolerSpec",
  "gaming monitors": "monitorSpec",
  "storage (ssd/hdd)": "storageSpec",
  "storage": "storageSpec",
  "laptops": "laptopSpec",
  "prebuilt pcs": "pcBuildSpec",
  "gaming furniture": "furnitureSpec",
};

const SPEC_LABELS: Record<SpecKey, string> = {
  cpuSpec: "CPU Specs", gpuSpec: "GPU Specs", ramSpec: "RAM Specs",
  motherboardSpec: "Motherboard Specs", psuSpec: "PSU Specs", caseSpec: "Case Specs",
  coolerSpec: "Cooler Specs", monitorSpec: "Monitor Specs", storageSpec: "Storage Specs",
  laptopSpec: "Laptop Specs", pcBuildSpec: "Prebuilt PC Build Type",
  furnitureSpec: "Furniture Type",
};

// Shared field styling — exported so the parent form reuses the same look.
export const inputCls =
  "w-full border border-edge bg-surface px-3 py-2 text-body text-fg outline-none focus:border-brand/50 placeholder:text-subtle";
export const labelCls =
  "mb-1 block text-2xs font-bold uppercase tracking-wider text-muted";
const rowCls = "grid grid-cols-2 gap-4";

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className={labelCls}>{label}</label>{children}</div>;
}

type SpecValue = string | number | boolean;

export function ProductSpecFields({
  specKey, specFields, setSpec,
}: {
  specKey: SpecKey | undefined;
  specFields: Record<string, SpecValue>;
  setSpec: (key: string, val: SpecValue) => void;
}) {
  if (!specKey) return null;

  function numSpec(key: string): number | "" {
    const v = specFields[key];
    return typeof v === "number" ? v : v !== undefined ? Number(v) || "" : "";
  }
  function strSpec(key: string): string {
    return specFields[key] !== undefined ? String(specFields[key]) : "";
  }
  function i(key: string, placeholder?: string, type: "text" | "number" = "text") {
    return (
      <input
        type={type}
        className={inputCls}
        placeholder={placeholder}
        value={type === "number" ? numSpec(key) : strSpec(key)}
        onChange={(e) => setSpec(key, type === "number" ? (e.target.value ? Number(e.target.value) : 0) : e.target.value)}
      />
    );
  }
  function sel(key: string, opts: string[]) {
    return (
      <select className={inputCls} value={strSpec(key)} onChange={(e) => setSpec(key, e.target.value)}>
        <option value="">— Select —</option>
        {opts.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  }

  const sections: Record<SpecKey, React.ReactNode> = {
    cpuSpec: (
      <div className={rowCls}>
        <Field label="Socket *">{sel("socket", ["AM5", "AM4", "LGA1700", "LGA1851"])}</Field>
        <Field label="Generation">{i("generation", "Ryzen 9000 / Core Ultra 200")}</Field>
        <Field label="Cores *">{i("cores", "8", "number")}</Field>
        <Field label="Threads *">{i("threads", "16", "number")}</Field>
        <Field label="Base clock (GHz) *">{i("baseClockGhz", "3.7", "number")}</Field>
        <Field label="Boost clock (GHz) *">{i("boostClockGhz", "5.5", "number")}</Field>
        <Field label="TDP (W) *">{i("tdp", "65", "number")}</Field>
        <Field label="L3 cache">{i("cacheL3", "32MB")}</Field>
      </div>
    ),
    gpuSpec: (
      <div className={rowCls}>
        <Field label="VRAM (GB) *">{i("vramGb", "16", "number")}</Field>
        <Field label="TDP (W) *">{i("tdp", "200", "number")}</Field>
        <Field label="Length (mm)">{i("lengthMm", "336", "number")}</Field>
        <Field label="PCIe gen">{i("pcieGen", "4", "number")}</Field>
        <Field label="Boost clock (MHz)">{i("boostClockMhz", "2610", "number")}</Field>
        <Field label="Memory type">{sel("memType", ["GDDR6", "GDDR6X", "GDDR7"])}</Field>
      </div>
    ),
    ramSpec: (
      <div className={rowCls}>
        <Field label="Capacity (GB) *">{i("capacityGb", "32", "number")}</Field>
        <Field label="Speed (MHz) *">{i("speedMhz", "6000", "number")}</Field>
        <Field label="Generation *">{sel("generation", ["DDR5", "DDR4"])}</Field>
        <Field label="Latency">{i("latency", "CL30")}</Field>
        <Field label="Kit">{i("kit", "2x16GB")}</Field>
      </div>
    ),
    motherboardSpec: (
      <div className={rowCls}>
        <Field label="Socket *">{sel("socket", ["AM5", "AM4", "LGA1700", "LGA1851"])}</Field>
        <Field label="Chipset">{i("chipset", "X670E / Z890")}</Field>
        <Field label="Form factor *">{sel("formFactor", ["ATX", "mATX", "ITX"])}</Field>
        <Field label="RAM gen *">{sel("ramGen", ["DDR5", "DDR4"])}</Field>
        <Field label="RAM slots *">{i("ramSlots", "4", "number")}</Field>
        <Field label="Max RAM (GB)">{i("maxRamGb", "192", "number")}</Field>
      </div>
    ),
    psuSpec: (
      <div className={rowCls}>
        <Field label="Wattage (W) *">{i("wattage", "850", "number")}</Field>
        <Field label="Efficiency">{sel("efficiency", ["80+ White", "80+ Bronze", "80+ Gold", "80+ Platinum", "80+ Titanium"])}</Field>
        <Field label="Modular">{sel("modular", ["Full", "Semi", "Non"])}</Field>
      </div>
    ),
    caseSpec: (
      <div className={rowCls}>
        <Field label="Form factor *">{sel("formFactor", ["ATX", "mATX", "ITX"])}</Field>
        <Field label="Max GPU length (mm)">{i("maxGpuLengthMm", "360", "number")}</Field>
        <Field label="Radiator support">{i("radiatorSupport", "360mm")}</Field>
        <Field label="Drive bays">{i("driveBays", "2", "number")}</Field>
      </div>
    ),
    coolerSpec: (
      <div className={rowCls}>
        <Field label="Type *">{sel("coolerType", ["Air", "AIO"])}</Field>
        <Field label="TDP rating (W)">{i("tdpRating", "250", "number")}</Field>
        <Field label="Radiator size (mm)">{sel("radiatorSizeMm", ["120", "240", "280", "360"])}</Field>
        <Field label="Socket support">{i("socketSupport", "AM5,LGA1700,LGA1851")}</Field>
      </div>
    ),
    monitorSpec: (
      <div className={rowCls}>
        <Field label="Size (in) *">{i("sizeIn", "27", "number")}</Field>
        <Field label="Resolution *">{i("resolution", "2560x1440")}</Field>
        <Field label="Refresh rate (Hz) *">{i("refreshRateHz", "165", "number")}</Field>
        <Field label="Panel type">{sel("panelType", ["IPS", "VA", "TN", "OLED"])}</Field>
        <Field label="Response (ms)">{i("responseMs", "1", "number")}</Field>
        <Field label="HDR">
          <select className={inputCls} value={specFields.hdr !== undefined ? String(specFields.hdr) : ""}
            onChange={(e) => setSpec("hdr", e.target.value === "true")}>
            <option value="">— Select —</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </Field>
      </div>
    ),
    storageSpec: (
      <div className={rowCls}>
        <Field label="Capacity (GB) *">{i("capacityGb", "1000", "number")}</Field>
        <Field label="Type *">{sel("storageType", ["NVMe", "SSD", "HDD"])}</Field>
        <Field label="Interface">{i("interfaceType", "PCIe 4.0")}</Field>
        <Field label="Read (MB/s)">{i("readMbps", "7000", "number")}</Field>
        <Field label="Write (MB/s)">{i("writeMbps", "6500", "number")}</Field>
      </div>
    ),
    laptopSpec: (
      <div className={rowCls}>
        <Field label="CPU *">{i("cpu", "Intel Core i7-13700H")}</Field>
        <Field label="GPU">{i("gpu", "RTX 4060")}</Field>
        <Field label="RAM (GB) *">{i("ramGb", "16", "number")}</Field>
        <Field label="Storage (GB) *">{i("storageGb", "512", "number")}</Field>
        <Field label="Display size (in) *">{i("displaySizeIn", "15.6", "number")}</Field>
        <Field label="Resolution">{i("displayResolution", "1920x1080")}</Field>
        <Field label="OS">{i("os", "Windows 11")}</Field>
      </div>
    ),
    pcBuildSpec: (
      <div className={rowCls}>
        <Field label="Build type *">
          {sel("buildType", ["GAMING_ESPORT", "WORKSTATION", "MINI_SFF"])}
        </Field>
      </div>
    ),
    furnitureSpec: (
      <div className={rowCls}>
        <Field label="Furniture type *">
          {sel("furnitureType", ["CHAIR", "DESK"])}
        </Field>
      </div>
    ),
  };

  return (
    <div className="border border-edge p-4">
      <p className="mb-3 text-2xs font-bold uppercase tracking-wider text-brand/70">{SPEC_LABELS[specKey]}</p>
      {sections[specKey]}
    </div>
  );
}
