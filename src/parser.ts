import { extractYaml, test as hasFrontMatter } from "@std/front-matter";
import { type } from "arktype";

import { ChangeCategories } from "./config-file";
import type { Prettify } from "./utility";

function buildMetadataType(categories: ChangeCategories) {
	return type({
		category: type.enumerated(...categories.map(({ key }) => key)),
		pullRequest: "number.integer?",
		createdAt: "Date?",
		isBreaking: "boolean?",
	});
}

type ParsedPiccolog = Prettify<
	ReturnType<typeof buildMetadataType>["infer"] & {
		summary: string[];
	}
>;

export type Piccolog = Prettify<
	Omit<ParsedPiccolog, "createdAt"> & {
		createdAt: Date;
		name: string;
	}
>;

export function parsePiccoLog(categories: ChangeCategories, logContents: string): ParsedPiccolog {
	if (!hasFrontMatter(logContents)) {
		throw new Error(`Failed to parse piccolog: invalid frontmatter`);
	}

	const { attrs, body } = extractYaml(logContents);

	const metadata = buildMetadataType(categories)(attrs);
	const summary = body.trim().split("\n");

	if (metadata instanceof type.errors) {
		throw new Error(`Failed to parse piccolog: ${metadata.at(0)?.message}`);
	}

	return {
		...metadata,
		summary,
	};
}
