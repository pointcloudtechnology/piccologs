import { argv, cwd, exit } from "node:process";

import { init } from "./commands/init.js";
import { add } from "./commands/add.js";
import { version } from "./commands/version.js";

export async function run() {
    const rootDir = cwd();
    const command = argv[2];

    switch (command) {
        case "init":
            await init(rootDir);
            break;

        case "add":
            await add(rootDir);
            break;

        case "version":
            await version(rootDir);
            break;

        default:
            console.log("usage: picco <init|add|version>");
            exit(1);
    }
}

await run();

