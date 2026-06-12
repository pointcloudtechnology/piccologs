import { argv, cwd, exit } from "node:process";

import { add } from "./commands/add";
import { apply } from "./commands/apply";
import { init } from "./commands/init";
import { list } from "./commands/list";
import { status } from "./commands/status";
import { version } from "./commands/version";

async function run() {
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

		case "apply":
			await apply(rootDir);
			break;

		case "status":
			const useJsonOutput = argv.slice(3).includes("--json");

			await status(rootDir, useJsonOutput);
			break;

		default:
			console.log("usage: picco <init|add|version|list|apply|status>");
			exit(1);
	}
}

await run();
