---
category: refactor
createdAt: 2026-05-16T15:10:35.782Z
---

- Clean up all commands:
    - Extract common logic into own module
    - Deduplicate similar logic in `list` and `version` commands
    - Improve wording and coloring in prompts
    - Replace `picocolors` with Node-native `styleText` utility
