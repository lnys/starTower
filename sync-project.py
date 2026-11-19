#!/usr/bin/env python3
"""Copy explicitly named workspace files into the Skill source snapshot."""
import argparse
from hashlib import sha256
from pathlib import Path
from shutil import copyfile


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('paths', nargs='+', help='Project-root-relative files to sync')
    args = parser.parse_args()

    skill = Path(__file__).resolve().parent
    workspace = skill.parent
    snapshot = skill / 'project'
    manifest = skill / 'MANIFEST.sha256'
    entries = {name: digest for digest, name in
               (line.split('  ', 1) for line in manifest.read_text(encoding='utf-8').splitlines())}

    paths = {Path(name) for name in args.paths}
    for path in paths:
        source = workspace / path
        if (path.is_absolute() or '..' in path.parts or len(path.parts) == 0
                or path.parts[0] == 'skills' or '\n' in path.as_posix()
                or '\\' in path.as_posix() or not source.is_file()
                or not source.resolve().is_relative_to(workspace)
                or not (snapshot / path).resolve().is_relative_to(snapshot)):
            parser.error(f'not a workspace source file: {path}')

    for path in paths:
        target = snapshot / path
        target.parent.mkdir(parents=True, exist_ok=True)
        copyfile(workspace / path, target)
        entries[path.as_posix()] = sha256(target.read_bytes()).hexdigest()

    manifest.write_text(''.join(f'{entries[name]}  {name}\n' for name in
                                sorted(entries, key=lambda name: name.encode('utf-8'))), encoding='utf-8')
    print(f'Synced {len(paths)} file(s) into the Skill snapshot.')


if __name__ == '__main__':
    main()
