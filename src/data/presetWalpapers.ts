export interface WallpaperPreset {
  id: string;
  name: string;
  bg: string;
  color?: string;
  isImage: boolean;
  isAdminAdded?: boolean;
  category?: string;
}

export const GET_PRESET_WALLPAPERS = (isDark: boolean = true): WallpaperPreset[] => [
  // ── Standard Solid Presets ──
  { id: 'preset_1', name: 'Default', bg: 'default', color: isDark ? '#0b141a' : '#efeae2', isImage: false, category: 'Solid' },
  { id: 'preset_2', name: 'Dark Charcoal', bg: '#111b21', color: '#111b21', isImage: false, category: 'Solid' },
  { id: 'preset_3', name: 'Deep Slate', bg: '#1e293b', color: '#1e293b', isImage: false, category: 'Solid' },
  { id: 'preset_4', name: 'Emerald Dark', bg: '#062c1b', color: '#062c1b', isImage: false, category: 'Solid' },

  // ── High Definition Vertical Portrait Wallpapers ──
  {
    id: 'wp_dark_butterfly',
    name: 'Black Butterfly & Bubbles',
    bg: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
    color: '#0e0e12',
    isImage: true,
    category: '3D & Aesthetic'
  },
  {
    id: 'wp_diamond_dust',
    name: 'Sparkling Rose Diamonds',
    bg: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&auto=format&fit=crop&q=80',
    color: '#1a1018',
    isImage: true,
    category: 'Glitter & Luxury'
  },
  {
    id: 'wp_gold_metallic_silk',
    name: 'Gold & Dark Silk Wave',
    bg: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    color: '#121216',
    isImage: true,
    category: 'Luxury & Silk'
  },
  {
    id: 'wp_pink_checker_fur',
    name: 'Pink & Black Plush Tile',
    bg: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800&auto=format&fit=crop&q=80',
    color: '#1f101a',
    isImage: true,
    category: '3D Plush'
  },
  {
    id: 'wp_neon_cyan_droplets',
    name: 'Cyan Dew Drop Glow',
    bg: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800&auto=format&fit=crop&q=80',
    color: '#0a1622',
    isImage: true,
    category: 'Texture & Water'
  },
  {
    id: 'wp_space_galaxy',
    name: 'Cosmic Deep Space',
    bg: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=800&auto=format&fit=crop&q=80',
    color: '#080613',
    isImage: true,
    category: 'Space & Galaxy'
  },
  {
    id: 'wp_dark_botanical',
    name: 'Minimal Emerald Leaves',
    bg: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=800&auto=format&fit=crop&q=80',
    color: '#061a12',
    isImage: true,
    category: 'Nature & Aesthetic'
  },
  {
    id: 'wp_magenta_rain',
    name: 'Magenta Rain Glass',
    bg: 'https://images.unsplash.com/photo-1527066579998-dbbae57f4500?w=800&auto=format&fit=crop&q=80',
    color: '#200818',
    isImage: true,
    category: 'Water & Neon'
  },
  {
    id: 'wp_floating_purple_hearts',
    name: '3D Floating Purple Hearts',
    bg: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=800&auto=format&fit=crop&q=80',
    color: '#2e003e',
    isImage: true,
    category: 'Love & Romantics'
  },
  {
    id: 'wp_cute_pookie',
    name: 'Cute Teddy Bear Aesthetic',
    bg: 'https://images.unsplash.com/photo-1559454403-b8fb88521f11?w=800&auto=format&fit=crop&q=80',
    color: '#f5e6d3',
    isImage: true,
    category: 'Cute & Anime'
  },
];

