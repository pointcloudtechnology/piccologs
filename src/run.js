import { argv, cwd, exit } from "node:process";

import { init } from "./commands/init.js";
import { add } from "./commands/add.js";
import { version } from "./commands/version.js";
import { list } from "./commands/list.js";

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

        case "list":
        case "ls":
            const args = argv
                .slice(3)
                .filter((arg) => arg.startsWith("--type"))
                .map((arg) => arg.split("=")[1]);

            await list(rootDir, args);
            break;

        default:
            console.log("usage: picco <init|add|version|list>");
            exit(1);
    }
}

