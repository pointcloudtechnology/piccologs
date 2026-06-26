import { existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import * as prompts from "@clack/prompts";
import { humanId } from "human-id";

import { ChangeCategories, ChangeCategory, ConfigFile } from "../config-file";
import { MIGRATION_KEY, PICCO_DIR } from "../constants";
import { Lockfile } from "../lockfile";
import { Piccolog } from "../parser";
import { highlight, hyperlink, intro, onCancel, outro } from "./common";

const SUMMARY_PRESET_OTHER = "other";

function generateLogId() {
	return humanId({ separator: "-", capitalize: false, addAdverb: true });
}

function generateLogContent(
	piccologData: Pick<Piccolog, "category" | "pullRequest" | "isBreaking"> & { summary: string },
) {
	const frontmatterEntries = [
		`category: ${piccologData.category}`,
		piccologData.pullRequest ? `pullRequest: ${piccologData.pullRequest}` : "",
		piccologData.isBreaking ? `isBreaking: ${piccologData.isBreaking}` : "",
		`createdAt: ${new Date().toISOString()}`,
	].filter((entry) => entry.length > 0);

	return `---
${frontmatterEntries.join("\n")}
---

${piccologData.summary}
`;
}

function promptCategory(categories: ChangeCategories) {
	return prompts.autocomplete<ChangeCategory["key"]>({
		message: `What ${highlight("category")} is your change?`,
		options: categories.map(({ key, name }) => ({ value: key, label: name })),
	});
}

function promptSummaryPreset(category: ChangeCategory & { presets: string[] }) {
	return prompts.select({
		message: `Please choose a ${highlight("summary")} of your change`,
		options: [
			...category.presets.map((preset) => ({ value: preset, label: preset })),
			{ value: SUMMARY_PRESET_OTHER, label: "Other" },
		],
	});
}

function promptSummary(category: ChangeCategory) {
	return prompts.text({
		message: `Please enter a ${highlight("summary")} of your change`,
		placeholder: category.placeholder ?? "",
		validate(value) {
			if (!value) {
				return "You have to enter a summary";
			}

			return undefined;
		},
	});
}

function promptPullRequest(category: ChangeCategory) {
	return prompts.text({
		message: `Please enter a ${highlight("PR")} number${category.pullRequest === "optional" ? " (optional)" : ""}`,
		validate(value) {
			if (!value) {
				if (category.pullRequest === "required") {
					return "You have to enter a PR number";
				}

				return undefined;
			}

			const num = parseInt(value);

			if (!Number.isInteger(num)) {
				return "You have to enter an integer number";
			}

			return undefined;
		},
	});
}

function promptIsBreaking() {
	return prompts.confirm({
		message: "Is this a breaking change?",
		initialValue: false,
	});
}

function hasPresets(category: ChangeCategory): category is ChangeCategory & { presets: string[] } {
	return category.presets !== undefined;
}

/**
 * @param cwd Current working directory
 */
export async function add(cwd: string) {
	intro("add");

	const piccoPath = resolve(cwd, PICCO_DIR);
	const configFile = await ConfigFile.readFromFile(piccoPath);
	await using lockfile = await Lockfile.readFromFile(piccoPath);

	const categoryKey = await promptCategory(configFile.categories);

	if (prompts.isCancel(categoryKey)) {
		onCancel();
	}

	const chosenCategory = configFile.categories.find(({ key }) => key === categoryKey)!;
	let summary: string | symbol | undefined;

	if (hasPresets(chosenCategory)) {
		summary = await promptSummaryPreset(chosenCategory);
	}

	if (summary === SUMMARY_PRESET_OTHER || summary === undefined) {
		summary = await promptSummary(chosenCategory);
	}

	if (prompts.isCancel(summary)) {
		onCancel();
	}

	let pullRequest: number | undefined;

	if (chosenCategory.pullRequest !== "none") {
		const num = await promptPullRequest(chosenCategory);

		if (prompts.isCancel(num)) {
			onCancel();
		}

		pullRequest = num ? parseInt(num) : undefined;
	}

	let isBreaking: boolean | undefined;

	if (chosenCategory.allowBreaking) {
		const breaking = await promptIsBreaking();

		if (prompts.isCancel(breaking)) {
			onCancel();
		}

		isBreaking = breaking;
	}

	let logId = generateLogId();

	// Handle the absolute unlikely case that the ID already exists
	while (existsSync(resolve(piccoPath, `${logId}.md`))) {
		logId = generateLogId();
	}

	const logFileName = `${logId}.md`;
	const logContent = generateLogContent({
		category: categoryKey,
		summary: summary.split("|").join("\n"),
		...(pullRequest !== undefined && { pullRequest }),
		...(isBreaking !== undefined && { isBreaking }),
	});

	await writeFile(resolve(piccoPath, logFileName), logContent);

	outro(`Piccolog ${hyperlink(`${PICCO_DIR}/${logFileName}`)} added!`);

	lockfile.addToKnownLogs([logFileName]);

	if (categoryKey === MIGRATION_KEY) {
		lockfile.addToAppliedMigrations([logFileName]);
	}
}
