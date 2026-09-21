import type {
  CanonicalEvidenceGraph,
  DiagnosticItem,
  FileChangeItem,
  RelationItem,
  VerificationItemV0,
} from './protocol-v0.js';

export interface EvidenceInput {
  cmd: string;
  exitCode: number;
  stdout: string;
  stderr: string;
  gitDiff: string;
}

export interface DiffHunk {
  oldStart: number;
  oldCount: number;
  newStart: number;
  newCount: number;
  lines: string[];
}

export interface ChangedFileDiff {
  path: string;
  hunks: DiffHunk[];
  changedLines: Set<number>;
}

export interface Diagnostic {
  file?: string;
  line?: number;
  column?: number;
  level: 'error' | 'warning' | 'note' | 'help' | 'other';
  message: string;
  rawText: string;
}

/**
 * Parse a unified git diff into file-level modifications and changed line numbers.
 */
export function parseGitDiff(diffText: string): Map<string, ChangedFileDiff> {
  const result = new Map<string, ChangedFileDiff>();
  if (!diffText) return result;

  const lines = diffText.split('\n');
  let currentFile: string | null = null;
  let currentDiff: ChangedFileDiff | null = null;
  let currentHunk: DiffHunk | null = null;
  let currentNewLineNum = 0;

  for (const line of lines) {
    if (line.startsWith('diff --git ')) {
      // e.g. diff --git a/src/impls.rs b/src/impls.rs
      const parts = line.split(' ');
      if (parts.length >= 4) {
        const rawB = parts[3];
        currentFile = rawB.startsWith('b/') ? rawB.slice(2) : rawB;
        currentDiff = {
          path: currentFile,
          hunks: [],
          changedLines: new Set<number>()
        };
        result.set(currentFile, currentDiff);
      }
    } else if (line.startsWith('@@ ') && currentDiff) {
      // e.g. @@ -50,7 +50,7 @@ or @@ -1,10 +1,1 @@
      const match = line.match(/@@\s+-\d+(?:,\d+)?\s+\+(\d+)(?:,(\d+))?\s+@@/);
      if (match) {
        const newStart = parseInt(match[1], 10);
        const newCount = match[2] ? parseInt(match[2], 10) : 1;
        currentNewLineNum = newStart;
        currentHunk = {
          oldStart: 0,
          oldCount: 0,
          newStart,
          newCount,
          lines: []
        };
        currentDiff.hunks.push(currentHunk);
      }
    } else if (currentHunk && currentDiff) {
      if (line.startsWith('+') && !line.startsWith('+++')) {
        currentDiff.changedLines.add(currentNewLineNum);
        currentHunk.lines.push(line);
        currentNewLineNum++;
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        currentHunk.lines.push(line);
      } else if (line.startsWith(' ')) {
        currentHunk.lines.push(line);
        currentNewLineNum++;
      }
    }
  }

  return result;
}

/**
 * Parse Rust / Cargo compiler diagnostics from combined compiler output.
 */
export function parseRustDiagnostics(output: string): { diagnostics: Diagnostic[]; other: string[] } {
  const diagnostics: Diagnostic[] = [];
  const other: string[] = [];
  if (!output) return { diagnostics, other };

  const lines = output.split('\n');
  let currentDiag: Diagnostic | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check for start of rustc diagnostic: error: ..., error[E0277]: ..., warning: ...
    const errorMatch = line.match(/^(error(?:\[[A-Z0-9]+\])?:|warning(?:\[[A-Z0-9]+\])?:)\s*(.*)$/);
    if (errorMatch) {
      if (currentDiag) {
        diagnostics.push(currentDiag);
      }
      currentDiag = {
        level: line.startsWith('warning') ? 'warning' : 'error',
        message: line.trim(),
        rawText: line
      };
      continue;
    }

    // Check for file:line:col marker (--> path:line:col)
    const locMatch = line.match(/^\s*-->\s+([^:\s]+):(\d+):(\d+)/);
    if (locMatch && currentDiag) {
      if (!currentDiag.file) {
        currentDiag.file = locMatch[1];
        currentDiag.line = parseInt(locMatch[2], 10);
        currentDiag.column = parseInt(locMatch[3], 10);
      }
      currentDiag.rawText += '\n' + line;
      continue;
    }

    if (currentDiag) {
      // If we encounter a new compiler stage or exit summary, close current diag
      if (line.startsWith('error: could not compile') || line.startsWith('warning: build failed') || line.startsWith('test result:')) {
        diagnostics.push(currentDiag);
        currentDiag = null;
        if (line.trim().length > 0) {
          other.push(line.trim());
        }
      } else {
        currentDiag.rawText += '\n' + line;
      }
    } else {
      const trimmed = line.trim();
      if (trimmed.length > 0 && !trimmed.startsWith('Compiling ') && !trimmed.startsWith('running ') && !trimmed.startsWith('Finished ')) {
        other.push(trimmed);
      }
    }
  }

  if (currentDiag) {
    diagnostics.push(currentDiag);
  }

  return { diagnostics, other };
}

/**
 * Deterministically compile compiler & tool output into an evidence packet.
 */
export function compileEvidence(input: EvidenceInput): string {
  const combinedOutput = [input.stdout, input.stderr].filter(Boolean).join('\n');
  const diffMap = parseGitDiff(input.gitDiff);
  const { diagnostics, other } = parseRustDiagnostics(combinedOutput);

  const changedCodeDiags: string[] = [];
  const unchangedCodeDiags: string[] = [];
  const changeContext: string[] = [];
  const otherItems: string[] = [];

  for (const diag of diagnostics) {
    const locStr = diag.file ? `${diag.file}:${diag.line}:${diag.column}` : 'unknown';
    const entry = `  ${locStr}\n  ${diag.message}`;

    if (diag.file) {
      // Normalize relative path if necessary
      let matchedFile = false;
      for (const [diffPath, diffObj] of diffMap.entries()) {
        if (diag.file === diffPath || diag.file.endsWith('/' + diffPath) || diffPath.endsWith('/' + diag.file)) {
          matchedFile = true;
          changedCodeDiags.push(entry);

          // Check if line is within changed context
          if (diag.line !== undefined && diffObj.changedLines.has(diag.line)) {
            // Find hunk
            for (const hunk of diffObj.hunks) {
              if (diag.line >= hunk.newStart && diag.line < hunk.newStart + hunk.newCount) {
                const addedLines = hunk.lines.filter(l => l.startsWith('+')).join('\n');
                if (addedLines) {
                  changeContext.push(`  ${diffPath}:${diag.line} modified in working tree:\n    ${addedLines.trim()}`);
                }
                break;
              }
            }
          } else if (diag.line !== undefined) {
            changeContext.push(`  ${diffPath} was modified in working tree (diagnostic at line ${diag.line})`);
          }
          break;
        }
      }

      if (!matchedFile) {
        unchangedCodeDiags.push(entry);
      }
    } else {
      otherItems.push(`  ${diag.message}`);
    }
  }

  for (const o of other) {
    if (o.startsWith('error: could not compile') || o.startsWith('warning: build failed')) {
      // Keep only high-level build error summary in OTHER if not redundant
      otherItems.push(`  ${o}`);
    }
  }

  const sections: string[] = [];

  sections.push(`FAILURE\n  ${input.cmd}: exit ${input.exitCode}`);

  if (changedCodeDiags.length > 0) {
    sections.push(`DIAGNOSTICS_IN_CHANGED_CODE\n${changedCodeDiags.join('\n')}`);
  } else {
    sections.push(`DIAGNOSTICS_IN_CHANGED_CODE\n  none`);
  }

  if (unchangedCodeDiags.length > 0) {
    sections.push(`DIAGNOSTICS_IN_UNCHANGED_CODE\n${unchangedCodeDiags.join('\n')}`);
  } else {
    sections.push(`DIAGNOSTICS_IN_UNCHANGED_CODE\n  none`);
  }

  if (changeContext.length > 0) {
    // Deduplicate change context entries
    const uniqueContext = Array.from(new Set(changeContext));
    sections.push(`CHANGE_CONTEXT\n${uniqueContext.join('\n')}`);
  }

  if (otherItems.length > 0) {
    sections.push(`OTHER\n${otherItems.join('\n')}`);
  }

  sections.push(`UNKNOWN\n  causal relationship between diagnostics`);

  return sections.join('\n');
}

/**
 * Maps evidence input to the canonical Evidence Protocol v0 graph.
 */
export function compileEvidenceToCanonical(input: EvidenceInput): CanonicalEvidenceGraph {
  const diffs = parseGitDiff(input.gitDiff);
  const { diagnostics } = parseRustDiagnostics((input.stdout || '') + '\n' + (input.stderr || ''));

  // 1. CHANGE
  const files: FileChangeItem[] = [];
  for (const [filePath, diff] of diffs.entries()) {
    let additions = 0;
    let deletions = 0;
    for (const hunk of diff.hunks) {
      for (const line of hunk.lines) {
        if (line.startsWith('+') && !line.startsWith('+++')) additions++;
        else if (line.startsWith('-') && !line.startsWith('---')) deletions++;
      }
    }
    files.push({
      file: filePath,
      operation: 'MODIFIED',
      additions,
      deletions,
      provenance: 'OBSERVED',
    });
  }

  // 2. DIAGNOSTIC
  const toolName = input.cmd.split(' ')[0] || 'tool';
  const diagItems: DiagnosticItem[] = diagnostics.map((d) => ({
    tool: toolName,
    message: d.message,
    file: d.file,
    line: d.line,
    column: d.column,
    level: d.level,
    rawText: d.rawText,
    provenance: 'REPORTED',
  }));

  // 3. RELATION
  const relations: RelationItem[] = [];
  for (const d of diagnostics) {
    if (!d.file) continue;

    let matchedDiff = false;
    for (const [diffPath, diffObj] of diffs.entries()) {
      if (d.file === diffPath || d.file.endsWith('/' + diffPath) || diffPath.endsWith('/' + d.file)) {
        matchedDiff = true;
        if (d.line !== undefined && diffObj.changedLines.has(d.line)) {
          relations.push({
            predicate: 'intersects_changed_lines',
            statement: `diagnostic on changed line ${d.line} in ${diffPath}`,
            subject: { type: 'diagnostic', identifier: `${toolName}:${d.file}:${d.line}`, file: d.file, line: d.line },
            object: { type: 'change', identifier: `change:${diffPath}`, file: diffPath },
            provenance: 'MECHANICALLY_DERIVED',
          });
        } else {
          relations.push({
            predicate: 'in_changed_file_unchanged_line',
            statement: `diagnostic in changed file ${diffPath}${d.line ? ` (unchanged line ${d.line})` : ''}`,
            subject: { type: 'diagnostic', identifier: `${toolName}:${d.file}:${d.line}`, file: d.file, line: d.line },
            object: { type: 'change', identifier: `change:${diffPath}`, file: diffPath },
            provenance: 'MECHANICALLY_DERIVED',
          });
        }
        break;
      }
    }

    if (!matchedDiff) {
      relations.push({
        predicate: 'in_unchanged_file',
        statement: `diagnostic in unchanged file ${d.file}`,
        subject: { type: 'diagnostic', identifier: `${toolName}:${d.file}:${d.line}`, file: d.file, line: d.line },
        object: { type: 'file', identifier: `file:${d.file}` },
        provenance: 'MECHANICALLY_DERIVED',
      });
    }
  }

  // 4. VERIFICATION
  const combinedOutput = (input.stdout || '') + '\n' + (input.stderr || '');
  const hasDeterministicBuildFailure =
    combinedOutput.includes('could not compile') ||
    combinedOutput.includes('build failed') ||
    /error\[E\d+\]:/.test(combinedOutput) ||
    /error TS\d+:/.test(combinedOutput) ||
    combinedOutput.includes('SyntaxError:');

  const hasDeterministicTestFailure =
    /test result:\s+FAILED/i.test(combinedOutput) ||
    /failures:/i.test(combinedOutput) ||
    /Tests:\s+.*failed/i.test(combinedOutput) ||
    /FAIL\s+/.test(combinedOutput) ||
    /===+.*failed in/i.test(combinedOutput) ||
    /FAILED\s+test_/.test(combinedOutput) ||
    /--- FAIL:/.test(combinedOutput);

  let verifLifecycle: VerificationItemV0['lifecycle'];
  let verifCompilation: VerificationItemV0['compilation'];
  let verifStatus: VerificationItemV0['status'];
  let verifTier: VerificationItemV0['tier'];
  let verifProvenance: VerificationItemV0['provenance'];

  if (input.exitCode === 0) {
    verifLifecycle = 'TESTS_PASSED';
    verifCompilation = 'VALID';
    verifStatus = 'PASSED';
    verifTier = 'VERIFIED';
    verifProvenance = 'VERIFIED';
  } else if (hasDeterministicBuildFailure) {
    verifLifecycle = 'BUILD_FAILED';
    verifCompilation = 'FAILED';
    verifStatus = 'FAILED';
    verifTier = 'VERIFIED';
    verifProvenance = 'VERIFIED';
  } else if (hasDeterministicTestFailure) {
    verifLifecycle = 'TESTS_FAILED';
    verifCompilation = 'VALID';
    verifStatus = 'FAILED';
    verifTier = 'VERIFIED';
    verifProvenance = 'VERIFIED';
  } else {
    // Non-zero exit code without deterministic evidence for build or test failure:
    // preserve uncertainty rather than guessing.
    verifLifecycle = 'PARTIAL_EXECUTION';
    verifCompilation = 'UNKNOWN';
    verifStatus = 'FAILED';
    verifTier = 'UNKNOWN';
    verifProvenance = 'UNKNOWN';
  }

  const verifItem: VerificationItemV0 = {
    command: input.cmd,
    lifecycle: verifLifecycle,
    invocation: 'VALID',
    compilation: verifCompilation,
    status: verifStatus,
    testsExecuted: 'UNKNOWN',
    exitCode: input.exitCode,
    tier: verifTier,
    provenance: verifProvenance,
  };

  // 5. Canonical Graph
  return {
    spec: 'wtf/protocol-v0',
    change: {
      status: files.length > 0 ? 'observed' : 'none observed',
      files,
      provenance: 'OBSERVED',
    },
    diagnostic: {
      status: diagItems.length > 0 ? 'reported' : 'none',
      items: diagItems,
      provenance: 'REPORTED',
    },
    relation: {
      status: relations.length > 0 ? 'established' : 'none',
      items: relations,
      provenance: 'MECHANICALLY_DERIVED',
    },
    verification: {
      status: 'verified',
      items: [verifItem],
    },
    unknown: {
      items: [
        {
          category: 'causal_relationship_between_diagnostics',
          statement: 'Causal relationship between diagnostics is unestablished',
          provenance: 'UNKNOWN',
        },
        {
          category: 'task_intent_correctness',
          statement: 'Task intent correctness: unverified (passing checks prove only that executed tests passed, not that overall user intent or requirements are met)',
          provenance: 'UNKNOWN',
        },
      ],
      provenance: 'UNKNOWN',
    },
  };
}
