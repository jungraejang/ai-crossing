import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_ISO_CONFIG,
  getDepthSortKey,
  getFootprintCenter,
  getProjectedMapBounds,
  gridToScreen,
  screenToGrid,
} from './isometric';

test('gridToScreen and screenToGrid round-trip tile centers', () => {
  const samples = [
    { x: 0.5, y: 0.5 },
    { x: 5.5, y: 3.5 },
    { x: 12.25, y: 18.75 },
    { x: 39.5, y: 29.5 },
  ];

  for (const sample of samples) {
    const screen = gridToScreen(sample.x, sample.y, DEFAULT_ISO_CONFIG);
    const back = screenToGrid(screen.x, screen.y, DEFAULT_ISO_CONFIG);
    assert.ok(Math.abs(back.x - sample.x) < 0.0001);
    assert.ok(Math.abs(back.y - sample.y) < 0.0001);
  }
});

test('footprint center projects to the center of a tile', () => {
  const center = getFootprintCenter(4, 7, DEFAULT_ISO_CONFIG);
  const expected = gridToScreen(4.5, 7.5, DEFAULT_ISO_CONFIG);
  assert.deepEqual(center, expected);
});

test('depth sort favors lower isometric rows', () => {
  const northTile = getDepthSortKey(2, 2);
  const southTile = getDepthSortKey(2, 3);
  assert.ok(southTile > northTile);
});

test('projected bounds produce positive map extents', () => {
  const bounds = getProjectedMapBounds(40, 30, DEFAULT_ISO_CONFIG);
  assert.ok(bounds.width > 0);
  assert.ok(bounds.height > 0);
  assert.ok(bounds.minX < bounds.maxX);
  assert.ok(bounds.minY < bounds.maxY);
});
