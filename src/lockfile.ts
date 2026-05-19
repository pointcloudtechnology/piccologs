import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { type } from "arktype";

const LockfileData = type({
	version: "number.integer",
	knownLogs: "string[]",
	appliedMigrations: "string[]",
});

const parseLockfile = type("string.json.parse").to(LockfileData);

export class Lockfile {
	private static FILE_NAME = ".piccolock.json";

	#data: typeof LockfileData.infer;
	#path: string;

	private constructor(data: typeof LockfileData.infer, path: string) {
		this.#data = data;
		this.#path = path;
	}

	get version(): number {
		return this.#data.version;
	}

	get knownLogs(): string[] {
		return this.#data.knownLogs;
	}

	get appliedMigrations(): string[] {
		return this.#data.appliedMigrations;
	}

	async [Symbol.asyncDispose]() {
		await this.writeToFile();
	}

	static default(piccoPath: string): Lockfile {
		return new Lockfile(
			{
				version: 1,
				knownLogs: [],
				appliedMigrations: [],
			},
			piccoPath,
		);
	}

	static async readFromFile(piccoPath: string): Promise<Lockfile> {
		try {
			const fileContents = await readFile(resolve(piccoPath, this.FILE_NAME), {
				encoding: "utf8",
			});
			const parsedContents = parseLockfile(fileContents);

			if (parsedContents instanceof type.errors) {
				return Lockfile.default(piccoPath);
			}

			return new Lockfile(parsedContents, piccoPath);
		} catch {
			return Lockfile.default(piccoPath);
		}
	}

	async writeToFile(): Promise<void> {
		await writeFile(
			resolve(this.#path, Lockfile.FILE_NAME),
			JSON.stringify(this.#data, undefined, 4),
			{
				encoding: "utf8",
			},
		);
	}

	addToKnownLogs(logs: string[]): void {
		const knownLogs = new Set(this.#data.knownLogs);

		for (const log of logs) {
			knownLogs.add(log);
		}

		this.#data.knownLogs = [...knownLogs];
	}

	addToAppliedMigrations(logs: string[]): void {
		const appliedMigrations = new Set(this.#data.appliedMigrations);

		for (const log of logs) {
			appliedMigrations.add(log);
		}

		this.#data.appliedMigrations = [...appliedMigrations];
	}

	clearAllLogs(): void {
		this.#data.knownLogs = [];
		this.#data.appliedMigrations = [];
	}
}
