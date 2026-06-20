import { readdir, readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { exit } from "node:process";
import { styleText } from "node:util";

import * as prompts from "@clack/prompts";

import { ChangeCategories, ChangeCategory } from "../config-file";
import { parsePiccoLog, type Piccolog } from "../parser";

export function intro(command: string): void {
	prompts.intro(styleText(["bgBlue", "black", "bold"], ` picco ${command} `));
}

export function outro(message?: string): void {
	if (message) {
		prompts.outro(message);
	} else {
		prompts.outro(styleText(["green", "italic"], "Have a nice day!"));
	}
}

export function onCancel(): never {
	prompts.cancel("Have a nice day!");
	exit(0);
}

export function highlight(text: string): string {
	return styleText(["blue", "bold"], text);
}

export function darken(text: string): string {
	return styleText(["gray"], text);
}

export function hyperlink(text: string): string {
	return styleText(["cyan", "underline"], text);
}

export function logError(message: string, context?: { fileName?: string; content: string }): void {
	let errorMessage = styleText(["red", "bold"], message) + "\n";

	if (context) {
		if (context.fileName) {
			errorMessage += ` ╭─[${highlight(context.fileName)}]\n`;
		} else {
			errorMessage += ` ╭────\n`;
		}

		for (const line of context.content.split("\n")) {
			errorMessage += ` │ ${line}\n`;
		}

		errorMessage += ` ╰────`;
	}

	prompts.log.error(errorMessage);
}

export async function getAllPiccologPaths(piccoPath: string): Promise<string[]> {
	return (await readdir(piccoPath)).filter((fileName) => fileName.endsWith(".md"));
}

export async function gatherPiccologs(options: {
	piccoPath: string;
	categories: ChangeCategories;
	selectedCategories?: ChangeCategory["key"][];
}): Promise<Partial<Record<ChangeCategory["key"], Piccolog[]>> | undefined> {
	const {
		piccoPath,
		categories,
		selectedCategories = categories.map(({ key }) => key),
	} = options;
	const piccologNames = await getAllPiccologPaths(piccoPath);
	const piccologs: Piccolog[] = [];

	for (const logName of piccologNames) {
		const logContents = await readFile(resolve(piccoPath, logName), { encoding: "utf8" });

		try {
			const piccolog = parsePiccoLog(categories, logContents);

			if (!selectedCategories.includes(piccolog.category)) {
				continue;
			}

			if (!piccolog.createdAt) {
				const fileInfo = await stat(resolve(piccoPath, logName));
				piccolog.createdAt = fileInfo.birthtime;
			}

			piccologs.push({ ...piccolog, name: logName, createdAt: piccolog.createdAt });
		} catch (error) {
			logError((error as Error).message, { fileName: logName, content: logContents });

			return undefined;
		}
	}

	return Object.groupBy(piccologs, ({ category }) => category);
}

export type DeduplicatedPiccolog = Piccolog & { duplicates: Piccolog[] };

export function deduplicatePiccologsByPresets(
	piccologs: Piccolog[],
	category: ChangeCategory,
): DeduplicatedPiccolog[] {
	const sourcePiccologs = piccologs.toSorted(
		(a, b) => a.createdAt.valueOf() - b.createdAt.valueOf(),
	);
	const outputPiccologs: DeduplicatedPiccolog[] = [];

	for (const preset of category.presets ?? []) {
		const piccologsForPreset = sourcePiccologs.filter(
			({ summary }) => summary.join("\n") === preset,
		);

		if (piccologsForPreset.length > 0) {
			outputPiccologs.push({
				...piccologsForPreset.at(-1)!,
				duplicates: piccologsForPreset.slice(0, -1),
			});
		}
	}

	outputPiccologs.push(
		...sourcePiccologs
			.filter(({ summary }) =>
				(category.presets ?? []).every((preset) => summary.join("\n") !== preset),
			)
			.map((piccolog) => ({ ...piccolog, duplicates: [] })),
	);

	return outputPiccologs;
}

export function buildChangelog(
	categories: ChangeCategories,
	piccologs: Partial<Record<ChangeCategory["key"], Piccolog[]>>,
	formatters: {
		formatChangelogHeading: () => string;
		formatCategoryHeading: (category: ChangeCategory) => string;
		formatChange: (piccolog: DeduplicatedPiccolog) => string;
	},
): string {
	let changelog = formatters.formatChangelogHeading();

	for (const category of categories) {
		if (!piccologs[category.key]) {
			continue;
		}

		changelog += formatters.formatCategoryHeading(category);

		changelog += deduplicatePiccologsByPresets(piccologs[category.key]!, category)
			.map((piccolog) => formatters.formatChange(piccolog))
			.join("\n");

		changelog += "\n\n";
	}

	return changelog;
}

export function formatPiccologSummary(piccolog: Piccolog): string {
	return piccolog.summary.join(" ");
}
