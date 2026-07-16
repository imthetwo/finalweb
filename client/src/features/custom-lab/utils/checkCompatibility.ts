import type { ApiPart, CompatibilityResult, CompatCheck } from "../types";
import { BUILD_SLOTS } from "../constants";

const NO_CHECK: CompatCheck = { ok: true, label: "", detail: "" };

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

// ── Single-candidate check ───────────────────────────────────────────────────
// Same rules as checkCompatibility() above, but scoped to one candidate part
// against whatever else is already in the build — used by the part-picker's
// Compatibility Filter and its "Add" confirmation toast, which need a
// human-readable reason rather than a whole-build error/warning list. Kept
// here (not duplicated in the component) so the two can't drift apart.
export function checkCandidatePart(part: ApiPart, slot: string, sel: Record<string, ApiPart | null | undefined>): CompatCheck {
  const cpu    = sel['CPU'];
  const mb     = sel['MOTHERBOARD'];
  const ram    = sel['MEMORY'];
  const gpu    = sel['GPU'];
  const pcCase = sel['CASE'];

  switch (slot) {
    case 'CPU':
      if (mb?.socket && part.socket) {
        return part.socket !== mb.socket
          ? { ok: false, label: "Socket compatibility", detail: `${part.socket} does not match your motherboard's ${mb.socket} socket` }
          : { ok: true, label: "Socket compatibility", detail: `${part.socket} matches your motherboard` };
      }
      break;
    case 'MOTHERBOARD':
      if (cpu?.socket && part.socket && part.socket !== cpu.socket)
        return { ok: false, label: "Socket compatibility", detail: `${part.socket} does not match your CPU's ${cpu.socket} socket` };
      if (ram?.ramGen && part.ramGen && part.ramGen !== ram.ramGen)
        return { ok: false, label: "RAM generation compatibility", detail: `Board supports ${part.ramGen}, but your RAM is ${ram.ramGen}` };
      if (cpu?.socket || ram?.ramGen)
        return { ok: true, label: "Socket compatibility", detail: "Matches your current build" };
      break;
    case 'MEMORY':
      if (mb?.ramGen && part.ramGen) {
        return part.ramGen !== mb.ramGen
          ? { ok: false, label: "RAM generation compatibility", detail: `${part.ramGen} does not match your motherboard's ${mb.ramGen} slots` }
          : { ok: true, label: "RAM generation compatibility", detail: `${part.ramGen} matches your motherboard` };
      }
      break;
    case 'GPU':
      if (pcCase?.maxGpuLengthMm && part.gpuLengthMm) {
        return part.gpuLengthMm > pcCase.maxGpuLengthMm
          ? { ok: false, label: "Case clearance", detail: `${part.gpuLengthMm}mm is too long for your case (max ${pcCase.maxGpuLengthMm}mm)` }
          : { ok: true, label: "Case clearance", detail: `${part.gpuLengthMm}mm fits your case` };
      }
      break;
    case 'CASE': {
      if (mb?.formFactor && part.formFactor) {
        const mbIdx   = FORM_FACTOR_SIZE[normalizeFormFactor(mb.formFactor)]   ?? -1;
        const caseIdx = FORM_FACTOR_SIZE[normalizeFormFactor(part.formFactor)] ?? -1;
        if (mbIdx !== -1 && caseIdx !== -1 && mbIdx > caseIdx)
          return { ok: false, label: "Form factor compatibility", detail: `Your ${mb.formFactor} motherboard doesn't fit this ${part.formFactor} case` };
      }
      if (gpu?.gpuLengthMm && part.maxGpuLengthMm && gpu.gpuLengthMm > part.maxGpuLengthMm)
        return { ok: false, label: "GPU clearance", detail: `Your GPU (${gpu.gpuLengthMm}mm) is too long for this case (max ${part.maxGpuLengthMm}mm)` };
      if (mb?.formFactor || gpu?.gpuLengthMm)
        return { ok: true, label: "Form factor compatibility", detail: "Fits your current build" };
      break;
    }
    case 'CPU_COOLER':
      if (cpu?.socket && part.socketSupport) {
        const supported = part.socketSupport.split(',').map((s) => s.trim());
        return !supported.includes(cpu.socket)
          ? { ok: false, label: "Socket compatibility", detail: `Cooler does not support your CPU's ${cpu.socket} socket` }
          : { ok: true, label: "Socket compatibility", detail: `Supports your CPU's ${cpu.socket} socket` };
      }
      break;
  }
  return NO_CHECK; // nothing to check yet — no relevant part selected in the build so far
}

export function isCandidateCompatible(part: ApiPart, slot: string, sel: Record<string, ApiPart | null | undefined>): boolean {
  return checkCandidatePart(part, slot, sel).ok;
}
