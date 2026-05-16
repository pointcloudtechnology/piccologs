import { existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import * as prompts from "@clack/prompts";
import { humanId } from "human-id";

import { CHANGE_CATEGORIES, type ChangeCategory, PICCO_DIR } from "../constants";
import { highlight, hyperlink, intro, onCancel, outro } from "./common";

function generateLogId() {
	return humanId({ separator: "-", capitalize: false, addAdverb: true });
}

function generateLogContent(
	category: ChangeCategory["key"],
	summary: string,
	pullRequest: number | undefined,
) {
	const frontmatterEntries = [
		`category: ${category}`,
		pullRequest ? `pullRequest: ${pullRequest}` : "",
		`createdAt: ${new Date().toISOString()}`,
	].filter((entry) => entry.length > 0);

	return `---
${frontmatterEntries.join("\n")}
---

${summary}
`;
}

function promptCategory() {
	return prompts.autocomplete<ChangeCategory["key"]>({
		message: `What ${highlight("category")} is your change?`,
		options: CHANGE_CATEGORIES.map(({ key, name }) => ({ value: key, label: name })),
	});
}

function promptSummary(category: ChangeCategory) {
	return prompts.text({
		message: `Please enter a ${highlight("summary")} of your change`,
		placeholder: category.placeholder,
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

/**
 * @param cwd Current working directory
 */
export async function add(cwd: string) {
	const piccoPath = resolve(cwd, PICCO_DIR);

	intro("add");

	const categoryKey = await promptCategory();

	if (prompts.isCancel(categoryKey)) {
		return onCancel();
	}

	const chosenCategory = CHANGE_CATEGORIES.find(({ key }) => key === categoryKey)!;

	const summary = await promptSummary(chosenCategory);

	if (prompts.isCancel(summary)) {
		return onCancel();
	}

	let pullRequest: number | undefined;

	if (chosenCategory.pullRequest !== "none") {
		const num = await promptPullRequest(chosenCategory);

		if (prompts.isCancel(num)) {
			return onCancel();
		}

		pullRequest = num ? parseInt(num) : undefined;
	}

	let logId = generateLogId();

	// Handle the absolute unlikely case that the ID already exists
	while (existsSync(resolve(piccoPath, `${logId}.md`))) {
		logId = generateLogId();
	}

	const logContent = generateLogContent(categoryKey, summary.split("|").join("\n"), pullRequest);

	await writeFile(resolve(piccoPath, `${logId}.md`), logContent);

	outro(`Piccolog ${hyperlink(`${PICCO_DIR}/${logId}.md`)} added!`);
}
