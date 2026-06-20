import { resolve } from "node:path";
import { setTimeout } from "node:timers/promises";
import { styleText } from "node:util";

import * as prompts from "@clack/prompts";
import { regex } from "arktype";
import { x } from "tinyexec";

import { tokenizeArgs } from "../args-tokenizer";
import { ConfigFile } from "../config-file";
import { MIGRATION_KEY, PICCO_DIR } from "../constants";
import { Lockfile } from "../lockfile";
import {
	deduplicatePiccologsByPresets,
	formatPiccologSummary,
	gatherPiccologs,
	highlight,
	intro,
	onCancel,
	outro,
} from "./common";

type ApplyAction = "mark-as-applied" | "skip";

type CommandAction = "run" | ApplyAction;

function getRunnableCommands(piccologSummary: string): string[] {
	const command = regex("run\\s`(?<command>.*?)`", "gim");
	const matches = piccologSummary.matchAll(command);

	return Array.from(matches.map(({ groups }) => groups!["command"]!));
}

function promptConfirmApply(message: string) {
	return prompts.select<ApplyAction>({
		message,
		options: [
			{ value: "mark-as-applied", label: "Mark as applied" },
			{ value: "skip", label: "Skip this migration" },
		],
		initialValue: "mark-as-applied",
	});
}

function promptRunCommand(command: string) {
	return prompts.select<CommandAction>({
		message: `Run ${highlight(command)}?`,
		options: [
			{ value: "run", label: "Yes, run command" },
			{ value: "mark-as-applied", label: "No, but mark as applied" },
			{ value: "skip", label: "No, skip this command" },
		],
		initialValue: "run",
	});
}

async function runCommand(command: string) {
	const log = prompts.taskLog({
		title: `Running ${command}...`,
		limit: 10,
	});
	const [exe, ...args] = tokenizeArgs(command);

	if (!exe) {
		return false;
	}

	const proc = x(exe, args);
	let outputLineCount = 0;

	for await (const line of proc) {
		log.message(line);
		outputLineCount++;
	}

	if (proc.exitCode !== 0) {
		if (outputLineCount > 0) {
			// Retain the output for some amount of time, such that the user can skim the error
			// message before it's gone.
			await setTimeout(5000);
		}

		log.error(styleText(["red"], `Command ${highlight(command)} failed`));

		return false;
	}

	if (outputLineCount > 0) {
		// Retain the output for some amount of time, such that the user can skim the result of the
		// operation before it's gone.
		// This doesn't have to be as long as for the error case.
		await setTimeout(2000);
	}

	log.success(
		styleText(["green"], `Finished running command ${highlight(command)} successfully`),
	);

	return true;
}

/**
 * @param cwd Current working directory
 */
export async function apply(cwd: string) {
	intro("apply");

	const piccoPath = resolve(cwd, PICCO_DIR);
	const configFile = await ConfigFile.readFromFile(piccoPath);
	await using lockfile = await Lockfile.readFromFile(piccoPath);

	if (!configFile.categories.some(({ key }) => key === MIGRATION_KEY)) {
		prompts.log.error(
			styleText("red", `Could not find category with key "migration" in config file`),
		);
		outro();
		return;
	}

	const piccologs = await gatherPiccologs({
		piccoPath,
		categories: configFile.categories,
		selectedCategories: [MIGRATION_KEY],
	});

	if (!piccologs) {
		return;
	}

	let applicableMigrationNames: Set<string>;

	if (piccologs[MIGRATION_KEY]) {
		applicableMigrationNames = new Set(
			piccologs[MIGRATION_KEY]!.map(({ name }) => name),
		).difference(new Set(lockfile.appliedMigrations));
	} else {
		applicableMigrationNames = new Set();
	}

	if (applicableMigrationNames.size === 0) {
		prompts.log.info("No migration steps to apply!");
		outro();
		return;
	}

	const applicableMigrations = deduplicatePiccologsByPresets(
		piccologs[MIGRATION_KEY]!.filter(({ name }) => applicableMigrationNames.has(name)),
		configFile.categories.find(({ key }) => key === MIGRATION_KEY)!,
	);
	const appliedMigrationNames: string[] = [];

	for (const migration of applicableMigrations) {
		const summary = formatPiccologSummary(migration);
		const runnableCommands = getRunnableCommands(summary);
		let wereAllMigrationStepsSuccessful = true;

		if (runnableCommands.length === 0) {
			const applyAction = await promptConfirmApply(summary);

			if (prompts.isCancel(applyAction)) {
				onCancel();
			}

			if (applyAction === "mark-as-applied") {
				appliedMigrationNames.push(
					migration.name,
					...migration.duplicates.map(({ name }) => name),
				);
			}

			continue;
		}

		for (const command of runnableCommands) {
			const commandAction = await promptRunCommand(command);

			if (prompts.isCancel(commandAction)) {
				onCancel();
			}

			if (commandAction === "skip") {
				wereAllMigrationStepsSuccessful = false;
				break;
			}

			if (commandAction === "run") {
				const wasSuccessful = await runCommand(command);

				if (!wasSuccessful) {
					wereAllMigrationStepsSuccessful = false;
					break;
				}
			}
		}

		if (wereAllMigrationStepsSuccessful) {
			appliedMigrationNames.push(
				migration.name,
				...migration.duplicates.map(({ name }) => name),
			);
		}
	}

	lockfile.addToAppliedMigrations(appliedMigrationNames);

	const result = highlight(
		`${appliedMigrationNames.length} ouf of ${applicableMigrationNames.size}`,
	);

	outro(`Applied ${result} migration${applicableMigrationNames.size === 1 ? "" : "s"}`);
}
