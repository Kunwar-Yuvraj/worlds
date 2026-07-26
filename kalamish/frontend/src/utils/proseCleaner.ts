/**
 * Utility to parse AI generated content:
 * 1. Removes meta comments like [Edited for grammar, flow, and prose style.]
 * 2. Extracts chapter title from Markdown headers like "### Chapter 1: The Inventory of Solitude"
 * 3. Returns cleaned prose and optional extracted title.
 */
export function parseTitleAndCleanProse(rawText: string): { extractedTitle?: string; cleanProse: string } {
  if (!rawText) return { cleanProse: '' };

  let text = rawText.trim();

  // Strip meta comments like [Edited for...], [Note: ...], etc.
  text = text.replace(/\[\s*Edited for[^\]]*\]/gi, '').trim();
  text = text.replace(/\[\s*Note:[^\]]*\]/gi, '').trim();

  let extractedTitle: string | undefined;

  const lines = text.split('\n');
  if (lines.length > 0) {
    const firstLine = lines[0].trim();
    // Only treat explicit title/header syntax as a title. This avoids consuming
    // a short opening sentence as the chapter name.
    const match =
      firstLine.match(/^(?:#{1,6}\s*)?Chapter\s+\d+\s*(?::|[-—])\s*(.+)$/i) ||
      firstLine.match(/^(?:#{1,6}\s*)?Title\s*:\s*(.+)$/i) ||
      firstLine.match(/^#{1,6}\s+(.+)$/);

    if (match?.[1]) {
      const candidate = match[1]
        .replace(/^["'“”‘’]|["'“”‘’]$/g, '')
        .replace(/\s+#+$/, '')
        .trim();
      if (candidate.length > 1 && candidate.length <= 120) {
        extractedTitle = candidate;
        lines.shift();
        text = lines.join('\n').trim();
      }
    }
  }

  return { extractedTitle, cleanProse: text };
}

/**
 * Format chapter label nicely for sidebar and top bar:
 * If title is generic like "Chapter 1", return "Chapter 1".
 * If title is custom like "The Inventory of Solitude", return "Chapter 1 - The Inventory of Solitude".
 */
export function formatChapterLabel(chapterNumber: number, title: string): string {
  if (!title) return `Chapter ${chapterNumber}`;
  const lowerTitle = title.trim().toLowerCase();
  if (lowerTitle === `chapter ${chapterNumber}` || lowerTitle === 'chapter 1' || lowerTitle === 'untitled chapter') {
    return `Chapter ${chapterNumber}`;
  }
  // Check if title already starts with Chapter X
  if (lowerTitle.startsWith(`chapter ${chapterNumber}`)) {
    return title;
  }
  return `Chapter ${chapterNumber} - ${title}`;
}
