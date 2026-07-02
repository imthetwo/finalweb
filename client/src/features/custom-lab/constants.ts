import {
  Box, CircuitBoard, Cpu, Database, HardDrive, Headphones,
  Keyboard, Monitor, Mouse, Server, Thermometer, Tv, Wind, Zap,
} from "lucide-react";
import type { SlotCfg } from "./types";

export const BUILD_SLOTS: SlotCfg[] = [
  {
    slot: "MOTHERBOARD", label: "Motherboard", shortLabel: "Motherboard", Icon: CircuitBoard, defaultWatts: 30,
    specs: [{ key: "socket", label: "Socket" }, { key: "ramGen", label: "RAM" }, { key: "formFactor", label: "Form Factor" }],
  },
  {
    slot: "CPU", label: "CPU (Processor)", shortLabel: "CPU", Icon: Cpu, defaultWatts: 65,
    specs: [{ key: "socket", label: "Socket" }, { key: "tdp", label: "TDP", fmt: (v) => v ? `${v}W` : "—" }],
  },
  {
    slot: "MEMORY", label: "Memory (RAM)", shortLabel: "RAM", Icon: Database, defaultWatts: 10,
    specs: [{ key: "ramGen", label: "Type" }, { key: "tdp", label: "Draw", fmt: (v) => v ? `${v}W` : "—" }],
  },
  {
    slot: "SSD_STORAGE", label: "SSD Storage", shortLabel: "SSD", Icon: HardDrive, defaultWatts: 5,
    specs: [{ key: "formFactor", label: "Interface" }],
  },
  {
    slot: "HDD_STORAGE", label: "HDD Storage", shortLabel: "HDD", Icon: Server, defaultWatts: 8,
    specs: [{ key: "formFactor", label: "Interface" }],
  },
  {
    slot: "POWER_SUPPLY", label: "Power Supply (PSU)", shortLabel: "PSU", Icon: Zap, defaultWatts: 0,
    specs: [{ key: "wattage", label: "Wattage", fmt: (v) => v ? `${v}W` : "—" }],
  },
  {
    slot: "GPU", label: "Video Card (GPU)", shortLabel: "GPU", Icon: Tv, defaultWatts: 150,
    specs: [{ key: "tdp", label: "TDP", fmt: (v) => v ? `${v}W` : "—" }],
  },
  {
    slot: "CASE", label: "Case (Chassis)", shortLabel: "Case", Icon: Box, defaultWatts: 0,
    specs: [{ key: "formFactor", label: "Form Factor" }],
  },
  {
    slot: "MONITOR", label: "Computer Monitor", shortLabel: "Monitor", Icon: Monitor, defaultWatts: 30,
    specs: [],
  },
  {
    slot: "CPU_COOLER", label: "CPU Cooler", shortLabel: "CPU Cooler", Icon: Thermometer, defaultWatts: 5,
    specs: [{ key: "formFactor", label: "Type" }, { key: "tdp", label: "Power", fmt: (v) => v ? `${v}W` : "—" }],
  },
  {
    slot: "KEYBOARD", label: "Computer Keyboard", shortLabel: "Keyboard", Icon: Keyboard, defaultWatts: 0,
    specs: [],
  },
  {
    slot: "MOUSE", label: "Computer Mouse", shortLabel: "Mouse", Icon: Mouse, defaultWatts: 0,
    specs: [],
  },
  {
    slot: "HEADSET", label: "Headphones / Headset", shortLabel: "Headset", Icon: Headphones, defaultWatts: 0,
    specs: [],
  },
  {
    slot: "CASE_FAN", label: "Case Fan", shortLabel: "Case Fan", Icon: Wind, defaultWatts: 3,
    specs: [],
  },
];
