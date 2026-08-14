import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import * as prompts from "@clack/prompts";
import { type } from "arktype";

import { highlight, logError, onCancel } from "./commands/common";

const ConfigFileData = type({
	$schema: "string",
	versionScheme: "'semver' | 'date' | 'custom'",
	categories: type(
		{
			key: "string#CategoryKey",
			name: "string",
			icon: "string?",
			placeholder: "string?",
			pullRequest: "'required' | 'optional' | 'none' = 'none'",
			presets: "string[]?",
			allowBreaking: "boolean = false",
		},
		"[]",
	).narrow((data, ctx) => {
		if (new Set(data.map(({ key }) => key)).size === data.length) {
			return true;
		}

		const keys = new Set<string>();
		const duplicates: string[] = [];

		for (const { key } of data) {
			if (keys.has(key)) {
				duplicates.push(key);
			} else {
				keys.add(key);
			}
		}

		return ctx.reject({
			expected: "unique by their key",
			actual: `a list containing duplicate keys: ${duplicates.map((key) => `"${key}"`).join(", ")}`,
		});
	}),
});

const parseConfigFile = type("string.json.parse").to(ConfigFileData);

export type ChangeCategory = (typeof ConfigFileData.infer)["categories"][number];

export type ChangeCategories = ReturnType<typeof ConfigFile.default>["categories"];

export class ConfigFile {
	private static FILE_NAME = ".picconf.json";

	#data: typeof ConfigFileData.infer;
	#path: string;

	private constructor(data: typeof ConfigFileData.infer, path: string) {
		this.#data = data;
		this.#path = path;
	}

	get categories(): ReadonlyArray<Readonly<ChangeCategory>> {
		return this.#data.categories;
	}

	get path(): string {
		return resolve(this.#path, ConfigFile.FILE_NAME);
	}

	get versionScheme(): (typeof ConfigFileData.infer)["versionScheme"] {
		return this.#data.versionScheme;
	}

	static default(piccoPath: string): ConfigFile {
		return new ConfigFile(
			{
				$schema: "./node_modules/@pointcloudtechnology/piccologs/config-schema.json",
				versionScheme: "semver",
				categories: [
					{
						key: "feature" as ChangeCategory["key"],
						name: "Features",
						icon: "✨",
						placeholder: "Implement a breathtaking, world-changing feature",
						pullRequest: "required",
						allowBreaking: true,
					},
					{
						key: "bugfix" as ChangeCategory["key"],
						name: "Bug Fixes",
						icon: "🐛",
						placeholder: "Fix the most complicated bug so far",
						pullRequest: "required",
						allowBreaking: true,
					},
					{
						key: "refactor" as ChangeCategory["key"],
						name: "Refactoring",
						icon: "♻️",
						placeholder: "Refactor code from 5 years ago",
						pullRequest: "required",
						allowBreaking: true,
					},
					{
						key: "migration" as ChangeCategory["key"],
						name: "Migration Steps",
						icon: "🏗",
						placeholder: "Run `rm -rf /`",
						pullRequest: "none",
						allowBreaking: false,
					},
				],
			},
			piccoPath,
		);
	}

	static async readFromFile(piccoPath: string): Promise<ConfigFile> {
		try {
			const configPath = resolve(piccoPath, this.FILE_NAME);

			if (!existsSync(configPath)) {
				prompts.log.warn(
					highlight(
						`Could not read config file: attempted to read "${configPath}" but file not found. Falling back to default config.`,
						"warning",
					),
				);

				return ConfigFile.default(piccoPath);
			}

			const fileContents = await readFile(configPath, {
				encoding: "utf8",
			});
			const parsedContents = parseConfigFile(fileContents);

			if (parsedContents instanceof type.errors) {
				logError(`Could not read config file: ${parsedContents.at(0)?.message}`, {
					fileName: configPath,
					content: fileContents,
				});
				onCancel();
			}

			return new ConfigFile(parsedContents, piccoPath);
		} catch {
			return ConfigFile.default(piccoPath);
		}
	}

	async writeToFile(): Promise<void> {
		await writeFile(
			resolve(this.#path, ConfigFile.FILE_NAME),
			JSON.stringify(this.#data, undefined, 4),
			{
				encoding: "utf8",
			},
		);
	}
}
