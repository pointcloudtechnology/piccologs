import { resolve } from "node:path";
import { styleText } from "node:util";

import * as prompts from "@clack/prompts";

import { PICCO_DIR } from "../constants";
import { Lockfile } from "../lockfile";
import { gatherPiccologs, getAllPiccologPaths, intro, outro } from "./common";

/**
 * @param cwd Current working directory
 * @param useJsonOutput Whether the information should be pretty-printed or printed as JSON
 */
export async function status(cwd: string, useJsonOutput: boolean) {
	const piccoPath = resolve(cwd, PICCO_DIR);
	const piccologNames = await getAllPiccologPaths(piccoPath);
	await using lockfile = await Lockfile.readFromFile(piccoPath);
	const piccologs = await gatherPiccologs({ piccoPath });

	if (!piccologs) {
		return;
	}

	const newPiccologs = new Set(piccologNames).difference(new Set(lockfile.knownLogs));
	const applicableMigrationNames = new Set(
		piccologs.migration?.map(({ name }) => name) ?? [],
	).difference(new Set(lockfile.appliedMigrations));

	if (useJsonOutput) {
		console.log(
			JSON.stringify({
				newLogs: newPiccologs.size,
				applicableMigrations: applicableMigrationNames.size,
			}),
		);
		return;
	}

	intro("status");

	let statusMessage = "";

	if (newPiccologs.size > 0) {
		statusMessage += `${styleText(["cyan", "bold"], newPiccologs.size + " new")} piccologs available`;
	}

	if (applicableMigrationNames.size > 0) {
		if (statusMessage.length > 0) {
			statusMessage += "\n";
		}

		statusMessage += `${styleText(["yellow", "bold"], applicableMigrationNames.size + " applicable")} migrations available`;
	}

	prompts.log.info(statusMessage || "Already up to date!");

	outro();
}
