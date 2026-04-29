import pc from "picocolors";

import type { Prettify } from "./utility";

export const PICCO_DIR = ".piccologs";

type ChangeCategoryDefinition = {
	key: string;
	name: string;
	icon: string;
	placeholder: string;
};

type ChangeCategories<T extends ChangeCategoryDefinition[]> = ReadonlyArray<
	Prettify<{ readonly key: T[number]["key"] } & Readonly<Omit<ChangeCategoryDefinition, "key">>>
> & {};

const defineChangeCategories = <const T extends ChangeCategoryDefinition[]>(
	categories: T,
): ChangeCategories<T> => categories as ChangeCategories<T>;

export const CHANGE_CATEGORIES = defineChangeCategories([
	{
		key: "feature",
		name: "Features",
		icon: "✨",
		placeholder: "Implement a breathtaking, world-changing feature (#42)",
	},
	{
		key: "bugfix",
		name: "Bug Fixes",
		icon: "🐛",
		placeholder: "Fix the most complicated bug so far (#69)",
	},
	{
		key: "ui",
		name: "UI Changes",
		icon: "🖼️",
		placeholder: "Cast some CSS magic spells (#314)",
	},
	{
		key: "api",
		name: "API Changes",
		icon: "🔌",
		placeholder: "Change route to return status code 418 (#9001)",
	},
	{
		key: "performance",
		name: "Performance Improvements",
		icon: "⚡️",
		placeholder: `Improve code to be ${pc.italic("blazingly fast")} (#42069)`,
	},
	{
		key: "removal",
		name: "Removals",
		icon: "🔥",
		placeholder: "Remove unused code from existence (#1337)",
	},
	{
		key: "refactor",
		name: "Refactoring",
		icon: "♻️",
		placeholder: "Refactor code from 5 years ago (#420)",
	},
	{
		key: "dependencies",
		name: "Dependencies",
		icon: "📦️",
		placeholder: "Update Jest from v13.0.7 -> v69.4.20 (#69420)",
	},
	{
		key: "documentation",
		name: "Documentation",
		icon: "📝",
		placeholder: "Add comment to remind my future-self what this code does (#7353)",
	},
	{
		key: "other",
		name: "Other",
		icon: "💡",
		placeholder: "¯\\_(ツ)_/¯",
	},
	{
		key: "migration",
		name: "Migration Steps",
		icon: "🏗",
		placeholder: "Run `rm -rf /`",
	},
]);

export type ChangeCategory = (typeof CHANGE_CATEGORIES)[number];
