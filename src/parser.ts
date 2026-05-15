import { extractYaml, test as hasFrontMatter } from "@std/front-matter";
import { type } from "arktype";

import { CHANGE_CATEGORIES } from "./constants";
import type { Prettify } from "./utility";

const Metadata = type({
	category: type.enumerated(...CHANGE_CATEGORIES.map(({ key }) => key)),
	pullRequest: "number.integer?",
	createdAt: "Date?",
});

export type ParsedPiccolog = Prettify<
	typeof Metadata.infer & {
		summary: string[];
	}
>;

export function parsePiccoLog(logContents: string): ParsedPiccolog {
	if (!hasFrontMatter(logContents)) {
		throw new Error(`Failed to parse piccolog: invalid frontmatter`);
	}

	const { attrs, body } = extractYaml(logContents);

	const metadata = Metadata(attrs);
	const summary = body.trim().split("\n");

	if (metadata instanceof type.errors) {
		throw new Error(`Failed to parse piccolog: ${metadata.at(0)?.message}`);
	}

	return {
		...metadata,
		summary,
	};
}
