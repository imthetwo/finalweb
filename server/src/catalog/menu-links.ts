/** Map href mega-menu → category slug trong DB (dùng để query product count) */
export const MENU_LINK_TO_SLUG: Record<string, string> = {
  // ── PCs & Laptops ─────────────────────────────────────────────
  '/pcs': 'prebuilt-pcs',
  '/laptops': 'laptops',
  '/laptops/accessories': 'laptop-accessories',

  // ── PC Components — Core Performance ──────────────────────────
  '/components/processors': 'processors',
  '/components/graphics-cards': 'graphics-cards',
  '/components/motherboards': 'motherboards',
  '/components/memory-storage/ram': 'ram',

  // ── PC Components — Storage & Power ───────────────────────────
  '/components/memory-storage/nvme-ssds': 'storage',
  '/components/memory-storage/hdd': 'storage',
  '/components/power-cooling/psu': 'power-supplies',
  '/components/chassis-modding/pc-cases': 'pc-cases',

  // ── PC Components — Cooling ────────────────────────────────────
  '/components/power-cooling/aio-liquid-coolers': 'cpu-coolers',
  '/components/power-cooling/air-coolers': 'cpu-coolers',
  '/components/power-cooling/case-fans': 'case-fans',

  // ── Gear & Peripherals ─────────────────────────────────────────
  '/gaming-gear/input-devices/mechanical-keyboards': 'mechanical-keyboards',
  '/gaming-gear/input-devices/wireless-mice': 'wireless-mice',
  '/gaming-gear/surfaces-atmosphere/premium-mousepads': 'wireless-mice',
  '/gaming-gear/audio/gaming-headsets': 'gaming-headsets',
  '/gaming-gear/audio/in-ear-monitors': 'gaming-headsets',

  // ── Gaming Furniture ───────────────────────────────────────────
  '/gaming-furniture/seating/ergonomic-chairs': 'gaming-furniture',
  '/gaming-furniture/seating/racing-style-chairs': 'gaming-furniture',
  '/gaming-furniture/desks/motorized-standing-desks': 'gaming-furniture',
  '/gaming-furniture/mounts-arms/monitor-arms': 'gaming-furniture',
};

export const MENU_SECTIONS = [
  {
    key: 'PCS_LAPTOPS',
    href: '/pcs',
    columns: [
      {
        title: 'MÁY NGUYÊN BỘ',
        links: [
          { label: 'PC Gaming Esport', href: '/pcs' },
          { label: 'PC Workstation', href: '/pcs' },
          { label: 'PC Mini (SFF)', href: '/pcs' },
        ],
      },
      {
        title: 'LAPTOP',
        links: [
          { label: 'Laptop Gaming', href: '/laptops' },
          { label: 'Laptop Văn phòng', href: '/laptops' },
          { label: 'Phụ kiện Laptop', href: '/laptops/accessories' },
        ],
      },
    ],
  },
  {
    key: 'COMPONENTS',
    href: '/components/processors',
    columns: [
      {
        title: 'HIỆU NĂNG CỐT LÕI',
        links: [
          { label: 'CPU (Bộ vi xử lý)', href: '/components/processors' },
          { label: 'VGA (Card màn hình)', href: '/components/graphics-cards' },
          { label: 'Mainboard', href: '/components/motherboards' },
          { label: 'RAM', href: '/components/memory-storage/ram' },
        ],
      },
      {
        title: 'LƯU TRỮ & NĂNG LƯỢNG',
        links: [
          { label: 'SSD NVMe', href: '/components/memory-storage/nvme-ssds' },
          { label: 'Ổ cứng HDD', href: '/components/memory-storage/hdd' },
          { label: 'Nguồn PSU', href: '/components/power-cooling/psu' },
          { label: 'Vỏ Case', href: '/components/chassis-modding/pc-cases' },
        ],
      },
      {
        title: 'TẢN NHIỆT',
        links: [
          { label: 'Tản nước AIO', href: '/components/power-cooling/aio-liquid-coolers' },
          { label: 'Tản khí CPU', href: '/components/power-cooling/air-coolers' },
          { label: 'Quạt Case Fan', href: '/components/power-cooling/case-fans' },
        ],
      },
    ],
  },
  {
    key: 'GEAR',
    href: '/gaming-gear/input-devices/mechanical-keyboards',
    columns: [
      {
        title: 'INPUT DEVICES',
        links: [
          { label: 'Bàn phím cơ', href: '/gaming-gear/input-devices/mechanical-keyboards' },
          { label: 'Chuột Gaming', href: '/gaming-gear/input-devices/wireless-mice' },
          { label: 'Lót chuột', href: '/gaming-gear/surfaces-atmosphere/premium-mousepads' },
        ],
      },
      {
        title: 'AUDIO & DISPLAY',
        links: [
          { label: 'Tai nghe Gaming', href: '/gaming-gear/audio/gaming-headsets' },
          { label: 'Loa Gaming', href: '/gaming-gear/audio/in-ear-monitors' },
          { label: 'Màn hình Gaming', href: '/gaming-gear/audio/gaming-headsets' },
        ],
      },
    ],
  },
  {
    key: 'BUNDLES',
    href: '/components/chassis-modding/pc-cases',
    columns: [
      {
        title: 'THEO CHỦ ĐỀ',
        links: [
          { label: 'White Theme Setup', href: '/components/chassis-modding/pc-cases' },
          { label: 'Minimalist Setup', href: '/components/chassis-modding/pc-cases' },
          { label: 'RGB Gaming Setup', href: '/components/memory-storage/ram' },
        ],
      },
      {
        title: 'HỆ SINH THÁI HÃNG',
        links: [
          { label: 'Corsair iCUE', href: '/components/memory-storage/ram' },
          { label: 'ROG Aura Sync', href: '/components/motherboards' },
          { label: 'Logitech G Series', href: '/gaming-gear/input-devices/mechanical-keyboards' },
        ],
      },
    ],
  },
  {
    key: 'FURNITURE',
    href: '/gaming-furniture/seating/ergonomic-chairs',
    columns: [
      {
        title: 'GHẾ GAMING',
        links: [
          { label: 'Ghế Ergonomic', href: '/gaming-furniture/seating/ergonomic-chairs' },
          { label: 'Ghế Racing Style', href: '/gaming-furniture/seating/racing-style-chairs' },
        ],
      },
      {
        title: 'BÀN & PHỤ KIỆN',
        links: [
          { label: 'Bàn Đứng (Standing Desk)', href: '/gaming-furniture/desks/motorized-standing-desks' },
          { label: 'Giá đỡ Màn hình', href: '/gaming-furniture/mounts-arms/monitor-arms' },
          { label: 'Kệ để PC', href: '/gaming-furniture/setup-accessories/pc-floor-stands' },
        ],
      },
    ],
  },
] as const;
