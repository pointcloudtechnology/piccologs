import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { exit } from "node:process";

import { intro, outro, log } from "@clack/prompts";
import pc from "picocolors";

import { CHANGE_CATEGORIES, type ChangeCategory, PICCO_DIR } from "../constants";
import { parsePiccoLog } from "../parser";

function buildLogCategory(category: ChangeCategory["key"], changes: Set<string>): string {
	if (changes.size === 0) {
		return "";
	}

	let categoryLog = pc.bold(
		pc.cyan(`${CHANGE_CATEGORIES.find(({ key }) => key === category)!.name}\n`),
	);

	for (const change of changes) {
		categoryLog += `• ${change}\n`;
	}

	categoryLog += "\n";

	return categoryLog;
}

function buildLog(changeLog: Record<ChangeCategory["key"], Set<string>>): string {
	let finalLog = "";

	for (const { key } of CHANGE_CATEGORIES) {
		if (key in changeLog) {
			finalLog += buildLogCategory(key, changeLog[key]);
		}
	}

	return finalLog;
}

/**
 * @param cwd Current working directory
 * @param categories List of categories to include into the logged output
 */
export async function list(cwd: string, categories: string[]) {
	const piccoPath = resolve(cwd, PICCO_DIR);
	const piccologs = (await readdir(piccoPath)).filter((fileName) => fileName.endsWith(".md"));

	if (piccologs.length === 0) {
		console.log("No piccologs found");
		exit(0);
	}

	intro(pc.bgCyan(pc.black(` picco list `)));

	const allCategories = CHANGE_CATEGORIES.map(({ key }) => key);
	const unknownCategories = categories.filter(
		(category) => !(allCategories as string[]).includes(category),
	);
	const filteredCategories = categories.filter((category) =>
		allCategories.includes(category as ChangeCategory["key"]),
	) as ChangeCategory["key"][];
	const categoriesToLog = filteredCategories.length > 0 ? filteredCategories : allCategories;

	if (unknownCategories.length > 0) {
		const stringifyCategories = (categories: string[]) =>
			categories.map((cat) => `"${cat}"`).join(", ");
		const types = unknownCategories.length > 1 ? "types" : "type";

		log.warn(
			pc.yellow(
				`Ignoring unknown category ${types} ${stringifyCategories(unknownCategories)}\n`,
			) + `Valid types are: ${stringifyCategories(allCategories)}`,
		);
	}

	const changeLog: Record<ChangeCategory["key"], Set<string>> = Object.fromEntries(
		categoriesToLog.map((category) => [category, new Set()]),
	) as Record<ChangeCategory["key"], Set<string>>;

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

	log.info(buildLog(changeLog).trim() || "Nothing to show!");
	outro(pc.italic(pc.green(" Have a nice day! ")));
}
