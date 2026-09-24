/**
 * WTF Action Compilation Engine (Phase 9.2 / Protocol v0.2)
 *
 * Deterministically resolves model-generated patch intents against actual disk bytes.
 * Normalizes formatting entropy (mixed tabs/spaces, relative indentation, trailing whitespace,
 * blank line boundaries, JSON escaping artifacts) to apply code replacements bit-for-bit
 * without semantic modification, while strictly failing closed on any ambiguity.
 *
 * Epistemic Invariants (Frozen in Phase 7.3C and Phase 9.1):
 * 1. Zero LLMs, zero embeddings, zero probabilistic ranking.
 * 2. Disk bytes are the single ground truth.
 * 3. Never invent, rewrite, or alter replacement semantics.
 * 4. Normalizes mechanical formatting only.
 * 5. Strict fail-closed safety: ambiguous matches (>1 occurrences) must reject cleanly.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { isPathInside, safeReadRepoFile } from './security.js';

export interface ActionCompilerParams {
  content: string;
  oldText: string;
  newText: string;
  startLine?: number; // 1-indexed optional constraint
  endLine?: number;   // 1-indexed optional constraint
}

export interface ActionCompilerResult {
  success: boolean;
  content: string;
  strategyUsed?: 'exact' | 'line_normalized' | 'token_sequence';
  spansMatched: number;
  error?: string;
}

export interface PatchFileResult extends ActionCompilerResult {
  filePath: string;
  linesAdded?: number;
  linesDeleted?: number;
}

/**
 * Counts exact non-overlapping occurrences of a substring.
 */
function countOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0;
  let count = 0;
  let pos = 0;
  while ((pos = haystack.indexOf(needle, pos)) !== -1) {
    count++;
    pos += needle.length;
  }
  return count;
}

/**
 * Normalizes a single line by trimming and collapsing multiple spaces.
 */
function normLine(line: string): string {
  return line.trim().split(/\s+/).filter(Boolean).join(' ');
}

/**
 * Splits text into lines preserving line terminator characters (CRLF/LF).
 */
function splitLinesKeepEnds(text: string): string[] {
  if (!text) return [];
  const lines: string[] = [];
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '\n') {
      lines.push(text.slice(start, i + 1));
      start = i + 1;
    } else if (text[i] === '\r' && i + 1 < text.length && text[i + 1] === '\n') {
      lines.push(text.slice(start, i + 2));
      start = i + 2;
      i++;
    }
  }
  if (start < text.length) {
    lines.push(text.slice(start));
  }
  return lines;
}

/**
 * Extracts non-whitespace tokens with their character start/end spans.
 */
interface TokenSpan {
  token: string;
  start: number;
  end: number;
}

function tokenizeWithSpans(text: string): TokenSpan[] {
  const tokens: TokenSpan[] = [];
  const regex = /\S+/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    tokens.push({
      token: match[0],
      start: match.index,
      end: match.index + match[0].length,
    });
  }
  return tokens;
}

/**
 * Pure deterministic replacement engine.
 * Satisfies all Stage 5.2 / Phase 7.3C / Phase 9.1 invariants.
 */
export function compileAndApplyPatch(params: ActionCompilerParams): ActionCompilerResult {
  const { content, oldText, newText, startLine, endLine } = params;

  if (!oldText || oldText.length === 0) {
    return {
      success: false,
      content,
      spansMatched: 0,
      error: 'Error: old_text is empty',
    };
  }

  // =========================================================================
  // Strategy 1: Exact Substring Match
  // =========================================================================
  if (content.includes(oldText)) {
    const cnt = countOccurrences(content, oldText);
    if (cnt === 1) {
      const idx = content.indexOf(oldText);
      const replaced = content.slice(0, idx) + newText + content.slice(idx + oldText.length);
      return {
        success: true,
        content: replaced,
        strategyUsed: 'exact',
        spansMatched: 1,
      };
    } else if (cnt > 1) {
      // Check if coordinate bounding disambiguates to a single match
      if (startLine !== undefined && endLine !== undefined) {
        const lines = splitLinesKeepEnds(content);
        const sl = Math.max(0, startLine - 1);
        const el = Math.min(lines.length, endLine);
        const subContent = lines.slice(sl, el).join('');
        if (countOccurrences(subContent, oldText) === 1) {
          const idx = subContent.indexOf(oldText);
          const newSub = subContent.slice(0, idx) + newText + subContent.slice(idx + oldText.length);
          const fullResult = lines.slice(0, sl).join('') + newSub + lines.slice(el).join('');
          return {
            success: true,
            content: fullResult,
            strategyUsed: 'exact',
            spansMatched: 1,
          };
        }
      }
    }
  }

  const cLines = splitLinesKeepEnds(content);
  const oLines = oldText.split(/\r?\n/);
  const oNorm = oLines.map(normLine).filter((l) => l.length > 0);

  if (oNorm.length === 0) {
    return {
      success: false,
      content,
      spansMatched: 0,
      error: 'Error: old_text contains only whitespace',
    };
  }

  // =========================================================================
  // Strategy 2: Line-Normalized Matching (Indentation & Blank-Line Entropy)
  // =========================================================================
  const rawMatches: Array<[number, number]> = [];
  for (let i = 0; i < cLines.length; i++) {
    let currI = i;
    let oIdx = 0;
    while (currI < cLines.length && oIdx < oNorm.length) {
      const cStr = normLine(cLines[currI]);
      if (cStr.length === 0) {
        currI++;
        continue;
      }
      if (cStr === oNorm[oIdx]) {
        oIdx++;
        currI++;
      } else {
        break;
      }
    }
    if (oIdx === oNorm.length) {
      // Trim leading/trailing blank lines from candidate span
      let s = i;
      let e = currI;
      while (s < e && cLines[s].trim().length === 0) {
        s++;
      }
      while (e > s && cLines[e - 1].trim().length === 0) {
        e--;
      }
      rawMatches.push([s, e]);
    }
  }

  // Deduplicate identical spans
  const spanKeySet = new Set<string>();
  const uniqueSpans: Array<[number, number]> = [];
  for (const [s, e] of rawMatches) {
    const key = `${s}:${e}`;
    if (!spanKeySet.has(key)) {
      spanKeySet.add(key);
      uniqueSpans.push([s, e]);
    }
  }

  const applyLineNormalizedSpan = (s: number, e: number): string => {
    // Preserve target base indentation
    const mInd = cLines[s].match(/^(\s*)/);
    const targetIndent = mInd ? mInd[1] : '';

    let newLines = splitLinesKeepEnds(newText);
    // Align indentation if new_text omitted base indentation and original old_text also omitted it
    if (
      newLines.length > 0 &&
      !newLines[0].match(/^[ \t]/) &&
      targetIndent.length > 0 &&
      !oLines[0].match(/^[ \t]/)
    ) {
      newLines = newLines.map((nl) => (nl.trim().length > 0 ? targetIndent + nl : nl));
    }

    // Preserve newline ending consistency
    if (
      newLines.length > 0 &&
      !newLines[newLines.length - 1].endsWith('\n') &&
      e < cLines.length &&
      cLines[e - 1].endsWith('\n')
    ) {
      newLines[newLines.length - 1] += '\n';
    }

    return cLines.slice(0, s).join('') + newLines.join('') + cLines.slice(e).join('');
  };

  if (uniqueSpans.length === 1) {
    const [s, e] = uniqueSpans[0];
    const result = applyLineNormalizedSpan(s, e);
    return {
      success: true,
      content: result,
      strategyUsed: 'line_normalized',
      spansMatched: 1,
    };
  } else if (uniqueSpans.length > 1) {
    if (startLine !== undefined && endLine !== undefined) {
      const filtered = uniqueSpans.filter(([s, e]) => s + 1 >= startLine && e <= endLine);
      if (filtered.length === 1) {
        const [s, e] = filtered[0];
        const result = applyLineNormalizedSpan(s, e);
        return {
          success: true,
          content: result,
          strategyUsed: 'line_normalized',
          spansMatched: 1,
        };
      }
    }
    return {
      success: false,
      content,
      spansMatched: uniqueSpans.length,
      error: `Error: Ambiguous match (${uniqueSpans.length} occurrences found in file). Please provide more context lines.`,
    };
  }

  // =========================================================================
  // Strategy 3: Token Sequence Matching (Line-Wrap & Whitespace Entropy)
  // =========================================================================
  const cTokens = tokenizeWithSpans(content);
  const oTokens = oldText.match(/\S+/g) || [];

  if (oTokens.length > 0) {
    const tokMatches: Array<[number, number]> = [];
    const nO = oTokens.length;

    for (let i = 0; i <= cTokens.length - nO; i++) {
      let allMatch = true;
      for (let j = 0; j < nO; j++) {
        if (cTokens[i + j].token !== oTokens[j]) {
          allMatch = false;
          break;
        }
      }
      if (allMatch) {
        const charStart = cTokens[i].start;
        const charEnd = cTokens[i + nO - 1].end;
        tokMatches.push([charStart, charEnd]);
      }
    }

    if (tokMatches.length === 1) {
      const [cs, ce] = tokMatches[0];
      const result = content.slice(0, cs) + newText + content.slice(ce);
      return {
        success: true,
        content: result,
        strategyUsed: 'token_sequence',
        spansMatched: 1,
      };
    } else if (tokMatches.length > 1) {
      return {
        success: false,
        content,
        spansMatched: tokMatches.length,
        error: `Error: Ambiguous match (${tokMatches.length} occurrences found in file). Please provide more context lines.`,
      };
    }
  }

  return {
    success: false,
    content,
    spansMatched: 0,
    error: 'Error: Target text not found in file. Ensure lines match target content.',
  };
}

/**
 * Applies patch directly to a file on disk within repository bounds.
 */
export function compileAndApplyPatchToFile(
  targetFile: string,
  oldText: string,
  newText: string,
  options?: {
    startLine?: number;
    endLine?: number;
    cwd?: string;
  }
): PatchFileResult {
  const cwd = options?.cwd || process.cwd();
  const fullPath = path.isAbsolute(targetFile) ? targetFile : path.resolve(cwd, targetFile);

  if (!isPathInside(cwd, fullPath)) {
    return {
      success: false,
      filePath: targetFile,
      content: '',
      spansMatched: 0,
      error: `Security violation: Path '${targetFile}' escapes repository root`,
    };
  }

  if (!fs.existsSync(fullPath)) {
    return {
      success: false,
      filePath: targetFile,
      content: '',
      spansMatched: 0,
      error: `Error: File not found: ${targetFile}`,
    };
  }

  let originalContent = '';
  try {
    originalContent = fs.readFileSync(fullPath, 'utf-8');
  } catch (err) {
    return {
      success: false,
      filePath: targetFile,
      content: '',
      spansMatched: 0,
      error: `Error reading file: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  const result = compileAndApplyPatch({
    content: originalContent,
    oldText,
    newText,
    startLine: options?.startLine,
    endLine: options?.endLine,
  });

  if (!result.success) {
    return {
      ...result,
      filePath: targetFile,
    };
  }

  try {
    fs.writeFileSync(fullPath, result.content, 'utf-8');
  } catch (err) {
    return {
      success: false,
      filePath: targetFile,
      content: originalContent,
      spansMatched: result.spansMatched,
      error: `Error writing file: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  const origLineCount = originalContent.split(/\r?\n/).length;
  const newLineCount = result.content.split(/\r?\n/).length;
  const lineDelta = newLineCount - origLineCount;

  return {
    ...result,
    filePath: targetFile,
    linesAdded: lineDelta > 0 ? lineDelta : 0,
    linesDeleted: lineDelta < 0 ? Math.abs(lineDelta) : 0,
  };
}
