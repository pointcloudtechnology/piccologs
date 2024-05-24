import { readdir, readFile, open, copyFile, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { exit } from "node:process";
import { intro, outro, isCancel, cancel, multiselect, text, spinner } from "@clack/prompts";
import pc from "picocolors";

import { CATEGORIES_ICONS, CATEGORIES_ORDER, CHANGE_CATEGORIES, PICCO_DIR } from "../constants.js";
import { parsePiccoLog } from "../parser.js";

function onCancel() {
    cancel("Have a nice day!");
    exit(0);
}

/** @returns {string} */
function getDateVersion() {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    const day = now.getDate().toString().padStart(2, "0");

    return `${year}-${month}-${day}`;
}

/**
 * @param {keyof typeof CHANGE_CATEGORIES} category
 * @param {Set<string>} changes
 * @returns {string}
 */
function buildReleaseCategory(category, changes) {
    if (changes.size === 0) {
        return "";
    }

    let categoryLog = `### ${CATEGORIES_ICONS[category]} ${CHANGE_CATEGORIES[category]}\n\n`;

    for (const change of changes) {
        categoryLog += `* ${change}\n`;
    }

    categoryLog += "\n";

    return categoryLog;
}

/**
 * @param {string} versionTag
 * @param {Record<keyof typeof CHANGE_CATEGORIES, Set<string>>} releaseLog
 * @returns {string}
 */
function buildReleaseLog(versionTag, releaseLog) {
    let finalReleaseLog = `## [${versionTag}]\n\n`;

    for (const category of CATEGORIES_ORDER) {
        finalReleaseLog += buildReleaseCategory(category, releaseLog[category]);
    }

    return finalReleaseLog;
}

/**
 * @param {string} cwd
 * @param {string} releaseLog
 */
async function writeChangeLog(cwd, releaseLog) {
    const changelogPath = resolve(cwd, "CHANGELOG.md");
    const tempPath = resolve(cwd, "_CHANGELOG.md.temp");
    const insertMarker = /## \[.+\]/;
    let isReleaseLogWritten = false;

    const changelog = await open(changelogPath);
    const templog = await open(tempPath, "w");
    const tempWriter = templog.createWriteStream({ encoding: "utf8" });

    for await (const line of changelog.readLines()) {
        if (!isReleaseLogWritten && insertMarker.test(line)) {
            tempWriter.write(releaseLog);
            tempWriter.write("\n");
            isReleaseLogWritten = true;
        }

        tempWriter.write(line + "\n");
    }

    tempWriter.close();
    await changelog.close();
    await templog.close();

    await copyFile(tempPath, changelogPath);
    await rm(tempPath);
}

/**
 * @param {string} cwd Current working directory
 */
export async function version(cwd) {
    const piccoPath = resolve(cwd, PICCO_DIR);
    const piccologs = (await readdir(piccoPath)).filter((fileName) => fileName.endsWith(".md"));

    if (piccologs.length === 0) {
        console.log("No piccologs found; skip version");
        exit(0);
    }

    intro(pc.bgCyan(pc.black(` picco version `)));

    const defaultVersion = getDateVersion();

    const versionTag = await text({
        message: `What should be the next version?`,
        defaultValue: defaultVersion,
        placeholder: defaultVersion,
    });

    if (isCancel(versionTag)) {
        return onCancel();
    }

    /** @type {Record<keyof typeof CHANGE_CATEGORIES, Set<string>>} */
    const releaseLog = Object.fromEntries(Object.keys(CHANGE_CATEGORIES).map((category) => [category, new Set()]));

    for (const logName of piccologs) {
        const logContents = await readFile(resolve(piccoPath, logName), { encoding: "utf8" });
        const { category, summary } = parsePiccoLog(logContents);

        for (const line of summary) {
            releaseLog[category].add(line);
        }
    }

    if (releaseLog.migration.size > 0) {
        const rawMigrationSteps = [...releaseLog.migration.values()];

        const migrationSteps = await multiselect({
            message: `Some migration steps might be duplicate. Please deselect any steps that should be removed from final changelog.`,
            options: rawMigrationSteps.map((step, index) => ({ value: index, label: step })),
            initialValues: rawMigrationSteps.map((_, index) => index),
        });

        if (isCancel(migrationSteps)) {
            return onCancel();
        }

        releaseLog.migration = new Set(rawMigrationSteps.filter((_, index) => migrationSteps.includes(index)));
    }

    const spin = spinner();

    spin.start("Writing to CHANGELOG.md");

    const finalReleaseLog = buildReleaseLog(versionTag, releaseLog);

    await writeChangeLog(cwd, finalReleaseLog);

    for (const logName of piccologs) {
        await rm(resolve(piccoPath, logName));
    }

    spin.stop("Written to CHANGELOG.md");

    outro(`Release [${pc.red(pc.bold(versionTag))}] written to ${pc.underline(pc.cyan(`CHANGELOG.md`))}!`);
}
