/**
 * Sync Cloudinary images with products.json + DB:
 * 1. Rename messy public_ids → clean TechStore/ paths
 * 2. Delete duplicate/extra images
 * 3. Upsert new products + update imageUrls in DB
 * Run: npx ts-node scripts/sync-cloudinary.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import { prisma } from './prisma-client';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME ?? 'dxbvnueoq',
  api_key: process.env.CLOUDINARY_API_KEY ?? '831889526896772',
  api_secret: process.env.CLOUDINARY_API_SECRET ?? 'bdUn39bTHpztcJ9IkBb6LoIzvYQ',
});

const BASE = 'https://res.cloudinary.com/dxbvnueoq/image/upload/f_auto,q_auto,w_600/';
const url = (publicId: string) => BASE + publicId;

// ── RENAMES: { from, to } ───────────────────────────────────────────────────
const RENAMES: { from: string; to: string }[] = [
  // CPU
  { from: 'cpu-intel-core-ultra-5-245k-up-to-5-2ghz-14-cores-14-threads-24mb-01_kcwyxv', to: 'TechStore/cpu/intel-core-ultra-5-245k' },
  { from: '77009_cpu_intel_core_i5_14600k_1_wbtsdh', to: 'TechStore/cpu/intel-core-i5-14600k' },
  { from: '3337-ryzen-7-7800x3d-new_jfa1ks', to: 'TechStore/cpu/amd-ryzen-7-7800x3d' },
  { from: '250_11534_cpu_amd_ryzen_7_7700_pcm_1_lrsht0', to: 'TechStore/cpu/amd-ryzen-7-7700' },
  { from: '250_13385_cpu_amd_ryzen_7_5700x_tray_wuzkom', to: 'TechStore/cpu/amd-ryzen-7-5700x' },
  { from: '250-5408-ryzen-5-5600-new_mtare4', to: 'TechStore/cpu/amd-ryzen-5-5600' },
  { from: '250-4945-5600gt-1_fgs3i3', to: 'TechStore/cpu/amd-ryzen-5-5600gt' },
  { from: 'ryzen_9_-_1_5157911128a742f3bde4732cf4abdfb2_806c446fab4b42b6b6c71b298e08f563_master_rzgpiv', to: 'TechStore/cpu/amd-ryzen-9-7950x' },
  // GPU
  { from: 'geforce_rtx__3060_gaming_oc_8g-09_b3494a38843643d7a09538f63bd8a653_grande_xvxd7y', to: 'TechStore/gpu/gigabyte-rtx3060-gaming-oc-8g' },
  { from: 'geforce_rtx__3060_windforce_oc_12g-07_6869382166b043c5be19ae59ce49e61a_grande_goex8k', to: 'TechStore/gpu/gigabyte-rtx3060-windforce-oc-12g' },
  { from: '62224_card_man_hinh_inno3d_rtx_3080_ichill_x4_lhr_dbkhfa', to: 'TechStore/gpu/inno3d-rtx3080-ichill-x4' },
  { from: '12092_card_man_hinh_asrock_rx_7900_xtx_taichi_white_24gb_oc__j42hmp', to: 'TechStore/gpu/asrock-rx7900xtx-taichi-white' },
  { from: '250_12097_radeon_rx_9070_xt_steel_legend_dark_16gb__vhbqai', to: 'TechStore/gpu/asrock-rx9070xt-steel-legend-dark' },
  { from: '250_13115_radeon_rx_9070_xt_challenger_16gb_l1__fhqmz5', to: 'TechStore/gpu/asrock-rx9070xt-challenger' },
  // Motherboard
  { from: 'mainboard-pc-msi-mag-z890-tomahawk-wifi-01_tyzs2x', to: 'TechStore/motherboard/msi-mag-z890-tomahawk-wifi' },
  { from: 'B650M_PG_Riptide_L1_szcnmh', to: 'TechStore/motherboard/asrock-b650m-pg-riptide' },
  { from: 'A620M-E-KV_mbxpey', to: 'TechStore/motherboard/msi-pro-a620m-e' },
  { from: 'msi-pro-b760m-a-wifi-ddr4-kv_ao7xox', to: 'TechStore/motherboard/msi-pro-b760m-a-wifi-ddr4' },
  { from: 'msi-b760m-gaming-plus-wifi-ddr4-kv_qc1bhu', to: 'TechStore/motherboard/msi-b760m-gaming-plus-ddr4' },
  // Storage
  { from: 'vn-9100-pro-nvme-m2-ssd-539197-mz-vap8t0bw-thumb-548346257_j1w6ke', to: 'TechStore/storage/samsung-9100-pro-2tb' },
  { from: 'vn-9100-pro-nvme-m2-ssd-539201-539201-mz-vap8t0cw-thumb-548347018_ipeuye', to: 'TechStore/storage/samsung-9100-pro-4tb' },
  { from: 'vn-990-evo-nvme-m2-ssd-mz-v9e2t0bw-thumb-539549005_pgw0bv', to: 'TechStore/storage/samsung-990-evo' },
  { from: 'vn-980-pro-nvme-m2-ssd-mz-v8p2t0bw-thumb-539169523_roos1o', to: 'TechStore/storage/samsung-980-pro' },
  { from: 'vn-990pro-nvme-m2-ssd-mz-v9p4t0bw-thumb-539179719_hebe0v', to: 'TechStore/storage/samsung-990-pro' },
  { from: 'vn-970-evoplus-nvme-m2-ssd-mz-v7s2t0bw-thumb-539193942_ird3k6', to: 'TechStore/storage/samsung-970-evo-plus' },
  { from: 'vn-pm9a3-mz-ql27t600-thumb-539194600_hpsa1y', to: 'TechStore/storage/samsung-t9-portable' },
  // Memory
  { from: 'FURY_Beast_RGB_Black_DDR4_1_angle-zm-lg_ym41qa', to: 'TechStore/memory/kingston-fury-beast-rgb-ddr4' },
  { from: 'FURY_Beast_Black_DDR4_1-zm-lg_jvj0md', to: 'TechStore/memory/kingston-fury-beast-black-ddr4' },
  { from: 'DOMINATOR_RGB_PLATINUM_BLACK_DDR5_01_t4hytx', to: 'TechStore/memory/corsair-dominator-rgb-ddr5' },
  { from: 'g.skill-ripjaws-v-32gb-2x16gb-ddr4-3200mhz-ram_avvjgs', to: 'TechStore/memory/gskill-ripjaws-v-ddr4' },
  { from: 'crucial-ddr5-UDIMM-iso-3_leqy40', to: 'TechStore/memory/crucial-pro-ddr5' },
  // PSU
  { from: 'nguon-may-tinh-corsair-rm750x-shift-750w-80-plus-gold-cp-9020251-na-05_zrimyy', to: 'TechStore/power-supply/corsair-rm750x-shift' },
  // Laptops
  { from: 'Predator-helios-neo-16-phn16-71-4-zone-backlit-on-wallpaper-black-01_pd6ob0', to: 'TechStore/laptops/acer-predator-helios-neo-16' },
  { from: 'predator-helios-3d-15-spatiallabs-edition-ph3d15-71-non-fingerprint-with-perkey-backlit-on-wallpaper-black-01_ikpzjt', to: 'TechStore/laptops/acer-predator-helios-3d-15' },
  { from: 'predator-triton-14-ai-pt14-52t-non-fingerprint-with-backlit-on-wp-oled-charcoal-black-01_u399m4', to: 'TechStore/laptops/acer-predator-triton-14-ai' },
  { from: 'nitro-17-an17-72-4zone-backlit-on-wallpaper-black-01-1_lilspy', to: 'TechStore/laptops/acer-nitro-17' },
  { from: 'predator-helios-neo-18-phn18-71-4zone-backlit-on-wallpaper-black-01-1_gskln7', to: 'TechStore/laptops/acer-predator-helios-neo-18' },
  { from: 'predator-triton-16-pt16-51-fingerprint-perkey-backlit-on-wallpaper-oled-sparkly-silver-01-1_ccl356', to: 'TechStore/laptops/acer-predator-triton-16' },
  { from: 'predator-helios-14-ai-ph14-71-non-fingerprint-with-backlit-on-wp-oled-abyssal-black-01_irlut3', to: 'TechStore/laptops/acer-predator-helios-14-ai' },
  { from: 'predator-triton-17x-ptx17-71-with-fingerprint-perkey-backlit-wallpaper-black-01-1_ftndcx', to: 'TechStore/laptops/acer-predator-triton-17x' },
  { from: 'Predator_Helios_Neo_16_MacanS_RTX_01_mgzfje', to: 'TechStore/laptops/acer-predator-helios-neo-16-macan' },
  { from: 'predator-triton-14-pt14-51-fingerprint-3-zone-backlit-on-wallpaper-silver-01-1_rt1ipl', to: 'TechStore/laptops/acer-predator-triton-14' },
  { from: 'nitro-17-an17-42-4zone-backlit-on-wallpaper-black-01-1_hchusc', to: 'TechStore/laptops/acer-nitro-17-an17-42' },
  { from: 'tuf_plastic_15_02_1_ie4sro', to: 'TechStore/laptops/asus-tuf-gaming-f15' },
];

// ── DELETES ─────────────────────────────────────────────────────────────────
const DELETES: string[] = [
  // CPU extras
  'cpu-intel-core-ultra-5-245k-up-to-5-2ghz-14-cores-14-threads-24mb-02_meat5k',
  '250_11489_cpu_amd_ryzen_7_9700x_pcm_wgaauh',
  '3337-7800x3d-tray_nz0j9m', '3337-4_qrzrkb', '3337-c360_2017-10-12-13-21-11-873_aifgf1', '75-3337-7800x3d-tray_cwh7ly',
  'ryzen_9_-_2_9b1a6dfd05d74c1cb19ef924bb4f913e_860f1f127f5f4cdea7ba26660494832c_master_erlbwb',
  'ryzen_9_-_5_afacf90d4dc74c62b02329bce5df9bcf_feadfb0d9afa4a3194962ec89d02a721_master_btws21',
  // GPU extras (duplicates of TechStore versions)
  '250_12095_radeon_rx_9070_xt_taichi_16gb_oc__1_htiji2',
  '250_12096_radeon_rx_9070_xt_steel_legend_16gb_1_xeugzz',
  '250_12093_sapphire_pure_amd_radeon_rx_9070_xt_qhgz9n',
  '250_12100_rx9070xt_nitro_full_box_card_pesmkc',
  '250_12102_rx9070xt_pulse_full_box_card_miv7ns',
  '250_12155_vga_asus_prime_radeon_rx_9070_xt_pcm_1_g3utih',
  '13105_card_m__n_h__nh_gigabyte_radeon_rx_7900_xt_gaming_oc_20g__1__xk1k0s',
  'geforce-rtx-4060-ti-hero-100vp-l_f8pvya', 'geforce-rtx-4060-ti-hero-350-p_2x_fcdnf1',
  '9_c2e29a09303d4ebba0c1b9c94287f403_b3b582f8120643b09cf10c4bd00c9ab7_grande_mbkmpx',
  '1024_8cf8d2e8bf3b46eb9a15cb1d790b0130_grande_b2nchn',
  // Motherboard extras
  'B650M_PG_Riptide_L2_prdvwl', 'B650M_PG_Riptide_L3_vxvdno',
  'mainboard-pc-msi-mag-z890-tomahawk-wifi-05_bd1ax0',
  'b760m-gaming-plus-wifi-ddr4-hero01_eefkdh', 'b760m-gaming-plus-wifi-ddr4-hero02-new_hxedr6', 'b760m-gaming-plus-wifi-ddr4-hero02-new_kdxwts',
  'msi-pro-b760m-a-wifi-ddr4-cooling-overview-mobile_ssggpt', 'msi-pro-b760m-a-wifi-ddr4-feature-overview_ilxcap',
  'pro-a620m-e-block_uc39zk',
  'pd_dbml3w', 'performance_l6ougr', 'performance-m_vpn8km', 'connectivity_zmjk83', 'immersion-m_hrejtm',
  // Storage extras
  'vn-990-evo-nvme-m2-ssd-mz-v9e2t0bw-thumb-539549007_w77tqi',
  'vn-990-evo-nvme-m2-ssd-mz-v9e2t0bw-thumb-539549008_acjvxc',
  'vn-990-evo-nvme-m2-ssd-mz-v9e2t0bw-thumb-539549006_yns9d4',
  'vn-980-pro-nvme-m2-ssd-mz-v8p2t0bw-thumb-539169513_ve1ofw',
  'vn-980-pro-with-heatsink-nvme-m2-ssd-mz-v8p2t0cw-thumb-539179928_k8lcoe',
  'vn-980-pro-with-heatsink-nvme-m2-ssd-mz-v8p2t0cw-thumb-539179929_ktdu47',
  'vn-980-pro-with-heatsink-nvme-m2-ssd-mz-v8p2t0cw-thumb-539179930_itkn8x',
  'vn-980-pro-with-heatsink-nvme-m2-ssd-mz-v8p2t0cw-thumb-539179931_giw9nj',
  'vn-980-pro-with-heatsink-nvme-m2-ssd-mz-v8p2t0cw-thumb-539179934_vzeei8',
  'vn-980-pro-with-heatsink-nvme-m2-ssd-mz-v8p2t0cw-thumb-539179922_pcthxb',
  'vn-990pro-nvme-m2-ssd-mz-v9p4t0bw-thumb-539179717_fl1tho',
  'vn-990pro-nvme-m2-ssd-mz-v9p4t0bw-thumb-539179718_r2opp2',
  'vn-990pro-nvme-m2-ssd-mz-v9p4t0bw-thumb-539179726_eqq7ki',
  'vn-990-pro-with-heatsink-nvme-m2-ssd-mz-v9p4t0cw-thumb-539186121_oh0sow',
  'vn-990-pro-with-heatsink-nvme-m2-ssd-mz-v9p4t0cw-thumb-539186122_bxnhwp',
  'vn-990-pro-with-heatsink-nvme-m2-ssd-mz-v9p4t0cw-thumb-539186123_r72gcs',
  'vn-990-pro-with-heatsink-nvme-m2-ssd-mz-v9p4t0cw-thumb-539186124_zsrjch',
  'vn-990-pro-with-heatsink-nvme-m2-ssd-mz-v9p4t0cw-thumb-539186127_ykwisi',
  'vn-990-pro-with-heatsink-nvme-m2-ssd-mz-v9p4t0cw-thumb-539186111_saossw',
  'vn-9100-pro-nvme-m2-ssd-539197-mz-vap8t0bw-thumb-548346258_dsq4n6',
  'vn-9100-pro-nvme-m2-ssd-539197-mz-vap8t0bw-thumb-548346259_nc2cwy',
  'vn-9100-pro-nvme-m2-ssd-539197-mz-vap8t0bw-thumb-548346260_m3bbai',
  'vn-9100-pro-nvme-m2-ssd-539197-mz-vap8t0bw-thumb-548346261_b01qbt',
  'vn-9100-pro-nvme-m2-ssd-539197-mz-vap8t0bw-thumb-548346266_rvuaw0',
  'vn-9100-pro-nvme-m2-ssd-539201-539201-mz-vap8t0cw-thumb-548347019_jdcgq1',
  'vn-9100-pro-nvme-m2-ssd-539201-539201-mz-vap8t0cw-thumb-548347025_ogdqtc',
  'vn-9100-pro-nvme-m2-ssd-539201-539201-mz-vap8t0cw-thumb-548347026_kuibmi',
  'vn-9100-pro-nvme-m2-ssd-539201-539201-mz-vap8t0cw-thumb-548347027_mu3od3',
  'vn-9100-pro-nvme-m2-ssd-539201-539201-mz-vap8t0cw-thumb-548347030_meesv5',
  'vn-970-evoplus-nvme-m2-ssd-mz-v7s2t0bw-thumb-539193943_wdjqz9',
  'vn-970-evoplus-nvme-m2-ssd-mz-v7s2t0bw-thumb-539193944_ieupt7',
  'vn-970-evoplus-nvme-m2-ssd-mz-v7s2t0bw-thumb-539193945_ivccp9',
  'vn-970-evoplus-nvme-m2-ssd-mz-v7s2t0bw-thumb-539193946_b6xzo3',
  'vn-970-evoplus-nvme-m2-ssd-mz-v7s2t0bw-thumb-539193959_zh0feh',
  'vn-pm9a3-mz-ql27t600-thumb-539194601_tdey3h',
  'vn-pm9a3-mz-ql27t600-thumb-539194602_r9wdhe',
  'vn-pm9a3-mz-ql27t600-thumb-539194603_kfqobp',
  'vn-pm893-mz-7l37t600-thumb-539193761_ebejcz',
  'vn-pm893-mz-7l37t600-thumb-539193762_kaoyo6',
  'vn-pm893-mz-7l37t600-thumb-539193763_nsifxf',
  'vn-pm893-mz-7l37t600-thumb-539193764_yiy6xt',
  'vn-pm893-mz-7l37t600-thumb-539193767_jdccic',
  // PSU extra
  'nguon-may-tinh-corsair-rm750x-shift-750w-80-plus-gold-cp-9020251-na-05_1_v1ak4x',
  // Laptop extras
  'predator-helios-neo-18-phn18-71-4zone-backlit-on-wallpaper-black-01-1_1_khpfpd',
  'Predator-helios-neo-16-phn16-71-4-zone-backlit-on-wallpaper-black-01_1_ky34ka',
  'Predator-helios-neo-16-phn16-71-4-zone-backlit-on-wallpaper-black-01_2_feqyst',
  'Predator-helios-neo-16-phn16-71-4-zone-backlit-on-wallpaper-black-01_3_dlxkzj',
  'Predator-helios-neo-16-phn16-71-4-zone-backlit-on-wallpaper-black-01_4_ahzm9p',
  'predator-helios-3d-15-spatiallabs-edition-ph3d15-71-non-fingerprint-with-perkey-backlit-on-wallpaper-black-01_1_ww3wtn',
  'predator-triton-14-ai-pt14-52t-non-fingerprint-with-backlit-on-wp-oled-charcoal-black-01_1_ysafqq',
  'predator-triton-17x-ptx17-71-with-fingerprint-perkey-backlit-wallpaper-black-01-1_1_vg5eq0',
  'predator-triton-16-pt16-51-fingerprint-perkey-backlit-on-wallpaper-oled-sparkly-silver-01-1_1_nhuk2h',
  'predator-triton-14-pt14-51-fingerprint-3-zone-backlit-on-wallpaper-silver-01-1_1_itrxuv',
  'predator-helios-14-ai-ph14-71-non-fingerprint-with-backlit-on-wp-oled-abyssal-black-01_1_jysl4p',
  'Predator_Helios_Neo_16_MacanS_RTX_01_1_ffgxxe',
  'tuf_plastic_15_08_1_i68dt8',
  // Test/placeholder
  'main-sample',
];

// ── IMAGE URL UPDATES for existing products ────────────────────────────────
// map: product name → new imageUrl (after rename)
const IMAGE_UPDATES: Record<string, string> = {
  'Intel Core Ultra 5 245K': url('TechStore/cpu/intel-core-ultra-5-245k'),
  'Intel Core i5-14600K': url('TechStore/cpu/intel-core-i5-14600k'),
  'MSI MAG Z890 TOMAHAWK WIFI': url('TechStore/motherboard/msi-mag-z890-tomahawk-wifi'),
  'ASRock B650M PG Riptide': url('TechStore/motherboard/asrock-b650m-pg-riptide'),
  'MSI PRO A620M-E': url('TechStore/motherboard/msi-pro-a620m-e'),
  'MSI PRO B760M-A WIFI DDR4': url('TechStore/motherboard/msi-pro-b760m-a-wifi-ddr4'),
  'MSI B760M Gaming Plus WIFI DDR4': url('TechStore/motherboard/msi-b760m-gaming-plus-ddr4'),
  'Samsung 9100 PRO NVMe M.2 SSD 2TB': url('TechStore/storage/samsung-9100-pro-2tb'),
  'Samsung 990 EVO Plus NVMe M.2 SSD 2TB': url('TechStore/storage/samsung-990-evo'),
  'Samsung 980 PRO NVMe M.2 SSD 2TB': url('TechStore/storage/samsung-980-pro'),
  'Samsung 990 PRO NVMe M.2 SSD 2TB': url('TechStore/storage/samsung-990-pro'),
  'Samsung T9 Portable SSD 4TB': url('TechStore/storage/samsung-t9-portable'),
  'Kingston Fury Beast DDR5 16GB 5200MHz': url('TechStore/memory/kingston-fury-beast-rgb-ddr4'),
  'Kingston Fury Beast DDR4 16GB 3600MHz': url('TechStore/memory/kingston-fury-beast-black-ddr4'),
  'Corsair Vengeance RGB DDR5 32GB 6000MHz': url('TechStore/memory/corsair-dominator-rgb-ddr5'),
  'G.Skill Ripjaws V DDR4 32GB 3200MHz': url('TechStore/memory/gskill-ripjaws-v-ddr4'),
  'Crucial Pro DDR5 32GB 5600MHz': url('TechStore/memory/crucial-pro-ddr5'),
  'Acer Predator Helios Neo 16 RTX 4070 Ti': url('TechStore/laptops/acer-predator-helios-neo-16'),
  'Acer Predator Helios 3D 15 SpatialLabs RTX 4090': url('TechStore/laptops/acer-predator-helios-3d-15'),
  'Acer Predator Triton 14 AI RTX 4060 OLED': url('TechStore/laptops/acer-predator-triton-14-ai'),
  'Acer Nitro 17 RTX 4060 Gaming': url('TechStore/laptops/acer-nitro-17'),
  'Acer Predator Helios Neo 18 RTX 4080': url('TechStore/laptops/acer-predator-helios-neo-18'),
  'Acer Predator Triton 16 OLED RTX 4060': url('TechStore/laptops/acer-predator-triton-16'),
  'Acer Predator Helios 14 AI OLED RTX 4060': url('TechStore/laptops/acer-predator-helios-14-ai'),
  'Acer Predator Triton 17X RTX 4080': url('TechStore/laptops/acer-predator-triton-17x'),
};

// ── NEW PRODUCTS ───────────────────────────────────────────────────────────
type NewProduct = {
  category: string;
  name: string;
  brand: string;
  imageUrl: string;
  price: number;
  costPrice: number;
  salePrice: number | null;
  stock: number;
  description: string;
  spec: Record<string, unknown> | null;
};

const NEW_PRODUCTS: NewProduct[] = [
  // CPU
  {
    category: 'Processors (CPU)', name: 'AMD Ryzen 7 7800X3D', brand: 'AMD',
    imageUrl: url('TechStore/cpu/amd-ryzen-7-7800x3d'),
    price: 10990000, costPrice: 8500000, salePrice: null, stock: 14,
    description: 'AMD Ryzen 7 7800X3D, 8 nhân 16 luồng, boost 5.0GHz, 3D V-Cache 96MB, socket AM5, TDP 120W. CPU gaming tốt nhất trong tầm giá, hiệu năng game đỉnh với công nghệ 3D V-Cache độc quyền.',
    spec: { type: 'cpuSpec', socket: 'AM5', cores: 8, threads: 16, baseClockGhz: 4.5, boostClockGhz: 5.0, tdp: 120, cacheL3: '96MB', generation: 'Ryzen 7000' },
  },
  {
    category: 'Processors (CPU)', name: 'AMD Ryzen 7 7700', brand: 'AMD',
    imageUrl: url('TechStore/cpu/amd-ryzen-7-7700'),
    price: 6490000, costPrice: 4900000, salePrice: null, stock: 18,
    description: 'AMD Ryzen 7 7700, 8 nhân 16 luồng, boost 5.3GHz, cache L3 32MB, socket AM5, TDP 65W. Hiệu năng đa nhân mạnh mẽ trong chuẩn TDP 65W, phù hợp build gaming/content creation hiệu quả điện năng.',
    spec: { type: 'cpuSpec', socket: 'AM5', cores: 8, threads: 16, baseClockGhz: 3.8, boostClockGhz: 5.3, tdp: 65, cacheL3: '32MB', generation: 'Ryzen 7000' },
  },
  {
    category: 'Processors (CPU)', name: 'AMD Ryzen 7 5700X', brand: 'AMD',
    imageUrl: url('TechStore/cpu/amd-ryzen-7-5700x'),
    price: 3990000, costPrice: 3000000, salePrice: null, stock: 22,
    description: 'AMD Ryzen 7 5700X, 8 nhân 16 luồng, boost 4.6GHz, cache L3 32MB, socket AM4, TDP 65W. CPU AM4 hiệu năng cao giá rẻ, lựa chọn tiết kiệm cho gaming/streaming mà không cần nâng cấp nền tảng.',
    spec: { type: 'cpuSpec', socket: 'AM4', cores: 8, threads: 16, baseClockGhz: 3.4, boostClockGhz: 4.6, tdp: 65, cacheL3: '32MB', generation: 'Ryzen 5000' },
  },
  {
    category: 'Processors (CPU)', name: 'AMD Ryzen 5 5600', brand: 'AMD',
    imageUrl: url('TechStore/cpu/amd-ryzen-5-5600'),
    price: 2490000, costPrice: 1900000, salePrice: null, stock: 30,
    description: 'AMD Ryzen 5 5600, 6 nhân 12 luồng, boost 4.4GHz, cache L3 32MB, socket AM4, TDP 65W. CPU gaming tầm trung cực kỳ phổ biến trên AM4, giá tốt hiệu năng cao cho build gaming cơ bản.',
    spec: { type: 'cpuSpec', socket: 'AM4', cores: 6, threads: 12, baseClockGhz: 3.5, boostClockGhz: 4.4, tdp: 65, cacheL3: '32MB', generation: 'Ryzen 5000' },
  },
  {
    category: 'Processors (CPU)', name: 'AMD Ryzen 5 5600GT', brand: 'AMD',
    imageUrl: url('TechStore/cpu/amd-ryzen-5-5600gt'),
    price: 2890000, costPrice: 2200000, salePrice: null, stock: 20,
    description: 'AMD Ryzen 5 5600GT, 6 nhân 12 luồng, boost 4.6GHz, tích hợp Radeon 7 Graphics, socket AM4, TDP 65W. CPU AM4 có iGPU mạnh nhất dòng 5000G, chạy không cần GPU rời cho tác vụ văn phòng.',
    spec: { type: 'cpuSpec', socket: 'AM4', cores: 6, threads: 12, baseClockGhz: 3.6, boostClockGhz: 4.6, tdp: 65, cacheL3: '16MB', generation: 'Ryzen 5000G' },
  },
  {
    category: 'Processors (CPU)', name: 'AMD Ryzen 9 7950X', brand: 'AMD',
    imageUrl: url('TechStore/cpu/amd-ryzen-9-7950x'),
    price: 17990000, costPrice: 13800000, salePrice: 16490000, stock: 6,
    description: 'AMD Ryzen 9 7950X, 16 nhân 32 luồng, boost 5.7GHz, cache L3 64MB, socket AM5, TDP 170W. Flagship workstation CPU AM5, hiệu năng đa nhân đỉnh cho 3D rendering, video editing 8K và AI workloads.',
    spec: { type: 'cpuSpec', socket: 'AM5', cores: 16, threads: 32, baseClockGhz: 4.5, boostClockGhz: 5.7, tdp: 170, cacheL3: '64MB', generation: 'Ryzen 7000' },
  },
  // GPU
  {
    category: 'Graphics Cards (GPU)', name: 'Gigabyte GeForce RTX 3060 Gaming OC 8G', brand: 'Gigabyte',
    imageUrl: url('TechStore/gpu/gigabyte-rtx3060-gaming-oc-8g'),
    price: 7490000, costPrice: 5700000, salePrice: null, stock: 12,
    description: 'Gigabyte GeForce RTX 3060 Gaming OC 8G, WINDFORCE 3X cooling, clock OC 1837MHz, 8GB GDDR6 128-bit. Card gaming 1080p tầm trung giá tốt, hỗ trợ DLSS 2, Ray Tracing, phù hợp game AAA 1080p hiệu quả.',
    spec: { type: 'gpuSpec', vramGb: 8, memType: 'GDDR6', boostClockMhz: 1837, tdp: 170, pcieGen: 4 },
  },
  {
    category: 'Graphics Cards (GPU)', name: 'Gigabyte GeForce RTX 3060 Windforce OC 12G', brand: 'Gigabyte',
    imageUrl: url('TechStore/gpu/gigabyte-rtx3060-windforce-oc-12g'),
    price: 8490000, costPrice: 6500000, salePrice: null, stock: 10,
    description: 'Gigabyte GeForce RTX 3060 Windforce OC 12G, WINDFORCE 3X cooling, clock OC 1837MHz, 12GB GDDR6 192-bit. VRAM 12GB lớn cho AI/stable diffusion và 1440p gaming, hỗ trợ DLSS và Ray Tracing.',
    spec: { type: 'gpuSpec', vramGb: 12, memType: 'GDDR6', boostClockMhz: 1837, tdp: 170, pcieGen: 4 },
  },
  {
    category: 'Graphics Cards (GPU)', name: 'Inno3D GeForce RTX 3080 iChill X4 LHR', brand: 'Inno3D',
    imageUrl: url('TechStore/gpu/inno3d-rtx3080-ichill-x4'),
    price: 14990000, costPrice: 11500000, salePrice: 13490000, stock: 5,
    description: 'Inno3D GeForce RTX 3080 iChill X4 LHR, 10GB GDDR6X 320-bit, 4 fan iChill cooling, clock OC 1755MHz. Card gaming 4K hiệu năng cao, DLSS 2 + Ray Tracing, phù hợp gaming cạnh tranh 1440p/4K.',
    spec: { type: 'gpuSpec', vramGb: 10, memType: 'GDDR6X', boostClockMhz: 1755, tdp: 350, pcieGen: 4 },
  },
  {
    category: 'Graphics Cards (GPU)', name: 'ASRock Radeon RX 7900 XTX Taichi White 24GB OC', brand: 'ASRock',
    imageUrl: url('TechStore/gpu/asrock-rx7900xtx-taichi-white'),
    price: 17990000, costPrice: 13800000, salePrice: null, stock: 4,
    description: 'ASRock Radeon RX 7900 XTX Taichi White 24GB OC, 24GB GDDR6 384-bit, thiết kế trắng Taichi premium, 3 fan, PCIe 4.0. Card AMD flagship 4K gaming, Displayport 2.1, FSR 3 + HYPR-RX, lý tưởng cho setup trắng.',
    spec: { type: 'gpuSpec', vramGb: 24, memType: 'GDDR6', boostClockMhz: 2565, tdp: 355, pcieGen: 4 },
  },
  {
    category: 'Graphics Cards (GPU)', name: 'ASRock Radeon RX 9070 XT Challenger 16GB', brand: 'ASRock',
    imageUrl: url('TechStore/gpu/asrock-rx9070xt-challenger'),
    price: 11490000, costPrice: 8800000, salePrice: null, stock: 8,
    description: 'ASRock Radeon RX 9070 XT Challenger 16GB GDDR6, PCIe 5.0, DisplayPort 2.1, HDMI 2.1. Card gaming 1440p/4K tầm trung cao cấp với RDNA 4, hỗ trợ FSR 4, hiệu năng vượt trội RTX 4070 Super.',
    spec: { type: 'gpuSpec', vramGb: 16, memType: 'GDDR6', boostClockMhz: 2970, tdp: 304, pcieGen: 5 },
  },
  {
    category: 'Graphics Cards (GPU)', name: 'ASRock Radeon RX 9070 XT Steel Legend Dark 16GB', brand: 'ASRock',
    imageUrl: url('TechStore/gpu/asrock-rx9070xt-steel-legend-dark'),
    price: 11990000, costPrice: 9200000, salePrice: null, stock: 7,
    description: 'ASRock Radeon RX 9070 XT Steel Legend Dark 16GB GDDR6, thiết kế dark premium, PCIe 5.0, DisplayPort 2.1. RDNA 4 gaming 1440p/4K, RGB synchronization, FSR 4, phù hợp setup dark theme.',
    spec: { type: 'gpuSpec', vramGb: 16, memType: 'GDDR6', boostClockMhz: 2970, tdp: 304, pcieGen: 5 },
  },
  // Storage
  {
    category: 'Storage (SSD/HDD)', name: 'Samsung 9100 PRO NVMe M.2 SSD 4TB', brand: 'Samsung',
    imageUrl: url('TechStore/storage/samsung-9100-pro-4tb'),
    price: 8990000, costPrice: 6900000, salePrice: null, stock: 8,
    description: 'Samsung 9100 PRO NVMe M.2 SSD 4TB, PCIe 5.0 x4, đọc 14,800 MB/s, ghi 13,400 MB/s, V-NAND TLC. SSD gen 5 flagship dung lượng lớn, hiệu năng đỉnh cho professional workstation và storage-intensive tasks.',
    spec: { type: 'storageSpec', capacityGb: 4096, storageType: 'NVMe SSD', interfaceType: 'PCIe 5.0 x4', readMbps: 14800, writeMbps: 13400 },
  },
  {
    category: 'Storage (SSD/HDD)', name: 'Samsung 970 Evo Plus NVMe M.2 SSD 2TB', brand: 'Samsung',
    imageUrl: url('TechStore/storage/samsung-970-evo-plus'),
    price: 2990000, costPrice: 2300000, salePrice: null, stock: 20,
    description: 'Samsung 970 Evo Plus NVMe M.2 SSD 2TB, PCIe 3.0 x4, đọc 3,500 MB/s, ghi 3,300 MB/s. SSD NVMe bền bỉ giá tốt, phù hợp làm ổ cài game hoặc ổ phụ trên hệ thống PCIe 4.0 trở lên.',
    spec: { type: 'storageSpec', capacityGb: 2048, storageType: 'NVMe SSD', interfaceType: 'PCIe 3.0 x4', readMbps: 3500, writeMbps: 3300 },
  },
  // PSU
  {
    category: 'Power Supplies', name: 'Corsair RM750x Shift 750W 80+ Gold', brand: 'Corsair',
    imageUrl: url('TechStore/power-supply/corsair-rm750x-shift'),
    price: 3290000, costPrice: 2500000, salePrice: null, stock: 18,
    description: 'Corsair RM750x Shift 750W 80+ Gold, thiết kế connector dọc cạnh (Shift), fully modular, quạt 135mm Zero RPM, ATX 3.0 + PCIe 5.0 native. Nguồn cao cấp dễ quản lý dây, phù hợp case thoáng gió compact.',
    spec: null,
  },
  // Laptops
  {
    category: 'Laptops', name: 'ASUS TUF Gaming F15 2024', brand: 'ASUS',
    imageUrl: url('TechStore/laptops/asus-tuf-gaming-f15'),
    price: 24990000, costPrice: 19500000, salePrice: null, stock: 10,
    description: 'ASUS TUF Gaming F15 2024, Intel Core i7-13700H, RTX 4060 8GB, RAM 16GB DDR5, SSD 512GB, màn hình 15.6" FHD 144Hz. Laptop gaming bền bỉ MIL-SPEC, tản nhiệt hiệu quả, phù hợp game AAA di động.',
    spec: null,
  },
  {
    category: 'Laptops', name: 'Acer Predator Helios Neo 16 MacanS RTX 4070', brand: 'Acer',
    imageUrl: url('TechStore/laptops/acer-predator-helios-neo-16-macan'),
    price: 42990000, costPrice: 33500000, salePrice: null, stock: 5,
    description: 'Acer Predator Helios Neo 16 (PHN16-72), Intel Core Ultra 9 275HX, RTX 4070 8GB 140W, RAM 32GB DDR5, SSD 1TB PCIe 4.0, màn 16" WQXGA IPS 165Hz. Laptop gaming flagship hiệu năng cao.',
    spec: null,
  },
  {
    category: 'Laptops', name: 'Acer Predator Triton 14 OLED RTX 4060', brand: 'Acer',
    imageUrl: url('TechStore/laptops/acer-predator-triton-14'),
    price: 38990000, costPrice: 30500000, salePrice: null, stock: 4,
    description: 'Acer Predator Triton 14 (PT14-51), Intel Core i7-13700H, RTX 4060 8GB, RAM 16GB DDR5, SSD 512GB, màn 14" WQXGA OLED 2880x1800 120Hz. Laptop gaming cao cấp mỏng nhẹ với màn OLED sắc nét.',
    spec: null,
  },
  {
    category: 'Laptops', name: 'Acer Nitro 17 RTX 4060 AN17-42', brand: 'Acer',
    imageUrl: url('TechStore/laptops/acer-nitro-17-an17-42'),
    price: 27990000, costPrice: 21800000, salePrice: null, stock: 8,
    description: 'Acer Nitro 17 (AN17-42), AMD Ryzen 7 8745H, RTX 4060 8GB, RAM 16GB DDR5, SSD 512GB, màn 17.3" FHD IPS 165Hz. Laptop gaming AMD 17 inch tầm trung, màn lớn hiệu năng tốt giá hợp lý.',
    spec: null,
  },
];

// ── MAIN ────────────────────────────────────────────────────────────────────
async function main() {
  // 1. Cloudinary renames
  console.log('\n🔄 Renaming images...');
  for (const { from, to } of RENAMES) {
    try {
      await cloudinary.uploader.rename(from, to, { overwrite: true });
      console.log(`  ✅ ${from.split('/').pop()} → ${to}`);
    } catch (e: any) {
      console.warn(`  ⚠️  rename failed [${from}]: ${e?.message ?? e}`);
    }
  }

  // 2. Cloudinary deletes
  console.log('\n🗑️  Deleting duplicates...');
  for (const publicId of DELETES) {
    try {
      await cloudinary.uploader.destroy(publicId);
      console.log(`  🗑️  deleted: ${publicId.split('/').pop()}`);
    } catch (e: any) {
      console.warn(`  ⚠️  delete failed [${publicId}]: ${e?.message ?? e}`);
    }
  }

  // 3. Update existing products in DB
  console.log('\n✏️  Updating existing product images in DB...');
  for (const [name, imageUrl] of Object.entries(IMAGE_UPDATES)) {
    const p = await prisma.product.findFirst({ where: { name } });
    if (p) {
      await prisma.product.update({ where: { id: p.id }, data: { imageUrl } });
      console.log(`  ✅ updated: ${name}`);
    } else {
      console.warn(`  ⚠️  not found in DB: ${name}`);
    }
  }

  // 4. Create new products
  console.log('\n🆕 Creating new products...');
  for (const p of NEW_PRODUCTS) {
    const exists = await prisma.product.findFirst({ where: { name: p.name } });
    if (exists) {
      console.log(`  ⏭️  already exists: ${p.name}`);
      continue;
    }
    const category = await prisma.category.findFirst({ where: { name: p.category } });
    if (!category) {
      console.warn(`  ⚠️  missing category: ${p.category}`);
      continue;
    }
    const specRelation: Record<string, unknown> = {};
    if (p.spec) {
      const { type, ...fields } = p.spec;
      specRelation[type as string] = { create: fields };
    }
    await prisma.product.create({
      data: {
        categoryId: category.id,
        name: p.name,
        brand: p.brand,
        imageUrl: p.imageUrl,
        price: p.price,
        costPrice: p.costPrice,
        salePrice: p.salePrice,
        stock: p.stock,
        isPublished: true,
        description: p.description,
        ...specRelation,
      },
    });
    console.log(`  ✅ created: ${p.name}`);
  }

  // 5. Update products.json to match
  const dataFile = path.join(__dirname, '..', 'data', 'products.json');
  const data = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
  data.products = data.products.map((p: any) => {
    if (IMAGE_UPDATES[p.name]) return { ...p, imageUrl: IMAGE_UPDATES[p.name] };
    return p;
  });
  // Add new products to json
  for (const np of NEW_PRODUCTS) {
    const exists = data.products.find((p: any) => p.name === np.name);
    if (!exists) data.products.push({ ...np, isPublished: true });
  }
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`\n📁 products.json updated — total: ${data.products.length}`);
  console.log('\n🎉 Done!');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
