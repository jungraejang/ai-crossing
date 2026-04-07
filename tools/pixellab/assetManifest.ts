export const PIXELLAB_RUNTIME_SETTINGS = {
  maxConcurrentJobs: 3,
  terrain: {
    tileType: 'isometric',
    tileSize: 32,
    tileView: 'low top-down',
    outlineMode: 'segmentation',
  },
  objects: {
    view: 'low top-down',
    outline: 'single color outline',
    shading: 'medium shading',
    detail: 'high detail',
  },
  villagers: {
    mode: 'pro',
    nDirections: 8,
    size: 48,
    view: 'low top-down',
    walkTemplateAnimationId: 'walking-8-frames',
  },
} as const;

export const PIXELLAB_EXECUTION_PROTOCOL = {
  reviewChecklist: [
    'wait for every job in the wave to reach completed or failed',
    'review every finished output before starting the next wave',
    'retry failed or off-model assets within the same family before continuing',
    'never exceed three queued jobs at any time',
  ],
  pollIntervalMs: 10000,
  retryPolicy: 'use the next open slot in the current family before moving on',
} as const;

export const PIXELLAB_TERRAIN_WAVES = [
  {
    waveId: 'T1',
    jobs: [
      {
        assetKey: 'terrain-core',
        tool: 'create_tiles_pro',
        destinationPaths: [
          'apps/web/public/isometric/terrain/grass.png',
          'apps/web/public/isometric/terrain/water.png',
          'apps/web/public/isometric/terrain/dirt.png',
          'apps/web/public/isometric/terrain/cobble.png',
        ],
        arguments: {
          description: '1). lush village grass tile 2). clear blue lake water tile 3). warm dirt path tile 4). cozy cobblestone plaza tile',
          tile_type: 'isometric',
          tile_size: 32,
          n_tiles: 4,
          tile_view: 'low top-down',
          outline_mode: 'segmentation',
        },
      },
      {
        assetKey: 'bridge',
        tool: 'create_isometric_tile',
        destinationPath: 'apps/web/public/isometric/terrain/bridge.png',
        arguments: {
          description: 'wooden village bridge plank tile with cozy rustic shading',
          size: 32,
          tile_shape: 'thin tile',
          outline: 'single color outline',
          shading: 'medium shading',
          detail: 'highly detailed',
        },
      },
    ],
  },
] as const;

export const PIXELLAB_BUILDING_WAVES = [
  {
    waveId: 'B1',
    jobs: [
      {
        assetKey: 'cafe',
        destinationPath: 'apps/web/public/isometric/buildings/cafe.png',
        description: 'cozy village cafe with red roof, wood facade, warm windows, flower boxes, isometric-friendly low top-down pixel art',
        width: 352,
        height: 256,
      },
      {
        assetKey: 'store',
        destinationPath: 'apps/web/public/isometric/buildings/store.png',
        description: 'friendly general store with blue awning, crates, signboard, village market style, low top-down pixel art',
        width: 352,
        height: 256,
      },
      {
        assetKey: 'workshop',
        destinationPath: 'apps/web/public/isometric/buildings/workshop.png',
        description: 'village craft workshop with timber walls, chimney, tools, saw horse details, low top-down pixel art',
        width: 352,
        height: 256,
      },
    ],
  },
  {
    waveId: 'B2',
    jobs: [
      { assetKey: 'home_1', destinationPath: 'apps/web/public/isometric/buildings/home_1.png', description: 'small cozy village home with warm brown roof and planter boxes', width: 352, height: 256 },
      { assetKey: 'home_2', destinationPath: 'apps/web/public/isometric/buildings/home_2.png', description: 'small tidy village home with tan roof, brick chimney, and neat front steps', width: 352, height: 256 },
      { assetKey: 'home_3', destinationPath: 'apps/web/public/isometric/buildings/home_3.png', description: 'small cheerful village home with clay roof and welcoming porch', width: 352, height: 256 },
    ],
  },
  {
    waveId: 'B3',
    jobs: [
      { assetKey: 'home_4', destinationPath: 'apps/web/public/isometric/buildings/home_4.png', description: 'small sturdy village home with orange roof and practical wood details', width: 352, height: 256 },
      { assetKey: 'home_5', destinationPath: 'apps/web/public/isometric/buildings/home_5.png', description: 'small peaceful village home with sage green roof and garden accents', width: 352, height: 256 },
      { assetKey: 'home_6', destinationPath: 'apps/web/public/isometric/buildings/home_6.png', description: 'small whimsical village home with violet roof and cozy lanterns', width: 352, height: 256 },
    ],
  },
  {
    waveId: 'B4',
    jobs: [
      { assetKey: 'home_7', destinationPath: 'apps/web/public/isometric/buildings/home_7.png', description: 'small practical village home with muted rose roof and tidy stone base', width: 352, height: 256 },
      { assetKey: 'home_8', destinationPath: 'apps/web/public/isometric/buildings/home_8.png', description: 'small coastal-inspired village home with teal roof and simple trim', width: 352, height: 256 },
      { assetKey: 'home_9', destinationPath: 'apps/web/public/isometric/buildings/home_9.png', description: 'small artisan village home with deep red roof and decorative details', width: 352, height: 256 },
    ],
  },
  {
    waveId: 'B5',
    jobs: [
      { assetKey: 'home_10', destinationPath: 'apps/web/public/isometric/buildings/home_10.png', description: 'small bright village home with blue roof and clean front path', width: 352, height: 256 },
      { assetKey: 'home_11', destinationPath: 'apps/web/public/isometric/buildings/home_11.png', description: 'small golden-roof village home with flowers and study-like charm', width: 352, height: 256 },
      { assetKey: 'home_12', destinationPath: 'apps/web/public/isometric/buildings/home_12.png', description: 'small stone village home with slate roof and sturdy craftsmanship', width: 352, height: 256 },
    ],
  },
  {
    waveId: 'B6',
    jobs: [
      {
        assetKey: 'garden',
        destinationPath: 'apps/web/public/isometric/buildings/garden.png',
        description: 'community garden plot with pergola, planters, flowers, and open village greenery, low top-down pixel art',
        width: 352,
        height: 256,
      },
      {
        assetKey: 'town_square',
        destinationPath: 'apps/web/public/isometric/buildings/town_square.png',
        description: 'large village town square centerpiece with fountain, stone plaza, benches, and decorative greenery, low top-down pixel art',
        width: 400,
        height: 320,
      },
    ],
  },
] as const;

export const PIXELLAB_DECORATION_WAVES = [
  {
    waveId: 'D1',
    jobs: [
      { assetKey: 'oak_tree', destinationPath: 'apps/web/public/isometric/decorations/oak_tree.png', description: 'lush oak tree for cozy village map, transparent background', width: 160, height: 192 },
      { assetKey: 'pine_tree', destinationPath: 'apps/web/public/isometric/decorations/pine_tree.png', description: 'tall pine tree for cozy village map, transparent background', width: 128, height: 192 },
      { assetKey: 'cherry_tree', destinationPath: 'apps/web/public/isometric/decorations/cherry_tree.png', description: 'pink cherry blossom tree for cozy village map, transparent background', width: 160, height: 192 },
    ],
  },
  {
    waveId: 'D2',
    jobs: [
      { assetKey: 'bush', destinationPath: 'apps/web/public/isometric/decorations/bush.png', description: 'round green village bush, transparent background', width: 96, height: 80 },
      { assetKey: 'flowers', destinationPath: 'apps/web/public/isometric/decorations/flowers.png', description: 'small colorful flower patch, transparent background', width: 96, height: 80 },
      { assetKey: 'small_rocks', destinationPath: 'apps/web/public/isometric/decorations/small_rocks.png', description: 'cluster of small decorative rocks, transparent background', width: 96, height: 80 },
    ],
  },
  {
    waveId: 'D3',
    jobs: [
      { assetKey: 'bench', destinationPath: 'apps/web/public/isometric/decorations/bench.png', description: 'wooden park bench for village square, transparent background', width: 112, height: 96 },
      { assetKey: 'reeds', destinationPath: 'apps/web/public/isometric/decorations/reeds.png', description: 'thin lakeside reeds cluster, transparent background', width: 96, height: 96 },
    ],
  },
] as const;

export const PIXELLAB_VILLAGER_WAVES = [
  {
    waveId: 'V1',
    jobs: [
      { id: 'maple', name: 'Maple', description: 'adult baker villager, cheerful and talkative, warm apron, rustic village style, friendly face' },
      { id: 'jasper', name: 'Jasper', description: 'adult farmer villager, quiet and hardworking, simple practical clothes, earthy palette, calm expression' },
      { id: 'luna', name: 'Luna', description: 'adult shopkeeper villager, witty and curious, stylish shop outfit, clever expression, polished village fashion' },
    ],
  },
  {
    waveId: 'V2',
    jobs: [
      { id: 'rowan', name: 'Rowan', description: 'adult carpenter villager, gruff and loyal, sturdy work clothes, toolbelt, dependable silhouette' },
      { id: 'sage', name: 'Sage', description: 'adult herbalist villager, gentle and mystical, layered herbal robes, natural palette, serene expression' },
      { id: 'felix', name: 'Felix', description: 'adult musician villager, playful and dramatic, performer outfit, expressive pose, colorful accents' },
    ],
  },
  {
    waveId: 'V3',
    jobs: [
      { id: 'coral', name: 'Coral', description: 'adult fisher villager, quiet and gentle, practical fisher clothes, relaxed stance, blue accents' },
      { id: 'finn', name: 'Finn', description: 'adult guard villager, loyal and gruff, village guard uniform, alert stance, disciplined silhouette' },
      { id: 'ivy', name: 'Ivy', description: 'adult painter villager, curious and gentle, artist smock, paint accents, dreamy expression' },
    ],
  },
  {
    waveId: 'V4',
    jobs: [
      { id: 'milo', name: 'Milo', description: 'adult cook villager, cheerful and playful, cook attire, welcoming smile, kitchen-inspired palette' },
      { id: 'pearl', name: 'Pearl', description: 'adult librarian villager, witty and mystical, refined layered clothing, bookish elegance' },
      { id: 'otto', name: 'Otto', description: 'adult blacksmith villager, gruff and hardworking, heavy smith apron, sturdy build, soot accents' },
    ],
  },
  {
    waveId: 'V5',
    jobs: [
      { id: 'hazel', name: 'Hazel', description: 'adult tailor villager, creative and gentle, elegant tailor clothes, fabric details, refined look' },
      { id: 'cliff', name: 'Cliff', description: 'adult miner villager, gruff and hardworking, rugged miner outfit, earthy palette, strong posture' },
      { id: 'wren', name: 'Wren', description: 'adult doctor villager, gentle and curious, village doctor coat, reassuring expression, clean palette' },
    ],
  },
  {
    waveId: 'V6',
    jobs: [
      { id: 'birch', name: 'Birch', description: 'adult beekeeper villager, quiet and mystical, simple beekeeper outfit, honey accents, calm expression' },
      { id: 'ember', name: 'Ember', description: 'adult sailor villager, playful and loyal, sailor-inspired clothes, adventurous energy' },
      { id: 'fern', name: 'Fern', description: 'adult teacher villager, cheerful and witty, tidy teacher outfit, bright approachable look' },
    ],
  },
  {
    waveId: 'V7',
    jobs: [
      { id: 'slate', name: 'Slate', description: 'adult mason villager, gruff and loyal, stonemason clothes, solid build, grounded style' },
      { id: 'poppy', name: 'Poppy', description: 'adult florist villager, cheerful and gentle, florist apron, floral accents, warm smile' },
      { id: 'reed', name: 'Reed', description: 'adult ranger villager, quiet and hardworking, ranger gear, practical boots, observant expression' },
    ],
  },
  {
    waveId: 'V8',
    jobs: [
      { id: 'dusk', name: 'Dusk', description: 'adult astronomer villager, mystical and curious, celestial-themed clothing, star accents, thoughtful face' },
      { id: 'cinder', name: 'Cinder', description: 'adult potter villager, creative and playful, clay-stained work clothes, warm earthy palette' },
      { id: 'flint', name: 'Flint', description: 'adult hunter villager, quiet and gruff, hunter outfit, rugged details, restrained expression' },
    ],
  },
] as const;

export const PIXELLAB_WALK_ANIMATION_WAVES = [
  { waveId: 'W1', villagerIds: ['maple', 'jasper', 'luna'] },
  { waveId: 'W2', villagerIds: ['rowan', 'sage', 'felix'] },
  { waveId: 'W3', villagerIds: ['coral', 'finn', 'ivy'] },
  { waveId: 'W4', villagerIds: ['milo', 'pearl', 'otto'] },
  { waveId: 'W5', villagerIds: ['hazel', 'cliff', 'wren'] },
  { waveId: 'W6', villagerIds: ['birch', 'ember', 'fern'] },
  { waveId: 'W7', villagerIds: ['slate', 'poppy', 'reed'] },
  { waveId: 'W8', villagerIds: ['dusk', 'cinder', 'flint'] },
] as const;
