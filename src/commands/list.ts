import { resolve } from "node:path";

import * as prompts from "@clack/prompts";

import { ChangeCategory, ConfigFile } from "../config-file";
import { PICCO_DIR } from "../constants";
import { Lockfile } from "../lockfile";
import { Piccolog } from "../parser";
import {
	buildChangelog,
	formatPiccologSummary,
	gatherPiccologs,
	highlight,
	intro,
	outro,
} from "./common";

function getCategoriesToLog(
	allCategories: Set<ChangeCategory["key"]>,
	requestedCategories: Set<string>,
): ChangeCategory["key"][] {
	const unknownCategories = requestedCategories.difference(allCategories);
	const knownCategories = requestedCategories.intersection(allCategories);

	if (unknownCategories.size > 0) {
		const stringifyCategories = (categories: Set<string>) =>
			[...categories].map((category) => `"${category}"`).join(", ");
		const categoryPluralized = unknownCategories.size > 1 ? "categories" : "category";

		prompts.log.warn(
			highlight(
				`Ignoring unknown ${categoryPluralized} ${stringifyCategories(unknownCategories)}\n`,
				"warning",
			) + `Valid categories are: ${stringifyCategories(allCategories)}`,
		);
	}

	return knownCategories.size === 0 ? [...allCategories] : [...knownCategories];
}

/**
 * @param cwd Current working directory
 * @param categories List of categories to include into the logged output
 */
export async function list(cwd: string, categories: string[]) {
	intro("list");

	const piccoPath = resolve(cwd, PICCO_DIR);
	const configFile = await ConfigFile.readFromFile(piccoPath);
	await using lockfile = await Lockfile.readFromFile(piccoPath);

	const categoriesToLog = getCategoriesToLog(
		new Set(configFile.categories.map(({ key }) => key)),
		new Set(categories),
	);

	const piccologs = await gatherPiccologs({
		piccoPath,
		categories: configFile.categories,
		selectedCategories: categoriesToLog,
	});

	if (!piccologs) {
		return;
	}

	const changelog = buildChangelog(configFile.categories, piccologs, {
		formatChangelogHeading: () => "",
		formatCategoryHeading: ({ name }) => highlight(`${name}\n`),
		formatChange: ({ name, category, summary, pullRequest, duplicates, isBreaking }) => {
			const allNames = [name, ...duplicates.map(({ name }) => name)];
			const components: string[] = [];
			let isActionable = false;

			if (!allNames.every((name) => lockfile.knownLogs.includes(name))) {
				components.push(
					isBreaking
						? highlight("BREAKING", "breakingChange")
						: highlight("NEW", "newLog"),
				);
				isActionable = true;
			} else if (
				category === "migration" &&
				!allNames.every((name) => lockfile.appliedMigrations.includes(name))
			) {
				components.push(highlight("APPLY", "migration"));
				isActionable = true;
			} else if (isBreaking) {
				components.push("BREAKING");
			}

			components.push(formatPiccologSummary(summary), pullRequest ? `(#${pullRequest})` : "");

			const text = `• ${components.filter(Boolean).join(" ")}`;

			return isActionable ? text : highlight(text, "subtle");
		},
	});

	prompts.log.info(changelog.trim() || "Nothing to show!");

	outro();

	lockfile.addToKnownLogs(
		(Object.values(piccologs).flat() as Piccolog[]).map(({ name }) => name),
	);
}
