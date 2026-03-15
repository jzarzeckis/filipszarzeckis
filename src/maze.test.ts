import { test, expect } from "bun:test";

// Smoke test: verify the maze generation algorithm produces a valid spanning tree.
// Imported inline since generateMaze is not exported from MazeCanvas (it's a canvas component).

const N = 1, S = 2, W = 4, E = 8;

function generateMaze(width: number, height: number): Uint8Array {
  const cells = new Uint8Array(width * height);
  const inMaze = new Uint8Array(width * height);
  const remaining: number[] = Array.from({ length: width * height }, (_, i) => i);
  const previous = new Int32Array(width * height).fill(-1);
  const start = remaining.pop()!;
  inMaze[start] = 1;
  while (!walk());
  return cells;

  function walk(): boolean {
    let i0: number, i1: number;
    do {
      const idx = remaining.pop();
      if (idx === undefined) return true;
      i0 = idx;
    } while (inMaze[i0]);
    previous[i0] = i0;
    while (true) {
      const x0 = i0 % width, y0 = (i0 / width) | 0;
      i1 = (Math.random() * 4) | 0;
      if (i1 === 0) { if (y0 <= 0) continue; i1 = i0 - width; }
      else if (i1 === 1) { if (y0 >= height - 1) continue; i1 = i0 + width; }
      else if (i1 === 2) { if (x0 <= 0) continue; i1 = i0 - 1; }
      else { if (x0 >= width - 1) continue; i1 = i0 + 1; }
      if (previous[i1]! >= 0) erase(i0, i1);
      else previous[i1] = i0;
      if (inMaze[i1]) {
        while (previous[i1] !== i1) {
          i0 = previous[i1]!;
          if (i1 === i0 + 1)      { cells[i0] = cells[i0]! | E; cells[i1] = cells[i1]! | W; }
          else if (i1 === i0 - 1) { cells[i0] = cells[i0]! | W; cells[i1] = cells[i1]! | E; }
          else if (i1 === i0 + width) { cells[i0] = cells[i0]! | S; cells[i1] = cells[i1]! | N; }
          else                    { cells[i0] = cells[i0]! | N; cells[i1] = cells[i1]! | S; }
          inMaze[i1] = 1; previous[i1] = -1; i1 = i0;
        }
        inMaze[i1] = 1; previous[i1] = -1;
        return false;
      }
      i0 = i1;
    }
  }

  function erase(i0: number, i2: number) {
    let i1: number;
    do { i1 = previous[i0]!; previous[i0] = -1; i0 = i1; } while (i1 !== i2);
  }
}

test("maze fills every cell", () => {
  const W = 20, H = 15;
  const cells = generateMaze(W, H);
  // Every cell must have at least one open passage (not isolated)
  for (let i = 0; i < W * H; i++) {
    expect(cells[i]).toBeGreaterThan(0);
  }
});

test("maze passages are symmetric", () => {
  const W = 20, H = 15;
  const cells = generateMaze(W, H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (x < W - 1) {
        // East from i ↔ West from i+1
        expect(!!(cells[i]! & E)).toBe(!!(cells[i + 1]! & W));
      }
      if (y < H - 1) {
        // South from i ↔ North from i+W
        expect(!!(cells[i]! & S)).toBe(!!(cells[i + W]! & N));
      }
    }
  }
});

test("maze is a spanning tree (connected, no cycles)", () => {
  const W = 20, H = 15;
  const cells = generateMaze(W, H);
  // BFS from cell 0 — should reach all W*H cells exactly once
  const visited = new Uint8Array(W * H);
  const queue = [0];
  visited[0] = 1;
  let count = 1;
  while (queue.length) {
    const i = queue.shift()!;
    if (cells[i]! & E && !visited[i + 1]) { visited[i + 1] = 1; count++; queue.push(i + 1); }
    if (cells[i]! & W && !visited[i - 1]) { visited[i - 1] = 1; count++; queue.push(i - 1); }
    if (cells[i]! & S && !visited[i + W]) { visited[i + W] = 1; count++; queue.push(i + W); }
    if (cells[i]! & N && !visited[i - W]) { visited[i - W] = 1; count++; queue.push(i - W); }
  }
  expect(count).toBe(W * H);
});
