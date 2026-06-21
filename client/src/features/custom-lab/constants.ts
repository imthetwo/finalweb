import {
  Box, CircuitBoard, Cpu, Database, HardDrive, Monitor, Thermometer, Wind, Zap,
} from "lucide-react";
import type { ApiPart, SlotCfg } from "./types";

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

export const MOCK_PARTS: Record<string, ApiPart[]> = {
  CPU: [
    { id: "m-cpu-1", name: "Intel Core Ultra 9 285K",  brand: "Intel", displayPrice: 15490000, thumbnailUrl: null, tdp: 125, socket: "LGA1851" },
    { id: "m-cpu-2", name: "Intel Core Ultra 7 265K",  brand: "Intel", displayPrice: 10990000, thumbnailUrl: null, tdp: 125, socket: "LGA1851" },
    { id: "m-cpu-3", name: "Intel Core Ultra 5 245K",  brand: "Intel", displayPrice: 8490000,  thumbnailUrl: null, tdp: 125, socket: "LGA1851" },
    { id: "m-cpu-4", name: "AMD Ryzen 9 9950X",        brand: "AMD",   displayPrice: 14990000, thumbnailUrl: null, tdp: 170, socket: "AM5" },
    { id: "m-cpu-5", name: "AMD Ryzen 7 9700X",        brand: "AMD",   displayPrice: 8990000,  thumbnailUrl: null, tdp: 65,  socket: "AM5" },
    { id: "m-cpu-6", name: "AMD Ryzen 5 9600X",        brand: "AMD",   displayPrice: 6490000,  thumbnailUrl: null, tdp: 65,  socket: "AM5" },
  ],
  CPU_COOLER: [
    { id: "m-cool-1", name: "NZXT Kraken RGB 360mm AIO",          brand: "NZXT",    displayPrice: 3990000, thumbnailUrl: null, tdp: 10, formFactor: "AIO 360mm" },
    { id: "m-cool-2", name: "Corsair H150i Elite Capellix 360mm", brand: "Corsair", displayPrice: 4490000, thumbnailUrl: null, tdp: 8,  formFactor: "AIO 360mm" },
    { id: "m-cool-3", name: "NZXT Kraken 240mm AIO",              brand: "NZXT",    displayPrice: 2990000, thumbnailUrl: null, tdp: 8,  formFactor: "AIO 240mm" },
  ],
  MOTHERBOARD: [
    { id: "m-mb-1", name: "ASUS ROG MAXIMUS Z890 APEX",      brand: "ASUS",    displayPrice: 22990000, thumbnailUrl: null, socket: "LGA1851", ramGen: "DDR5", formFactor: "ATX" },
    { id: "m-mb-2", name: "MSI MAG Z890 TOMAHAWK WIFI DDR5", brand: "MSI",     displayPrice: 7990000,  thumbnailUrl: null, socket: "LGA1851", ramGen: "DDR5", formFactor: "ATX" },
    { id: "m-mb-3", name: "ASUS ROG CROSSHAIR X870E HERO",   brand: "ASUS",    displayPrice: 16990000, thumbnailUrl: null, socket: "AM5",     ramGen: "DDR5", formFactor: "ATX" },
    { id: "m-mb-4", name: "Gigabyte B650E AORUS Master",      brand: "Gigabyte",displayPrice: 8490000,  thumbnailUrl: null, socket: "AM5",     ramGen: "DDR5", formFactor: "ATX" },
  ],
  MEMORY: [
    { id: "m-ram-1", name: "Corsair Vengeance DDR5 32GB 6000MHz",       brand: "Corsair",  displayPrice: 3490000, thumbnailUrl: null, ramGen: "DDR5", tdp: 10 },
    { id: "m-ram-2", name: "Corsair Dominator Titanium DDR5 64GB 6400", brand: "Corsair",  displayPrice: 8990000, thumbnailUrl: null, ramGen: "DDR5", tdp: 15 },
    { id: "m-ram-3", name: "G.Skill Trident Z5 RGB DDR5 32GB 7200",     brand: "G.Skill",  displayPrice: 4990000, thumbnailUrl: null, ramGen: "DDR5", tdp: 12 },
    { id: "m-ram-4", name: "Kingston Fury Beast DDR4 32GB 3200",         brand: "Kingston", displayPrice: 1990000, thumbnailUrl: null, ramGen: "DDR4", tdp: 8  },
  ],
  STORAGE: [
    { id: "m-ssd-1", name: "Samsung 990 Pro NVMe M.2 2TB",  brand: "Samsung", displayPrice: 3290000, thumbnailUrl: null, tdp: 5, formFactor: "M.2 NVMe" },
    { id: "m-ssd-2", name: "Samsung 9100 Pro NVMe M.2 2TB", brand: "Samsung", displayPrice: 4990000, thumbnailUrl: null, tdp: 6, formFactor: "M.2 NVMe" },
    { id: "m-ssd-3", name: "WD Black SN850X 2TB",           brand: "WD",      displayPrice: 2990000, thumbnailUrl: null, tdp: 5, formFactor: "M.2 NVMe" },
    { id: "m-ssd-4", name: "Samsung 870 EVO SATA SSD 2TB",  brand: "Samsung", displayPrice: 2190000, thumbnailUrl: null, tdp: 3, formFactor: "2.5\" SATA" },
  ],
  GPU: [
    { id: "m-gpu-1", name: "NVIDIA GeForce RTX 4090 FE",        brand: "NVIDIA",   displayPrice: 38990000, thumbnailUrl: null, tdp: 450 },
    { id: "m-gpu-2", name: "ASUS TUF RTX 4080 SUPER OC",        brand: "ASUS",     displayPrice: 24990000, thumbnailUrl: null, tdp: 320 },
    { id: "m-gpu-3", name: "MSI GeForce RTX 4070 Ti SUPRIM OC", brand: "MSI",      displayPrice: 19490000, thumbnailUrl: null, tdp: 285 },
    { id: "m-gpu-4", name: "AMD Radeon RX 7900 XTX",             brand: "AMD",      displayPrice: 19990000, thumbnailUrl: null, tdp: 355 },
    { id: "m-gpu-5", name: "Gigabyte RX 7900 XT Gaming OC",      brand: "Gigabyte", displayPrice: 15990000, thumbnailUrl: null, tdp: 315 },
  ],
  CASE: [
    { id: "m-case-1", name: "Corsair iCUE 5000X RGB Mid-Tower", brand: "Corsair", displayPrice: 3490000, thumbnailUrl: null, formFactor: "ATX" },
    { id: "m-case-2", name: "Corsair 4000D Airflow Mid-Tower",   brand: "Corsair", displayPrice: 2190000, thumbnailUrl: null, formFactor: "ATX" },
    { id: "m-case-3", name: "NZXT H9 Flow Mid-Tower",            brand: "NZXT",    displayPrice: 3990000, thumbnailUrl: null, formFactor: "ATX" },
    { id: "m-case-4", name: "Lian Li PC-O11 Dynamic EVO XL",     brand: "Lian Li", displayPrice: 4490000, thumbnailUrl: null, formFactor: "E-ATX" },
  ],
  POWER_SUPPLY: [
    { id: "m-psu-1", name: "Corsair RM1000x Gold 1000W",  brand: "Corsair", displayPrice: 4990000, thumbnailUrl: null, wattage: 1000 },
    { id: "m-psu-2", name: "Corsair RM850x Gold 850W",    brand: "Corsair", displayPrice: 3490000, thumbnailUrl: null, wattage: 850  },
    { id: "m-psu-3", name: "EVGA SuperNOVA G6 850W Gold", brand: "EVGA",    displayPrice: 3290000, thumbnailUrl: null, wattage: 850  },
    { id: "m-psu-4", name: "Corsair HX1500i Platinum",    brand: "Corsair", displayPrice: 9990000, thumbnailUrl: null, wattage: 1500 },
  ],
  CASE_FAN: [
    { id: "m-fan-1", name: "Corsair LL120 RGB Triple Pack", brand: "Corsair", displayPrice: 1490000, thumbnailUrl: null, tdp: 3 },
    { id: "m-fan-2", name: "Corsair F120X Performance Fan", brand: "Corsair", displayPrice: 590000,  thumbnailUrl: null, tdp: 2 },
    { id: "m-fan-3", name: "Corsair F360X Fans",            brand: "Corsair", displayPrice: 990000,  thumbnailUrl: null, tdp: 4 },
  ],
};
