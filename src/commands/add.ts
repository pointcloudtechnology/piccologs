import { existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { exit } from "node:process";

import { intro, outro, isCancel, cancel, text, autocomplete } from "@clack/prompts";
import { humanId } from "human-id";
import pc from "picocolors";

import { CHANGE_CATEGORIES, type ChangeCategory, PICCO_DIR } from "../constants";

function onCancel() {
	cancel("Have a nice day!");
	exit(0);
}

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
${frontmatterEntries.join('\n')}
---

${summary}
`;
}

/**
 * @param cwd Current working directory
 */
export async function add(cwd: string) {
	const piccoPath = resolve(cwd, PICCO_DIR);

	intro(pc.bgCyan(pc.black(` picco add `)));

	const categoryKey = await autocomplete<ChangeCategory["key"]>({
		message: `What ${pc.green(pc.bold("type"))} is your change?`,
		options: CHANGE_CATEGORIES.map(({ key, name }) => ({ value: key, label: name })),
	});

	if (isCancel(categoryKey)) {
		return onCancel();
	}

	const chosenCategory = CHANGE_CATEGORIES.find(({ key }) => key === categoryKey)!;

	const summary = await text({
		message: `Please enter a ${pc.green(pc.bold("summary"))} of your change (use | as line separators)`,
		placeholder: chosenCategory.placeholder,
		validate(value) {
			if (!value) {
				return `Please enter a ${pc.red(pc.bold("summary"))}!`;
			}

			return undefined;
		},
	});

	if (isCancel(summary)) {
		return onCancel();
	}

	let pullRequest: number | undefined;

	if (chosenCategory.pullRequest !== "none") {
		const num = await text({
			message: `Please enter a ${pc.green(pc.bold("PR"))} number${chosenCategory.pullRequest === "optional" ? " (optional)" : ""}`,
			validate(value) {
				if (!value) {
					if (chosenCategory.pullRequest === "required") {
						return `Please enter a ${pc.red(pc.bold("PR"))} number!`;
					}

					return undefined;
				}

				const num = parseInt(value);

				if (!Number.isInteger(num)) {
					return `Please enter an ${pc.red(pc.bold("integer"))} number!`;
				}

				return undefined;
			},
		});

		if (isCancel(num)) {
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

	outro(`Piccolog added! ${pc.underline(pc.cyan(`${PICCO_DIR}/${logId}.md`))}`);
}
