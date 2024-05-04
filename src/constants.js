import pc from "picocolors";

export const PICCO_DIR = ".piccologs";

export const CHANGE_CATEGORIES = {
    feature: "Features",
    bugfix: "Bug Fixes",
    refactor: "Refactoring",
    performance: "Performance Improvements",
    update: "Dependency Updates",
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
    update: "⬆️",
    removal: "🔥",
    migration: "🏗",
    documentation: "📝",
    other: "💡",
};

export const CATEGORIES_PLACEHOLDERS = {
    feature: "Implement a breathtaking, world-changing feature (#42069)",
    bugfix: "Fix the most complicated bug so far (#42069)",
    refactor: "Refactor code from 5 years ago (#42069)",
    performance: `Improve code to be ${pc.italic("blazingly fast")} (#42069)`,
    update: "Update Jest from v13.0.7 -> v69.4.20 (#42069)",
    removal: "Remove unused code from existence (#42069)",
    migration: "Run `rm -rf /`",
    documentation: "Add comment to remind my future-self what this code does (#42069)",
    other: "¯\\_(ツ)_/¯",
};
