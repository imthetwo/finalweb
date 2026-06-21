"use client";

import { AlertCircle, AlertTriangle, CheckCircle2, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatVnd } from "@/lib/format";
import type { CompatibilityResult } from "../types";

type Props = {
  compatibility: CompatibilityResult | null;
  estimatedWatts: number;
  totalPrice: number;
  validating: boolean;
  onValidate: () => void;
};

export function StatusBar({ compatibility, estimatedWatts, totalPrice, validating, onValidate }: Props) {
  const status = !compatibility
    ? { Icon: AlertCircle, label: "Not checked yet", cls: "text-muted border-edge bg-surface" }
    : compatibility.errors.length > 0
    ? { Icon: AlertCircle, label: `${compatibility.errors.length} compatibility errors`, cls: "text-red-400 border-red-800/50 bg-red-950/30" }
    : compatibility.warnings.length > 0
    ? { Icon: AlertTriangle, label: `${compatibility.warnings.length} warnings`, cls: "text-yellow-400 border-yellow-800/50 bg-yellow-950/30" }
    : { Icon: CheckCircle2, label: "Fully compatible", cls: "text-emerald-400 border-emerald-800/50 bg-emerald-950/30" };

  return (
    <div className="flex shrink-0 flex-col gap-2 border-b border-edge bg-base px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between md:px-6">
      <div className={cn("flex items-center gap-2 border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider", status.cls)}>
        <status.Icon size={13} />
        {status.label}
      </div>
      <div className="flex items-center gap-4">
        <span className="text-[12px] text-secondary">
          <Zap size={11} className="mr-1 inline text-brand" />
          Wattage: <strong className="text-fg">{estimatedWatts}W</strong>
        </span>
        <span className="hidden h-3.5 w-px bg-edge sm:block" />
        <span className="text-[12px] font-black text-fg">{formatVnd(totalPrice)}</span>
        <button type="button" onClick={onValidate} disabled={validating}
          className="border border-brand/40 bg-brand/6 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-brand hover:bg-brand/15 disabled:opacity-50">
          {validating ? "Checking…" : "Validate"}
        </button>
      </div>
    </div>
  );
}
