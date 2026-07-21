"use client";

import { VN_LOCATIONS, wardsOf, displayCityName, displayWardName } from "@/lib/vn-locations";
import type { AddressFieldsValue } from "@/types/api";

const TEXT_FIELDS: { key: "recipient" | "phone" | "street"; label: string; placeholder: string }[] = [
  { key: "recipient", label: "Full name", placeholder: "Nguyen Van A" },
  { key: "phone", label: "Phone number", placeholder: "0901 234 567" },
  { key: "street", label: "Street address", placeholder: "123 Nguyen Hue, Ward 1" },
];

const inputCls =
  "w-full border border-edge bg-surface px-4 py-2.5 text-sm text-fg outline-none transition-colors focus:border-brand/50 placeholder:text-subtle";
const labelCls = "mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted";

export function AddressFields({
  value,
  onChange,
}: {
  value: AddressFieldsValue;
  onChange: (next: AddressFieldsValue) => void;
}) {
  return (
    <div className="space-y-4">
      {TEXT_FIELDS.map(({ key, label, placeholder }) => (
        <div key={key}>
          <label className={labelCls}>{label}</label>
          <input
            required
            placeholder={placeholder}
            className={inputCls}
            value={value[key]}
            onChange={(e) => onChange({ ...value, [key]: e.target.value })}
          />
        </div>
      ))}

      {/* City / Province — official 34-unit list; choosing one loads its wards */}
      <div>
        <label className={labelCls}>City / Province</label>
        <select
          required
          className={`${inputCls} cursor-pointer [&>option]:bg-surface`}
          value={value.city}
          onChange={(e) => onChange({ ...value, city: e.target.value, ward: "" })}
        >
          <option value="" disabled>
            Select a city / province…
          </option>
          {VN_LOCATIONS.map((l) => (
            <option key={l.name} value={l.name}>
              {displayCityName(l.name)}
            </option>
          ))}
        </select>
      </div>

      {/* Ward — depends on the selected city; districts no longer exist */}
      <div>
        <label className={labelCls}>Ward</label>
        <select
          required
          disabled={!value.city}
          className={`${inputCls} cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 [&>option]:bg-surface`}
          value={value.ward}
          onChange={(e) => onChange({ ...value, ward: e.target.value })}
        >
          <option value="" disabled>
            {value.city ? "Select a ward…" : "Select a city first…"}
          </option>
          {wardsOf(value.city).map((w) => (
            <option key={w} value={w}>
              {displayWardName(w)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
