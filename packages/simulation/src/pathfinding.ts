interface GridNode {
  x: number;
  y: number;
  g: number;
  h: number;
  f: number;
  parent: GridNode | null;
  walkable: boolean;
}

interface GridDirection {
  dx: number;
  dy: number;
  cost: number;
}

const SQRT2 = Math.SQRT2;

const DIRECTIONS: GridDirection[] = [
  { dx: 0, dy: -1, cost: 1 },
  { dx: 1, dy: 0, cost: 1 },
  { dx: 0, dy: 1, cost: 1 },
  { dx: -1, dy: 0, cost: 1 },
  { dx: 1, dy: -1, cost: SQRT2 },
  { dx: 1, dy: 1, cost: SQRT2 },
  { dx: -1, dy: 1, cost: SQRT2 },
  { dx: -1, dy: -1, cost: SQRT2 },
];

let cachedWalkableMatrix: number[][] | null = null;
let cachedWidth = 0;
let cachedHeight = 0;

export function initGrid(width: number, height: number, walkableMatrix: number[][]): void {
  cachedWalkableMatrix = walkableMatrix;
  cachedWidth = width;
  cachedHeight = height;
}

export function findPath(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  collisionGrid?: number[][],
): Array<{ x: number; y: number }> {
  const matrix = collisionGrid ?? cachedWalkableMatrix;
  if (!matrix) return [];

  const width = matrix[0]?.length ?? 0;
  const height = matrix.length;
  if (width === 0 || height === 0) return [];

  const clamp = (v: number, max: number) => Math.max(0, Math.min(max - 1, Math.round(v)));
  const sx = clamp(startX, width);
  const sy = clamp(startY, height);
  const ex = clamp(endX, width);
  const ey = clamp(endY, height);

  if (sx === ex && sy === ey) return [{ x: sx, y: sy }];

  if (matrix[ey]?.[ex] === 1) {
    const alt = findNearestWalkable(ex, ey, matrix, width, height);
    if (!alt) return [];
    return astar(sx, sy, alt.x, alt.y, matrix, width, height);
  }

  return astar(sx, sy, ex, ey, matrix, width, height);
}

function astar(
  sx: number,
  sy: number,
  ex: number,
  ey: number,
  matrix: number[][],
  width: number,
  height: number,
): Array<{ x: number; y: number }> {
  const nodes: GridNode[][] = [];
  for (let y = 0; y < height; y++) {
    nodes[y] = [];
    for (let x = 0; x < width; x++) {
      nodes[y]![x] = {
        x,
        y,
        g: Infinity,
        h: 0,
        f: Infinity,
        parent: null,
        walkable: (matrix[y]?.[x] ?? 0) === 0,
      };
    }
  }

  const start = nodes[sy]![sx]!;
  const end = nodes[ey]![ex]!;

  start.g = 0;
  start.h = heuristic(sx, sy, ex, ey);
  start.f = start.h;

  const openSet = new Set<GridNode>([start]);
  const closedSet = new Set<GridNode>();

  let iterations = 0;
  const maxIterations = width * height * 2;

  while (openSet.size > 0 && iterations < maxIterations) {
    iterations++;

    let current: GridNode | null = null;
    for (const node of openSet) {
      if (!current || node.f < current.f) current = node;
    }
    if (!current) break;

    if (current === end) {
      return reconstructPath(current);
    }

    openSet.delete(current);
    closedSet.add(current);

    for (const dir of DIRECTIONS) {
      const nx = current.x + dir.dx;
      const ny = current.y + dir.dy;

      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
      if (dir.dx !== 0 && dir.dy !== 0 && !canTraverseDiagonal(current.x, current.y, dir.dx, dir.dy, matrix)) {
        continue;
      }

      const neighbor = nodes[ny]![nx]!;
      if (!neighbor.walkable || closedSet.has(neighbor)) continue;

      const tentativeG = current.g + dir.cost;
      if (tentativeG < neighbor.g) {
        neighbor.parent = current;
        neighbor.g = tentativeG;
        neighbor.h = heuristic(nx, ny, ex, ey);
        neighbor.f = neighbor.g + neighbor.h;
        openSet.add(neighbor);
      }
    }
  }

  return [];
}

function heuristic(x1: number, y1: number, x2: number, y2: number): number {
  const dx = Math.abs(x1 - x2);
  const dy = Math.abs(y1 - y2);
  return Math.max(dx, dy) + (SQRT2 - 1) * Math.min(dx, dy);
}

function reconstructPath(node: GridNode): Array<{ x: number; y: number }> {
  const path: Array<{ x: number; y: number }> = [];
  let current: GridNode | null = node;

  while (current) {
    path.unshift({ x: current.x, y: current.y });
    current = current.parent;
  }

  return path;
}

function findNearestWalkable(
  x: number,
  y: number,
  matrix: number[][],
  width: number,
  height: number,
): { x: number; y: number } | null {
  for (let r = 1; r <= 5; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < width && ny >= 0 && ny < height && (matrix[ny]?.[nx] ?? 1) === 0) {
          return { x: nx, y: ny };
        }
      }
    }
  }
  return null;
}

function canTraverseDiagonal(
  x: number,
  y: number,
  dx: number,
  dy: number,
  matrix: number[][],
): boolean {
  const horizontal = matrix[y]?.[x + dx] ?? 1;
  const vertical = matrix[y + dy]?.[x] ?? 1;
  return horizontal === 0 && vertical === 0;
}

export function isWalkable(x: number, y: number): boolean {
  if (!cachedWalkableMatrix) return true;
  const ix = Math.round(x);
  const iy = Math.round(y);
  if (ix < 0 || ix >= cachedWidth || iy < 0 || iy >= cachedHeight) return false;
  return (cachedWalkableMatrix[iy]?.[ix] ?? 1) === 0;
}
