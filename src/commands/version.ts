import { open, copyFile, rm } from "node:fs/promises";
import { resolve } from "node:path";

import * as prompts from "@clack/prompts";

import { ConfigFile } from "../config-file";
import { CHANGELOG_FILE_NAME, PICCO_DIR } from "../constants";
import { Lockfile } from "../lockfile";
import {
	buildChangelog,
	gatherPiccologs,
	getAllPiccologPaths,
	highlight,
	hyperlink,
	intro,
	onCancel,
	outro,
} from "./common";

function getDateVersion(): string {
	const now = new Date();
	const year = now.getFullYear();
	const month = (now.getMonth() + 1).toString().padStart(2, "0");
	const day = now.getDate().toString().padStart(2, "0");

	return `${year}-${month}-${day}`;
}

async function writeChangeLog(cwd: string, releaseLog: string) {
	const changelogPath = resolve(cwd, CHANGELOG_FILE_NAME);
	const tempPath = resolve(cwd, `_${CHANGELOG_FILE_NAME}.temp`);
	const insertMarker = /## \[.+\]/;
	let isReleaseLogWritten = false;

	const changelog = await open(changelogPath);
	const tempLog = await open(tempPath, "w");
	const tempWriter = tempLog.createWriteStream({ encoding: "utf8" });

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
	await tempLog.close();

	await copyFile(tempPath, changelogPath);
	await rm(tempPath);
}

function promptVersion() {
	const defaultVersion = getDateVersion();

	return prompts.text({
		message: `What should be the next version?`,
		defaultValue: defaultVersion,
		placeholder: defaultVersion,
	});
}

/**
 * @param cwd Current working directory
 */
export async function version(cwd: string) {
	intro("version");

	const piccoPath = resolve(cwd, PICCO_DIR);
	const piccologNames = await getAllPiccologPaths(piccoPath);
	const configFile = await ConfigFile.readFromFile(piccoPath);
	await using lockfile = await Lockfile.readFromFile(piccoPath);

	if (piccologNames.length === 0) {
		prompts.log.warn("No piccologs found, skipping changelog generation");
		outro();
		return;
	}

	const versionTag = await promptVersion();

	if (prompts.isCancel(versionTag)) {
		return onCancel();
	}

	const piccologs = await gatherPiccologs({ piccoPath, categories: configFile.categories });

	if (!piccologs) {
		return;
	}

	const spin = prompts.spinner();

	spin.start(`Writing to ${CHANGELOG_FILE_NAME}`);

	const changelog = buildChangelog(configFile.categories, piccologs, {
		formatChangelogHeading: () => `## [${versionTag}]\n\n`,
		formatCategoryHeading: ({ icon, name }) =>
			icon ? `### ${icon} ${name}\n\n` : `### ${name}\n\n`,
		formatChange: ({ summary, pullRequest }) =>
			`- ${summary + (pullRequest ? ` (#${pullRequest})` : "")}`,
	});

	await writeChangeLog(cwd, changelog);

	for (const logName of piccologNames) {
		await rm(resolve(piccoPath, logName));
	}

	spin.clear();

	outro(`Release [${highlight(versionTag)}] written to ${hyperlink(CHANGELOG_FILE_NAME)}!`);

	lockfile.clearAllLogs();
}
