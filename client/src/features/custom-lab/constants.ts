import {
  Box, CircuitBoard, Cpu, Database, HardDrive, Monitor, Thermometer, Wind, Zap,
} from "lucide-react";
import type { SlotCfg } from "./types";

export const BUILD_SLOTS: SlotCfg[] = [
  { slot: "CPU", label: "CPU (Processor)", shortLabel: "CPU", Icon: Cpu, defaultWatts: 65,
    specs: [{ key: "socket", label: "Socket" }, { key: "tdp", label: "TDP", fmt: (v) => v ? `${v}W` : "—" }] },
  { slot: "CPU_COOLER", label: "CPU Cooler", shortLabel: "CPU Cooler", Icon: Thermometer, defaultWatts: 5,
    specs: [{ key: "formFactor", label: "Type" }, { key: "tdp", label: "Power", fmt: (v) => v ? `${v}W` : "—" }] },
  { slot: "MOTHERBOARD", label: "Motherboard", shortLabel: "Motherboard", Icon: CircuitBoard, defaultWatts: 30,
    specs: [{ key: "socket", label: "Socket" }, { key: "ramGen", label: "RAM" }, { key: "formFactor", label: "Form Factor" }] },
  { slot: "MEMORY", label: "Memory (RAM)", shortLabel: "RAM", Icon: Database, defaultWatts: 10,
    specs: [{ key: "ramGen", label: "Type" }, { key: "tdp", label: "Draw", fmt: (v) => v ? `${v}W` : "—" }] },
  { slot: "STORAGE", label: "Storage (Drive)", shortLabel: "Storage", Icon: HardDrive, defaultWatts: 5,
    specs: [{ key: "formFactor", label: "Interface" }, { key: "tdp", label: "Power", fmt: (v) => v ? `${v}W` : "—" }] },
  { slot: "GPU", label: "Video Card (GPU)", shortLabel: "GPU", Icon: Monitor, defaultWatts: 150,
    specs: [{ key: "tdp", label: "TDP", fmt: (v) => v ? `${v}W` : "—" }] },
  { slot: "CASE", label: "Case (Chassis)", shortLabel: "Case", Icon: Box, defaultWatts: 0,
    specs: [{ key: "formFactor", label: "Form Factor" }] },
  { slot: "POWER_SUPPLY", label: "Power Supply (PSU)", shortLabel: "PSU", Icon: Zap, defaultWatts: 0,
    specs: [{ key: "wattage", label: "Wattage", fmt: (v) => v ? `${v}W` : "—" }] },
  { slot: "CASE_FAN", label: "Case Fan", shortLabel: "Case Fan", Icon: Wind, defaultWatts: 3,
    specs: [{ key: "tdp", label: "Power", fmt: (v) => v ? `${v}W` : "—" }] },
];
