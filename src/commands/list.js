import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { exit } from "node:process";
import { intro, outro, log } from "@clack/prompts";
import pc from "picocolors";

import { CATEGORIES_ORDER, CHANGE_CATEGORIES, PICCO_DIR } from "../constants.js";
import { parsePiccoLog } from "../parser.js";

/**
 * @param {keyof typeof CHANGE_CATEGORIES} category
 * @param {Set<string>} changes
 * @returns {string}
 */
function buildLogCategory(category, changes) {
    if (changes.size === 0) {
        return "";
    }

    let categoryLog = pc.bold(pc.cyan(`${CHANGE_CATEGORIES[category]}\n`));

    for (const change of changes) {
        categoryLog += `• ${change}\n`;
    }

    categoryLog += "\n";

    return categoryLog;
}

/**
 * @param {Record<keyof typeof CHANGE_CATEGORIES, Set<string>>} changeLog
 * @returns {string}
 */
function buildLog(changeLog) {
    let finalLog = "";

    for (const category of CATEGORIES_ORDER) {
        if (category in changeLog) {
            finalLog += buildLogCategory(category, changeLog[category]);
        }
    }

    return finalLog;
}

/**
 * @param {string} cwd Current working directory
 * @param {string[]} categories List of categories to include into the logged output
 */
export async function list(cwd, categories) {
    const piccoPath = resolve(cwd, PICCO_DIR);
    const piccologs = (await readdir(piccoPath)).filter((fileName) => fileName.endsWith(".md"));

    if (piccologs.length === 0) {
        console.log("No piccologs found");
        exit(0);
    }

    intro(pc.bgCyan(pc.black(` picco list `)));

    const allCategories = Object.keys(CHANGE_CATEGORIES);
    const filteredCategories = categories.filter((category) => allCategories.includes(category));
    const categoriesToLog = filteredCategories.length > 0 ? filteredCategories : allCategories;

    /** @type {Record<keyof typeof CHANGE_CATEGORIES, Set<string>>} */
    const changeLog = Object.fromEntries(categoriesToLog.map((category) => [category, new Set()]));

    for (const logName of piccologs) {
        const logContents = await readFile(resolve(piccoPath, logName), { encoding: "utf8" });
        const { category, summary } = parsePiccoLog(logContents);

        if (!categoriesToLog.includes(category)) {
            continue;
        }

        for (const line of summary) {
            changeLog[category].add(line);
        }
    }

    log.message(buildLog(changeLog).trim() || "Nothing to show!");
    outro(pc.italic(pc.green(" Have a nice day! ")));
}
