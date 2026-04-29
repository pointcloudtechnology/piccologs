import type { CHANGE_CATEGORIES } from "./constants";

const LOG_PARSE_REGEX = /\s*---([^]*?)\n\s*---(\s*(?:\n|$)[^]*)/;

export function parsePiccoLog(logContents: string): {
	category: keyof typeof CHANGE_CATEGORIES;
	summary: string[];
} {
	const parseResult = LOG_PARSE_REGEX.exec(logContents);

	if (!parseResult) {
		throw new Error(`could not parse piccolog - invalid frontmatter: ${logContents}`);
	}

	const [, rawMetadata, rawSummary] = parseResult;
	const metadata = Object.fromEntries(
		rawMetadata
			.trim()
			.split("\n")
			.map((row) => row.split(": ")),
	);
	const summary = rawSummary.trim().split("\n");

	return {
		category: metadata.category,
		summary,
	};
}
