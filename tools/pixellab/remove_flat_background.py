#!/usr/bin/env python3

from __future__ import annotations

from collections import deque
import pathlib
import sys

from PIL import Image


def within_tolerance(pixel: tuple[int, int, int, int], background: tuple[int, int, int, int], tolerance: int) -> bool:
    if pixel[3] == 0:
        return True
    return (
        abs(pixel[0] - background[0]) <= tolerance
        and abs(pixel[1] - background[1]) <= tolerance
        and abs(pixel[2] - background[2]) <= tolerance
    )


def strip_background(path: pathlib.Path, tolerance: int = 18) -> None:
    image = Image.open(path).convert('RGBA')
    pixels = image.load()
    width, height = image.size
    background = pixels[0, 0]

    queue: deque[tuple[int, int]] = deque()
    visited: set[tuple[int, int]] = set()

    for x in range(width):
        queue.append((x, 0))
        queue.append((x, height - 1))
    for y in range(height):
        queue.append((0, y))
        queue.append((width - 1, y))

    while queue:
        x, y = queue.popleft()
        if (x, y) in visited:
            continue
        visited.add((x, y))

        if not within_tolerance(pixels[x, y], background, tolerance):
            continue

        pixels[x, y] = (pixels[x, y][0], pixels[x, y][1], pixels[x, y][2], 0)

        if x > 0:
            queue.append((x - 1, y))
        if x < width - 1:
            queue.append((x + 1, y))
        if y > 0:
            queue.append((x, y - 1))
        if y < height - 1:
            queue.append((x, y + 1))

    image.save(path)


def main() -> int:
    if len(sys.argv) < 2:
        print('usage: remove_flat_background.py <png-path-or-dir> [<png-path-or-dir> ...]', file=sys.stderr)
        return 1

    for raw_path in sys.argv[1:]:
        path = pathlib.Path(raw_path)
        if path.is_dir():
            for png in sorted(path.glob('*.png')):
                strip_background(png)
        else:
            strip_background(path)

    return 0


if __name__ == '__main__':
    raise SystemExit(main())
