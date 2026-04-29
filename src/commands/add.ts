import { existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { exit } from "node:process";

import { intro, outro, isCancel, cancel, select, text } from "@clack/prompts";
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

function generateLogContent(category: ChangeCategory["key"], summary: string) {
	return `---
category: ${category}
---

${summary}`;
}

/**
 * @param cwd Current working directory
 */
export async function add(cwd: string) {
	const piccoPath = resolve(cwd, PICCO_DIR);

	intro(pc.bgCyan(pc.black(` picco add `)));

	const category = await select<ChangeCategory["key"]>({
		message: `What ${pc.green(pc.bold("type"))} is your change?`,
		options: CHANGE_CATEGORIES.map(({ key, name }) => ({ value: key, label: name })),
	});

	if (isCancel(category)) {
		return onCancel();
	}

	const summary = await text({
		message: `Please enter a ${pc.green(pc.bold("summary"))} of your change (use | as line separators)`,
		placeholder: CHANGE_CATEGORIES.find(({ key }) => key === category)!.placeholder,
		validate(value) {
			if (!value?.length) {
				return `Please enter a ${pc.red(pc.bold("summary"))}!`;
			}

			if (!["migration", "other"].includes(category) && !/\(#[0-9]+\)/.test(value)) {
				return `Please provide a PR number! (#42)`;
			}

			return;
		},
	});

	if (isCancel(summary)) {
		return onCancel();
	}

	let logId = generateLogId();

	// Handle the absolute unlikely case that the ID already exists
	while (existsSync(resolve(piccoPath, `${logId}.md`))) {
		logId = generateLogId();
	}

	const logContent = generateLogContent(category, summary.split("|").join("\n"));

	await writeFile(resolve(piccoPath, `${logId}.md`), logContent);

	outro(`Piccolog added! ${pc.underline(pc.cyan(`${PICCO_DIR}/${logId}.md`))}`);
}
