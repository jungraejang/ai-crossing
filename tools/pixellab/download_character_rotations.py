#!/usr/bin/env python3

from __future__ import annotations

import io
import pathlib
import ssl
import sys
import urllib.request
import zipfile


def main() -> int:
    if len(sys.argv) != 3:
        print("usage: download_character_rotations.py <zip_url> <output_dir>", file=sys.stderr)
        return 1

    zip_url = sys.argv[1]
    output_dir = pathlib.Path(sys.argv[2])
    output_dir.mkdir(parents=True, exist_ok=True)

    ssl_context = ssl._create_unverified_context()
    with urllib.request.urlopen(zip_url, context=ssl_context) as response:
        payload = response.read()

    with zipfile.ZipFile(io.BytesIO(payload)) as archive:
        extracted_count = 0
        for member in archive.infolist():
            if member.is_dir():
                continue
            if 'rotations/' not in member.filename or not member.filename.endswith('.png'):
                continue

            direction_name = pathlib.Path(member.filename).stem.replace('-', '_')
            target_path = output_dir / f'{direction_name}.png'
            with archive.open(member) as source, target_path.open('wb') as destination:
                destination.write(source.read())
            extracted_count += 1

    if extracted_count == 0:
        print('no rotation PNGs found in character archive', file=sys.stderr)
        return 1

    return 0


if __name__ == '__main__':
    raise SystemExit(main())
