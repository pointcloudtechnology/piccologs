import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { ConfigFile } from "../config-file";
import { PICCO_DIR } from "../constants";
import { hyperlink } from "./common";

/**
 * @param cwd Current working directory
 */
export async function init(cwd: string) {
	const piccoPath = resolve(cwd, PICCO_DIR);
	const gitIgnoreFilePath = resolve(piccoPath, ".gitignore");
	const configFile = ConfigFile.default(piccoPath);

	if (!existsSync(piccoPath)) {
		await mkdir(piccoPath);
	}

	if (!existsSync(gitIgnoreFilePath)) {
		await writeFile(gitIgnoreFilePath, ".piccolock.json");
	}

	if (!existsSync(configFile.path)) {
		await configFile.writeToFile();

		console.log(`Created directory ${hyperlink(cwd + "/" + PICCO_DIR)}`);
	} else {
		console.log(`Piccologs directory already exists in ${hyperlink(cwd + "/" + PICCO_DIR)}`);
	}
}
