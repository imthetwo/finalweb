"use client";

import Image from "next/image";
import Link from "next/link";
import { AlertCircle, AlertTriangle, Plus, RotateCcw, Save, ShoppingCart, Trash2, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableFooter,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { formatVnd } from "@/lib/format";

import { BUILD_SLOTS } from "../constants";
import { useCustomLabBuilder } from "../hooks/useCustomLabBuilder";
import { StatusBar } from "./StatusBar";
import { PartPickerOverlay } from "./PartPickerOverlay";

export default function CustomLabBuilder() {
  // Logic lives in the hook (defined outside); the component only calls it and renders.
  const {
    selected, parts, loading, pickerSlot, pickerCfg, compat,
    validating, saving, addingCart,
    totalPrice, estimatedWatts, selectedCount,
    openPicker, closePicker,
    selectPart, removePart, handleReset,
    validateBuild, addAllToCart, saveBuild,
  } = useCustomLabBuilder();

  return (
    <>
      <div className="flex min-h-screen flex-col bg-base text-fg">
        {/* Header */}
        <header className="flex shrink-0 items-center justify-between border-b border-edge bg-surface px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="border border-edge px-3 py-1.5 text-2xs font-black uppercase tracking-widest text-muted hover:border-brand/50 hover:text-brand">
              ← Exit Lab
            </Link>
            <div className="h-4 w-px bg-edge" />
            <div>
              <p className="text-3xs uppercase tracking-[0.3em] text-brand">Pecify</p>
              <h1 className="text-body font-black uppercase tracking-wider text-fg">PC Builder</h1>
            </div>
          </div>
        </header>

        {/* Status bar */}
        <StatusBar
          compatibility={compat}
          estimatedWatts={estimatedWatts}
          totalPrice={totalPrice}
          validating={validating}
          onValidate={validateBuild}
        />

        {/* Build table */}
        <main className="flex-1 overflow-auto px-4 py-8 md:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="overflow-hidden border border-edge bg-surface">
              <Table>
                <TableHeader>
                  <TableRow className="border-edge hover:bg-transparent">
                    <TableHead className="w-16 pl-5 pr-0" />
                    <TableHead className="w-40 text-xs font-black uppercase tracking-widest">Component</TableHead>
                    <TableHead className="text-xs font-black uppercase tracking-widest">Selection</TableHead>
                    <TableHead className="text-right text-xs font-black uppercase tracking-widest">Price</TableHead>
                    <TableHead className="w-14" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {BUILD_SLOTS.map((cfg) => {
                    const part = selected[cfg.slot] ?? null;
                    const isLoading = loading[cfg.slot];
                    return (
                      <TableRow key={cfg.slot} className="border-edge/50">
                        <TableCell className="py-4 pl-5 pr-2">
                          <div className="flex h-11 w-11 items-center justify-center border border-edge bg-surface/60">
                            <cfg.Icon size={18} className={part ? "text-brand" : "text-secondary"} />
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <p className="text-sm font-black uppercase tracking-wider text-fg">{cfg.shortLabel}</p>
                        </TableCell>
                        <TableCell className="py-4">
                          {part ? (
                            <div className="flex items-center gap-3">
                              <div className="h-14 w-14 shrink-0 border border-edge bg-surface">
                                {part.thumbnailUrl
                                  ? <Image src={part.thumbnailUrl} alt={part.name} width={56} height={56} className="h-full w-full object-contain p-1" />
                                  : <div className="flex h-full items-center justify-center"><cfg.Icon size={18} className="text-subtle" /></div>}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-body font-semibold text-fg">{part.name}</p>
                                <p className="mt-0.5 text-xs text-muted">{part.brand}</p>
                              </div>
                            </div>
                          ) : (
                            <Button variant="ghost" onClick={() => openPicker(cfg.slot)} disabled={isLoading}
                              className="h-10 gap-2 border border-dashed border-edge bg-transparent px-5 text-sm font-bold uppercase tracking-wider text-fg hover:border-brand/40 hover:bg-brand/5 hover:text-brand">
                              <Plus size={14} />
                              {isLoading ? "Loading…" : `Choose A ${cfg.shortLabel}`}
                            </Button>
                          )}
                        </TableCell>
                        <TableCell className="py-4 text-right">
                          {part
                            ? <span className="text-md font-black text-fg">{formatVnd(part.displayPrice)}</span>
                            : <span className="text-body text-secondary">—</span>}
                        </TableCell>
                        <TableCell className="py-4 pr-5">
                          {part && (
                            <button type="button" onClick={() => removePart(cfg.slot)}
                              className="flex h-9 w-9 items-center justify-center border border-red-800/40 bg-red-950/20 text-destructive hover:border-destructive hover:bg-red-950/50">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
                <TableFooter>
                  <TableRow className="border-t border-edge bg-elevated hover:bg-elevated">
                    <TableCell colSpan={3} className="py-4 pl-5">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-black uppercase tracking-wider text-fg">Total ({selectedCount} parts)</span>
                        {estimatedWatts > 0 && (
                          <Badge variant="outline" className="border-edge text-xs text-muted">
                            <Zap size={11} className="mr-1" />~{estimatedWatts}W
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-4 text-right">
                      <span className="text-xl font-black text-brand">{totalPrice > 0 ? formatVnd(totalPrice) : "—"}</span>
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableFooter>
              </Table>
            </div>

            {/* Compatibility messages */}
            {compat && (compat.errors.length > 0 || compat.warnings.length > 0) && (
              <div className="mt-4 space-y-2">
                {compat.errors.map((e, i) => (
                  <div key={i} className="flex gap-2.5 border border-red-800/40 bg-red-950/20 px-4 py-2.5">
                    <AlertCircle size={13} className="mt-0.5 shrink-0 text-destructive" />
                    <p className="text-body text-destructive">{e}</p>
                  </div>
                ))}
                {compat.warnings.map((w, i) => (
                  <div key={i} className="flex gap-2.5 border border-yellow-800/40 bg-yellow-950/20 px-4 py-2.5">
                    <AlertTriangle size={13} className="mt-0.5 shrink-0 text-warning" />
                    <p className="text-body text-warning">{w}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={handleReset} disabled={selectedCount === 0}
                className="h-10 gap-2 border-edge bg-transparent px-5 text-sm font-bold uppercase tracking-wider text-secondary hover:border-destructive hover:text-destructive">
                <RotateCcw size={13} /> Reset
              </Button>
              <Button variant="outline" onClick={saveBuild} disabled={saving || selectedCount === 0}
                className="h-10 gap-2 border-edge bg-transparent px-5 text-sm font-bold uppercase tracking-wider text-secondary hover:border-secondary hover:text-fg">
                <Save size={13} />{saving ? "Saving…" : "Save Build"}
              </Button>
              <Button onClick={addAllToCart} disabled={addingCart || selectedCount === 0}
                className="h-10 gap-2 bg-brand px-5 text-sm font-black uppercase tracking-wider text-brand-fg hover:bg-brand-hover disabled:opacity-50">
                <ShoppingCart size={13} />{addingCart ? "Adding…" : `Add ${selectedCount} Items to Cart`}
              </Button>
            </div>
          </div>
        </main>
      </div>

      {pickerSlot && pickerCfg && (
        <PartPickerOverlay
          slotCfg={pickerCfg}
          parts={parts[pickerSlot] ?? []}
          selected={selected}
          currentId={selected[pickerSlot]?.id}
          loading={loading[pickerSlot] ?? false}
          buildSummary={{ count: selectedCount, total: totalPrice, watts: estimatedWatts }}
          onAdd={(part) => selectPart(pickerSlot, part)}
          onClose={closePicker}
        />
      )}
    </>
  );
}
