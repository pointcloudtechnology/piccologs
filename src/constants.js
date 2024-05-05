import pc from "picocolors";

export const PICCO_DIR = ".piccologs";

export const CHANGE_CATEGORIES = {
    feature: "Features",
    bugfix: "Bug Fixes",
    refactor: "Refactoring",
    performance: "Performance Improvements",
    dependencies: "Dependencies",
    removal: "Removals",
    migration: "Migration Steps",
    documentation: "Documentation",
    other: "Other",
};

export const CATEGORIES_ICONS = {
    feature: "✨",
    bugfix: "🐛",
    refactor: "♻️",
    performance: "⚡️",
    dependencies: "📦️",
    removal: "🔥",
    migration: "🏗",
    documentation: "📝",
    other: "💡",
};

export const CATEGORIES_PLACEHOLDERS = {
    feature: "Implement a breathtaking, world-changing feature (#42)",
    bugfix: "Fix the most complicated bug so far (#69)",
    refactor: "Refactor code from 5 years ago (#420)",
    performance: `Improve code to be ${pc.italic("blazingly fast")} (#42069)`,
    dependencies: "Update Jest from v13.0.7 -> v69.4.20 (#69420)",
    removal: "Remove unused code from existence (#1337)",
    migration: "Run `rm -rf /`",
    documentation: "Add comment to remind my future-self what this code does (#7353)",
    other: "¯\\_(ツ)_/¯",
};

/** @type {(keyof typeof CHANGE_CATEGORIES)[]} */
export const CATEGORIES_ORDER = [
    "feature",
    "bugfix",
    "performance",
    "removal",
    "refactor",
    "dependencies",
    "documentation",
    "other",
    "migration",
];
