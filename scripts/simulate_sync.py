#!/usr/bin/env python3
import os
import sys
import time


def main():
    # Target directory defaults to "sync_test" in the current directory if not specified
    target_dir = sys.argv[1] if len(sys.argv) > 1 else "sync_test"

    print(f"Creating test directory at: {target_dir}")
    os.makedirs(target_dir, exist_ok=True)

    num_notes = 200
    delay_sec = 0.1  # 100 ms

    print(f"Creating {num_notes} files with {int(delay_sec * 1000)}ms delay...")
    created_paths = []

    for i in range(1, num_notes + 1):
        filename = f"sync_note_{i}.md"
        filepath = os.path.join(target_dir, filename)

        content = f"""---
tags:
  - sync-test
---
# Sync Note {i}
This is the preview text for sync note {i}. It simulates a rapid file addition to check if the explorer view remains stable.
"""
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)

        created_paths.append(filepath)
        time.sleep(delay_sec)

    print("All files created. Pausing for 3 seconds to observe UI state...")
    time.sleep(3.0)

    print(f"Deleting {num_notes} files with {int(delay_sec * 1000)}ms delay...")
    for filepath in created_paths:
        if os.path.exists(filepath):
            os.remove(filepath)
        time.sleep(delay_sec)

    # Clean up directory if empty
    try:
        os.rmdir(target_dir)
        print("Cleaned up test directory.")
    except OSError:
        pass

    print("Done!")


if __name__ == "__main__":
    main()
