import type { ApiPart, CompatibilityResult } from "../types";
import { BUILD_SLOTS } from "../constants";

// Shared by both the "Validate" check below and the live picker's
// Compatibility Filter (PartPickerOverlay.tsx) — a single source of truth so
// the two can't drift apart again. Keys must cover every real formFactor
// value the admin form can save ("ATX" / "mATX" / "ITX" — see
// ProductSpecFields.tsx), plus common variant spellings.
export const FORM_FACTOR_SIZE: Record<string, number> = { itx: 0, miniitx: 0, matx: 1, microatx: 1, atx: 2, eatx: 3 };
export const normalizeFormFactor = (s: string) => s.toLowerCase().replace(/[-\s]/g, '');

// ── Pure function ────────────────────────────────────────────────────────────
// Given the selected parts, returns compatibility errors/warnings and the total
// required wattage. No React, no toast, no store — deterministic and unit-testable.
export function checkCompatibility(selected: Record<string, ApiPart | null>): CompatibilityResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const cpu    = selected["CPU"];
  const mb     = selected["MOTHERBOARD"];
  const ram    = selected["MEMORY"];
  const psu    = selected["POWER_SUPPLY"];
  const gpu    = selected["GPU"];
  const pcCase = selected["CASE"];
  const cooler = selected["CPU_COOLER"];

  // ── Rule 1: CPU socket ↔ Motherboard socket ──────────────────
  if (cpu && mb && cpu.socket && mb.socket && cpu.socket !== mb.socket)
    errors.push(`CPU socket ${cpu.socket} does not fit Motherboard socket ${mb.socket}`);

  // ── Rule 2: RAM generation ↔ Motherboard RAM gen ─────────────
  if (mb && ram && mb.ramGen && ram.ramGen && mb.ramGen !== ram.ramGen)
    errors.push(`RAM is ${ram.ramGen} but Motherboard only supports ${mb.ramGen}`);

  // ── Rule 3: GPU physical length ↔ Case max GPU length ────────
  if (gpu && pcCase && gpu.gpuLengthMm && pcCase.maxGpuLengthMm) {
    if (gpu.gpuLengthMm > pcCase.maxGpuLengthMm)
      errors.push(`GPU is ${gpu.gpuLengthMm}mm long — Case only fits up to ${pcCase.maxGpuLengthMm}mm`);
  }

  // ── Rule 4: Motherboard form factor ↔ Case form factor ───────
  if (mb && pcCase && mb.formFactor && pcCase.formFactor) {
    const mbIdx   = FORM_FACTOR_SIZE[normalizeFormFactor(mb.formFactor)] ?? -1;
    const caseIdx = FORM_FACTOR_SIZE[normalizeFormFactor(pcCase.formFactor)] ?? -1;
    if (mbIdx !== -1 && caseIdx !== -1 && mbIdx > caseIdx)
      errors.push(`Motherboard (${mb.formFactor}) is too large for Case (${pcCase.formFactor})`);
  }

  // ── Rule 5: CPU Cooler socket support ↔ CPU socket ───────────
  if (cpu && cooler && cpu.socket && cooler.socketSupport) {
    const supported = cooler.socketSupport.split(',').map((s) => s.trim());
    if (!supported.includes(cpu.socket))
      errors.push(`Cooler does not support ${cpu.socket} (supports: ${cooler.socketSupport})`);
  }

  // ── Rule 6: PSU wattage vs total system TDP ──────────────────
  const totalWatts = BUILD_SLOTS.reduce((s, cfg) => {
    const p = selected[cfg.slot];
    return s + (p ? (p.tdp ?? cfg.defaultWatts) : 0);
  }, 0);
  if (psu?.wattage) {
    if (totalWatts > psu.wattage)
      errors.push(`System needs ~${totalWatts}W but PSU is only ${psu.wattage}W — not enough power`);
    else if (totalWatts > psu.wattage * 0.8)
      warnings.push(`System uses ~${totalWatts}W which is over 80% of PSU capacity (${psu.wattage}W) — consider a larger PSU`);
  }

  return { valid: errors.length === 0, errors, warnings, requiredWatts: totalWatts };
}
