import type { Prettify } from "./utility";

export const PICCO_DIR = ".piccologs";

type ChangeCategoryDefinition = {
	key: string;
	name: string;
	icon: string;
	placeholder: string;
	pullRequest: "required" | "optional" | "none";
	presets?: string[];
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
		placeholder: "Implement a breathtaking, world-changing feature",
		pullRequest: "required",
	},
	{
		key: "bugfix",
		name: "Bug Fixes",
		icon: "🐛",
		placeholder: "Fix the most complicated bug so far",
		pullRequest: "required",
	},
	{
		key: "ui",
		name: "UI Changes",
		icon: "🖼️",
		placeholder: "Cast some CSS magic spells",
		pullRequest: "required",
	},
	{
		key: "api",
		name: "API Changes",
		icon: "🔌",
		placeholder: "Change route to return status code 418",
		pullRequest: "required",
	},
	{
		key: "performance",
		name: "Performance Improvements",
		icon: "⚡️",
		placeholder: `Improve code to be "blazingly fast"™`,
		pullRequest: "required",
	},
	{
		key: "removal",
		name: "Removals",
		icon: "🔥",
		placeholder: "Remove unused code from existence",
		pullRequest: "required",
	},
	{
		key: "refactor",
		name: "Refactoring",
		icon: "♻️",
		placeholder: "Refactor code from 5 years ago",
		pullRequest: "required",
	},
	{
		key: "dependencies",
		name: "Dependencies",
		icon: "📦️",
		placeholder: "Update Jest from v13.0.7 -> v69.4.20",
		pullRequest: "required",
	},
	{
		key: "documentation",
		name: "Documentation",
		icon: "📝",
		placeholder: "Add comment to remind my future-self what this code does",
		pullRequest: "required",
	},
	{
		key: "other",
		name: "Other",
		icon: "💡",
		placeholder: "¯\\_(ツ)_/¯",
		pullRequest: "optional",
	},
	{
		key: "migration",
		name: "Migration Steps",
		icon: "🏗",
		placeholder: "Run `rm -rf /`",
		pullRequest: "none",
		presets: ["Run `composer install`.", "Run `php artisan migrate`.", "Run `pnpm install`."],
	},
]);

export type ChangeCategory = (typeof CHANGE_CATEGORIES)[number];
