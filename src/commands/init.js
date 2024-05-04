import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import pc from "picocolors";

import { PICCO_DIR } from "../constants.js";

/**
 * @param {string} cwd Current working directory
 */
export async function init(cwd) {
    const keepFilePath = resolve(cwd, PICCO_DIR, ".gitkeep");

    if (existsSync(keepFilePath)) {
        return;
    }

    await mkdir(dirname(keepFilePath));

    await writeFile(keepFilePath, "");

    console.log(`${pc.green("Created directory")} ${cwd}/${pc.blue(PICCO_DIR)}`);
}
