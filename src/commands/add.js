import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { exit } from "node:process";
import { intro, outro, isCancel, cancel, select, text } from "@clack/prompts";
import { humanId } from "human-id";
import pc from "picocolors";

import { CATEGORIES_PLACEHOLDERS, CHANGE_CATEGORIES, PICCO_DIR } from "../constants.js";

function onCancel() {
    cancel("Have a nice day!");
    exit(0);
}

function generateLogId() {
    return humanId({ separator: "-", capitalize: false, addAdverb: true });
}

/**
 * @param {keyof typeof CHANGE_CATEGORIES} category
 * @param {string} summary
 */
function generateLogContent(category, summary) {
    return `---
category: ${category}
---

${summary}`;
}

/**
 * @param {string} cwd Current working directory
 */
export async function add(cwd) {
    const piccoPath = resolve(cwd, PICCO_DIR);

    intro(pc.bgCyan(pc.black(` picco add `)));

    /** @type {keyof typeof CHANGE_CATEGORIES} */
    const category = await select({
        message: `What ${pc.green(pc.bold("type"))} is your change?`,
        options: Object.entries(CHANGE_CATEGORIES).map(([id, label]) => ({ value: id, label })),
    });

    if (isCancel(category)) {
        return onCancel();
    }

    const summary = await text({
        message: `Please enter a ${pc.green(pc.bold("summary"))} of your change`,
        placeholder: CATEGORIES_PLACEHOLDERS[category],
        validate(value) {
            if (value.length === 0) {
                return `Please enter a ${pc.red(pc.bold("summary"))}!`;
            }

            if (!["migration", "other"].includes(category) && !/\(#[0-9]+\)/.test(value)) {
                return `Please provide a PR number! (#42)`;
            }
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

    const logContent = generateLogContent(category, summary);

    await writeFile(resolve(piccoPath, `${logId}.md`), logContent);

    outro(`Piccolog added! ${pc.underline(pc.cyan(`${PICCO_DIR}/${logId}.md`))}`);
}
