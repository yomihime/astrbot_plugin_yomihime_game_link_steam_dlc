"""Delegate the two-plugin smoke check to a chosen Core checkout."""

import argparse
import subprocess
import sys
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--core-root", required=True, type=Path)
    parser.add_argument("--host-source", required=True, type=Path)
    parser.add_argument("--core-zip", required=True, type=Path)
    parser.add_argument("--dlc-zip", required=True, type=Path)
    parser.add_argument("--work-root", required=True, type=Path)
    parser.add_argument("--font", type=Path)
    parser.add_argument("--test-signing-key", type=Path)
    args = parser.parse_args()

    harness = args.core_root / "scripts/smoke_hot_update_host.py"
    if not harness.is_file():
        parser.error("--core-root must contain scripts/smoke_hot_update_host.py")

    command = [
        sys.executable,
        "-B",
        str(harness.resolve()),
        "--host-source",
        str(args.host_source),
        "--plugin-zip",
        str(args.core_zip),
        "--dlc-zip",
        str(args.dlc_zip),
        "--work-root",
        str(args.work_root),
    ]
    if args.font is not None:
        command.extend(("--font", str(args.font)))
    if args.test_signing_key is not None:
        command.extend(("--test-signing-key", str(args.test_signing_key)))
    return subprocess.run(command, check=False).returncode


if __name__ == "__main__":
    sys.exit(main())
