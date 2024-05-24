const LOG_PARSE_REGEX = /\s*---([^]*?)\n\s*---(\s*(?:\n|$)[^]*)/;

/**
 * @param {string} logContents
 * @returns {{ category: keyof typeof CHANGE_CATEGORIES; summary: string[]; }}
 */
export function parsePiccoLog(logContents) {
    const parseResult = LOG_PARSE_REGEX.exec(logContents);

    if (!parseResult) {
        throw new Error(`could not parse piccolog - invalid frontmatter: ${logContents}`);
    }

    const [, rawMetadata, rawSummary] = parseResult;
    const metadata = Object.fromEntries(rawMetadata.trim().split("\n").map((row) => row.split(": ")));
    const summary = rawSummary.trim().split("\n");

    return {
        category: metadata.category,
        summary,
    };
}

