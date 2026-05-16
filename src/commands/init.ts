import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { PICCO_DIR } from "../constants";
import { hyperlink } from "./common";

/**
 * @param cwd Current working directory
 */
export async function init(cwd: string) {
	const keepFilePath = resolve(cwd, PICCO_DIR, ".gitkeep");

	if (existsSync(keepFilePath)) {
		return;
	}

	await mkdir(dirname(keepFilePath));

	await writeFile(keepFilePath, "");

	console.log(`Created directory ${hyperlink(cwd + "/" + PICCO_DIR)}`);
}
