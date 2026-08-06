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

  // ── User Requested Wallpapers (1 to 26) ──
  {
    id: 'wp_pink_spheres',
    name: '3D Pink Bubbles',
    bg: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    color: '#ff69b4',
    isImage: true,
    category: '3D & Abstract'
  },
  {
    id: 'wp_color_smoke',
    name: 'Fluid Color Smoke',
    bg: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800&auto=format&fit=crop&q=80',
    color: '#008080',
    isImage: true,
    category: '3D & Abstract'
  },
  {
    id: 'wp_paint_splash',
    name: '3D Blue Splash',
    bg: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&auto=format&fit=crop&q=80',
    color: '#000080',
    isImage: true,
    category: '3D & Abstract'
  },
  {
    id: 'wp_wood_blue_glow',
    name: 'Wood & Blue Neon',
    bg: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80',
    color: '#1a100c',
    isImage: true,
    category: 'Texture & Neon'
  },
  {
    id: 'wp_geometric_tiles',
    name: 'Geometric Paint Burst',
    bg: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80',
    color: '#1e293b',
    isImage: true,
    category: '3D & Abstract'
  },
  {
    id: 'wp_stone_cyan_glow',
    name: 'Stone Cyan LED',
    bg: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800&auto=format&fit=crop&q=80',
    color: '#0f172a',
    isImage: true,
    category: 'Texture & Neon'
  },
  {
    id: 'wp_smile_diary',
    name: 'Smile Black Diary',
    bg: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80',
    color: '#121212',
    isImage: true,
    category: 'Aesthetic & Quotes'
  },
  {
    id: 'wp_mono_layers',
    name: 'Monochrome Layers',
    bg: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
    color: '#1f1f1f',
    isImage: true,
    category: 'Texture & Minimal'
  },
  {
    id: 'wp_black_violin',
    name: 'Violin Music Art',
    bg: 'https://images.unsplash.com/photo-1612225330812-01a9c6b355ec?w=800&auto=format&fit=crop&q=80',
    color: '#0a0a0a',
    isImage: true,
    category: 'Music & Vibes'
  },
  {
    id: 'wp_music_is_life',
    name: 'Music Is Life',
    bg: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
    color: '#111111',
    isImage: true,
    category: 'Music & Vibes'
  },
  {
    id: 'wp_cyan_droplets',
    name: 'Cyan Water Drops',
    bg: 'https://images.unsplash.com/photo-1527066579998-dbbae57f4500?w=800&auto=format&fit=crop&q=80',
    color: '#00ced1',
    isImage: true,
    category: 'Texture & Water'
  },
  {
    id: 'wp_magenta_droplets',
    name: 'Magenta Water Drops',
    bg: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=800&auto=format&fit=crop&q=80',
    color: '#ff1493',
    isImage: true,
    category: 'Texture & Water'
  },
  {
    id: 'wp_believe_plane',
    name: 'Believe In Yourself',
    bg: 'https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?w=800&auto=format&fit=crop&q=80',
    color: '#222222',
    isImage: true,
    category: 'Quotes & Motivation'
  },
  {
    id: 'wp_hope_raindrops',
    name: 'H.O.P.E. Raindrops',
    bg: 'https://images.unsplash.com/photo-1519692933481-e162a57d6721?w=800&auto=format&fit=crop&q=80',
    color: '#1a1a1a',
    isImage: true,
    category: 'Quotes & Motivation'
  },
  {
    id: 'wp_hand_heart_sun',
    name: 'Heart Sun Rays',
    bg: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=800&auto=format&fit=crop&q=80',
    color: '#87ceeb',
    isImage: true,
    category: 'Love & Nature'
  },
  {
    id: 'wp_smile_sunshine',
    name: 'Smile Sunshine',
    bg: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80',
    color: '#1e1e1e',
    isImage: true,
    category: 'Aesthetic & Quotes'
  },
  {
    id: 'wp_black_smile',
    name: 'Minimal Black Smile',
    bg: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80',
    color: '#000000',
    isImage: true,
    category: 'Minimal & Dark'
  },
  {
    id: 'wp_pink_particles',
    name: 'Pink Particle Galaxy',
    bg: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=800&auto=format&fit=crop&q=80',
    color: '#110515',
    isImage: true,
    category: '3D & Abstract'
  },
  {
    id: 'wp_beach_hearts',
    name: 'Black Sand Hearts',
    bg: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
    color: '#120a10',
    isImage: true,
    category: 'Love & Nature'
  },
  {
    id: 'wp_red_roses',
    name: 'Red Roses & Dew',
    bg: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
    color: '#8b0000',
    isImage: true,
    category: 'Love & Flowers'
  },
  {
    id: 'wp_velvet_hearts',
    name: 'Red Velvet Hearts',
    bg: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=800&auto=format&fit=crop&q=80',
    color: '#800000',
    isImage: true,
    category: 'Love & Romantics'
  },
  {
    id: 'wp_hanging_hearts',
    name: 'Hanging Heart Lights',
    bg: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800&auto=format&fit=crop&q=80',
    color: '#101622',
    isImage: true,
    category: 'Love & Romantics'
  },
  {
    id: 'wp_pookie_bear',
    name: 'Cute Pookie Teddy',
    bg: 'https://images.unsplash.com/photo-1559454403-b8fb88521f11?w=800&auto=format&fit=crop&q=80',
    color: '#f5e6d3',
    isImage: true,
    category: 'Cute & Anime'
  },
  {
    id: 'wp_tom_jerry',
    name: 'Tom & Jerry Love',
    bg: 'https://images.unsplash.com/photo-1535268647677-300dbf3d78d1?w=800&auto=format&fit=crop&q=80',
    color: '#ffe4e1',
    isImage: true,
    category: 'Cute & Anime'
  },
  {
    id: 'wp_butterfly_lily',
    name: 'Butterfly & Lily Art',
    bg: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=800&auto=format&fit=crop&q=80',
    color: '#fef3e2',
    isImage: true,
    category: 'Aesthetic & Art'
  },
  {
    id: 'wp_floating_purple_hearts',
    name: 'Floating 3D Hearts',
    bg: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=800&auto=format&fit=crop&q=80',
    color: '#2e003e',
    isImage: true,
    category: 'Love & Romantics'
  },
];
