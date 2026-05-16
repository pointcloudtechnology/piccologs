import { resolve } from "node:path";
import { styleText } from "node:util";

import * as prompts from "@clack/prompts";

import { CHANGE_CATEGORIES, type ChangeCategory, PICCO_DIR } from "../constants";
import { buildChangelog, gatherPiccologs, highlight, intro, outro } from "./common";

function getCategoriesToLog(requestedCategories: Set<string>): ChangeCategory["key"][] {
	const allCategories = new Set(CHANGE_CATEGORIES.map(({ key }) => key));

	const unknownCategories = requestedCategories.difference(allCategories);
	const knownCategories = requestedCategories.intersection(allCategories);

	if (unknownCategories.size > 0) {
		const stringifyCategories = (categories: Set<string>) =>
			[...categories].map((category) => `"${category}"`).join(", ");
		const categoryPluralized = unknownCategories.size > 1 ? "categories" : "category";

		prompts.log.warn(
			styleText(
				"yellow",
				`Ignoring unknown ${categoryPluralized} ${stringifyCategories(unknownCategories)}\n`,
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
	const piccoPath = resolve(cwd, PICCO_DIR);

	intro("list");

	const categoriesToLog = getCategoriesToLog(new Set(categories));

	const piccologs = await gatherPiccologs({
		piccoPath,
		categories: categoriesToLog,
	});

	if (!piccologs) {
		return;
	}

	const changelog = buildChangelog(piccologs, {
		formatChangelogHeading: () => "",
		formatCategoryHeading: ({ name }) => highlight(`${name}\n`),
		formatChange: ({ summary, pullRequest }) =>
			`• ${summary + (pullRequest ? ` (#${pullRequest})` : "")}`,
	});

	prompts.log.info(changelog.trim() || "Nothing to show!");

	outro();
}
