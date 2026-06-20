import { resolve } from "node:path";

import * as prompts from "@clack/prompts";

import { ConfigFile } from "../config-file";
import { MIGRATION_KEY, PICCO_DIR } from "../constants";
import { Lockfile } from "../lockfile";
import { gatherPiccologs, getAllPiccologPaths, highlight, intro, outro } from "./common";

type StatusInfo = {
	newLogs: number;
	applicableMigrations?: number;
};

/**
 * @param cwd Current working directory
 * @param useJsonOutput Whether the information should be pretty-printed or printed as JSON
 */
export async function status(cwd: string, useJsonOutput: boolean) {
	if (!useJsonOutput) {
		intro("status");
	}

	const piccoPath = resolve(cwd, PICCO_DIR);
	const piccologNames = await getAllPiccologPaths(piccoPath);
	const configFile = await ConfigFile.readFromFile(piccoPath);
	await using lockfile = await Lockfile.readFromFile(piccoPath);
	const piccologs = await gatherPiccologs({ piccoPath, categories: configFile.categories });

	if (!piccologs) {
		return;
	}

	const newPiccologs = new Set(piccologNames).difference(new Set(lockfile.knownLogs));
	const statusInfo: StatusInfo = {
		newLogs: newPiccologs.size,
	};

	if (piccologs[MIGRATION_KEY]) {
		const applicableMigrationNames = new Set(
			piccologs[MIGRATION_KEY]!.map(({ name }) => name),
		).difference(new Set(lockfile.appliedMigrations));

		statusInfo.applicableMigrations = applicableMigrationNames.size;
	}

	if (useJsonOutput) {
		console.log(JSON.stringify(statusInfo));
		return;
	}

	let statusMessage = "";

	if (statusInfo.newLogs > 0) {
		statusMessage += `${highlight(statusInfo.newLogs + " new", "newLog")} piccologs available`;
	}

	if (statusInfo.applicableMigrations) {
		if (statusMessage.length > 0) {
			statusMessage += "\n";
		}

		statusMessage += `${highlight(statusInfo.applicableMigrations + " applicable", "migration")} migrations available`;
	}

	prompts.log.info(statusMessage || "You are up to date!");

	outro();
}
