#!/usr/bin/env python3
import os
import shutil
import subprocess
import sys


def main() -> int:
    bun = shutil.which("bun")
    if not bun:
        print("bun is required but was not found in PATH.", file=sys.stderr)
        return 1

    repo_dir = os.path.dirname(os.path.abspath(__file__))
    env = os.environ.copy()
    env.setdefault("PORT", "4173")

    print(f"Starting Bundle Mirror on http://localhost:{env['PORT']}")
    process = subprocess.run(
        [bun, "run", "serve"],
        cwd=repo_dir,
        env=env,
    )
    return process.returncode


if __name__ == "__main__":
    raise SystemExit(main())
