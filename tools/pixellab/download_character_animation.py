#!/usr/bin/env python3

from __future__ import annotations

import io
import pathlib
import ssl
import sys
import urllib.request
import zipfile


def main() -> int:
    if len(sys.argv) != 4:
        print(
            "usage: download_character_animation.py <zip_url> <animation_name> <villager_output_dir>",
            file=sys.stderr,
        )
        return 1

    zip_url = sys.argv[1]
    animation_name = sys.argv[2]
    output_root = pathlib.Path(sys.argv[3]) / 'walk'
    output_root.mkdir(parents=True, exist_ok=True)

    ssl_context = ssl._create_unverified_context()
    with urllib.request.urlopen(zip_url, context=ssl_context) as response:
        payload = response.read()

    extracted_count = 0
    archive_prefix = f'animations/{animation_name}/'

    with zipfile.ZipFile(io.BytesIO(payload)) as archive:
        for member in archive.infolist():
            if member.is_dir():
                continue
            if not member.filename.startswith(archive_prefix):
                continue
            if not member.filename.endswith('.png'):
                continue

            relative = pathlib.Path(member.filename.removeprefix(archive_prefix))
            if len(relative.parts) != 2:
                continue

            direction_name = relative.parts[0].replace('-', '_')
            frame_name = relative.parts[1]
            target_dir = output_root / direction_name
            target_dir.mkdir(parents=True, exist_ok=True)
            target_path = target_dir / frame_name

            with archive.open(member) as source, target_path.open('wb') as destination:
                destination.write(source.read())
            extracted_count += 1

    if extracted_count == 0:
        print(f'no animation PNGs found for {animation_name}', file=sys.stderr)
        return 1

    return 0


if __name__ == '__main__':
    raise SystemExit(main())
