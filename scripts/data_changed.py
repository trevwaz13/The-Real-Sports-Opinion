"""Decide whether a data refresh actually changed anything worth committing.

season.json carries an `updatedAt` timestamp that moves on every run, so a
plain `git diff` is always dirty even during a bye week or the offseason. If
that timestamp is the only difference, revert it and report no change.

Prints "yes" or "no"; used by .github/workflows/refresh-data.yml.
"""

import json
import subprocess

DATA_DIR = "src/data/real/"
SEASON_FILE = DATA_DIR + "season.json"


def git(*args):
    return subprocess.run(
        ["git", *args], capture_output=True, text=True, check=True
    ).stdout


def main():
    changed = git("diff", "--name-only", "--", DATA_DIR).split()
    if not changed:
        return "no"

    others = [f for f in changed if f != SEASON_FILE]
    if others:
        return "yes"

    # Only season.json moved: is it more than the timestamp?
    old = json.loads(git("show", f"HEAD:{SEASON_FILE}"))
    with open(SEASON_FILE) as f:
        new = json.load(f)
    old.pop("updatedAt", None)
    new.pop("updatedAt", None)
    if old == new:
        git("checkout", "--", SEASON_FILE)
        return "no"
    return "yes"


if __name__ == "__main__":
    print(main())
