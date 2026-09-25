/**
 * WTF Handoff Compiler (Phase 10.2 / Protocol v0.3)
 *
 * Deterministically compiles established physical state of a trajectory
 * into a self-contained, bounded continuation packet (`HandoffPacket`)
 * and zero-ANSI markdown representation.
 *
 * Epistemic Rules:
 * 1. ZERO Chain-of-Thought: No reasoning tokens, scratchpads, or conversational chat turns.
 * 2. ZERO Inferred Solutions: WTF never generates candidate fixes or repair suggestions.
 * 3. ZERO Cognitive Inferences: No "falsified approaches" or "semantic residuals".
 *    Only factual execution receipts (`priorFailedMutations`, `unresolvedVerificationStatus`).
 * 4. Raw Disk Bytes Only: Bounded code viewport exposes raw lines currently on disk.
 */

import * as path from 'node:path';
import { TraceFrame, extractTraceFrames } from './trace-slice.js';
import { renderBoundedViewport } from './viewport.js';
import { TrajectoryTurnRecord } from './trajectory-ledger.js';
import { getGitStatus } from './git.js';
import { safeGit } from './security.js';

export interface FailedMutationReceipt {
  turnIndex: number;
  targetFile: string;
  /** PROVENANCE: INTELLIGENCE_SUPPLIED_CLAIM (Agent's replacement snippet) */
  attemptedSnippet: string;
  /** PROVENANCE: DETERMINISTIC_REALITY (ActionCompiler enactment status) */
  enactedStatus: string;
  /** PROVENANCE: DETERMINISTIC_REALITY (Subprocess test output emitted after attempt) */
  resultingVerificationError: string;
}

export interface HandoffPacket {
  version: '0.3.0';
  compilationTimestamp: string;

  // --- Task Intent (Intelligence Claims) ---
  taskIntent: string;
  targetFile: string;

  // --- Verified Repository Reality ---
  repositoryState: {
    modifiedFiles: string[];
    uncommittedDiff: string;
  };

  // --- Verification Grounding ---
  currentVerification: {
    command: string;
    exitCode: number;
    stdoutSnippet: string;
  };

  // --- Spatial Failure Coordinates ---
  failureCoordinates: TraceFrame[];

  // --- Active Working Interface (Bounded Viewport) ---
  boundedViewport: {
    file: string;
    startLine: number;
    endLine: number;
    centerLine: number;
    viewportText: string;
  };

  // --- Factual Mutation History (Execution Receipts Only) ---
  priorFailedMutations: FailedMutationReceipt[];

  // --- Unresolved Status Statement ---
  unresolvedVerificationStatus: string;
}

export interface CompileHandoffInput {
  taskIntent: string;
  targetFile?: string;
  verificationCommand: string;
  verificationExitCode: number;
  verificationOutput: string;
  cwd?: string;
  turns?: ReadonlyArray<TrajectoryTurnRecord>;
  uncommittedDiff?: string;
  viewportRadius?: number;
}

/**
 * Deterministically compiles established state into a structured HandoffPacket.
 */
export function compileHandoffPacket(input: CompileHandoffInput): HandoffPacket {
  const cwd = input.cwd ?? process.cwd();
  const compilationTimestamp = new Date().toISOString();
  const radius = input.viewportRadius ?? 15;

  // 1. Extract deterministic failure coordinates from verification output
  const failureCoordinates = extractTraceFrames(input.verificationOutput, cwd);

  // 2. Resolve target file: explicit input > top in-tree trace frame > fallback
  let resolvedTargetFile = input.targetFile;
  if (!resolvedTargetFile && failureCoordinates.length > 0) {
    resolvedTargetFile = failureCoordinates[0].file;
  }
  resolvedTargetFile = resolvedTargetFile ? path.normalize(resolvedTargetFile).replace(/\\/g, '/') : 'UNKNOWN_TARGET';

  // 3. Resolve focus center line for bounded viewport
  let centerLine = 1;
  const matchingFrame = failureCoordinates.find(
    f => path.normalize(f.file).replace(/\\/g, '/') === resolvedTargetFile
  );
  if (matchingFrame) {
    centerLine = matchingFrame.line;
  } else if (failureCoordinates.length > 0) {
    centerLine = failureCoordinates[0].line;
  }

  // 4. Render bounded code viewport using v0.2 primitive
  const viewportResult = renderBoundedViewport(resolvedTargetFile, centerLine, {
    cwd,
    radius,
    showPointer: true,
  });

  const boundedViewport = {
    file: resolvedTargetFile,
    startLine: viewportResult.ok ? viewportResult.startLine : 1,
    endLine: viewportResult.ok ? viewportResult.endLine : 1,
    centerLine,
    viewportText: viewportResult.ok
      ? viewportResult.formatted
      : `[WTF BOUNDED VIEWPORT: Unable to project ${resolvedTargetFile}: ${viewportResult.error ?? 'file not found'}]`,
  };

  // 5. Extract Git repository state
  let modifiedFiles: string[] = [];
  let uncommittedDiff = input.uncommittedDiff !== undefined ? input.uncommittedDiff : '';
  try {
    const rawStatus = getGitStatus(cwd);
    modifiedFiles = [...new Set([...rawStatus.staged, ...rawStatus.unstaged, ...rawStatus.untracked])];

    if (input.uncommittedDiff === undefined) {
      const diffProc = safeGit(['diff'], cwd);
      uncommittedDiff = diffProc.status === 0 ? diffProc.stdout.trim() : '';
    }
  } catch {
    modifiedFiles = [];
    uncommittedDiff = input.uncommittedDiff !== undefined ? input.uncommittedDiff : '';
  }

  // Cap diff length to prevent token bloat
  const cappedDiff = uncommittedDiff.length > 2000
    ? uncommittedDiff.slice(0, 2000) + '\n... [diff truncated by handoff compiler]'
    : uncommittedDiff;

  // 6. Extract prior failed mutation receipts from trajectory ledger
  const priorFailedMutations: FailedMutationReceipt[] = [];
  if (input.turns) {
    for (const turn of input.turns) {
      if (turn.canonicalAction === 'MUTATION') {
        const isEnacted = turn.actionStatus === 'success';
        const isFailing = turn.verificationExecuted && turn.verificationPassed === false;

        if (!isEnacted || isFailing) {
          const rawArgs = turn.rawActionArgs ?? {};
          const snippet = (
            rawArgs.replacement ??
            rawArgs.content ??
            rawArgs.new_text ??
            rawArgs.newText ??
            ''
          ).slice(0, 150);

          const err = (turn.verificationOutputSnippet ?? turn.actionRejectionReason ?? '').slice(0, 180);

          priorFailedMutations.push({
            turnIndex: turn.turnIndex,
            targetFile: turn.declaredTargetFile ?? resolvedTargetFile,
            attemptedSnippet: snippet || '[snippet omitted]',
            enactedStatus: turn.actionStatus,
            resultingVerificationError: err || '[no error diagnostic recorded]',
          });
        }
      }
    }
  }

  // 7. Assemble factual unresolved status
  const unresolvedVerificationStatus =
    `Verification command \`${input.verificationCommand}\` exited with non-zero code ${input.verificationExitCode} on ${resolvedTargetFile}.`;

  return {
    version: '0.3.0',
    compilationTimestamp,
    taskIntent: input.taskIntent,
    targetFile: resolvedTargetFile,
    repositoryState: {
      modifiedFiles,
      uncommittedDiff: cappedDiff || 'No uncommitted modifications (clean baseline)',
    },
    currentVerification: {
      command: input.verificationCommand,
      exitCode: input.verificationExitCode,
      stdoutSnippet: input.verificationOutput.slice(0, 800),
    },
    failureCoordinates,
    boundedViewport,
    priorFailedMutations,
    unresolvedVerificationStatus,
  };
}

/**
 * Renders a clean, zero-ANSI markdown continuation document matching the
 * Phase 8.4A / 8.4B compiled working interface contract.
 */
export function formatHandoffMarkdown(packet: HandoffPacket): string {
  const coordsStr = packet.failureCoordinates.length > 0
    ? packet.failureCoordinates.map(f => `${f.file}:${f.line}`).join(', ')
    : 'None extracted (see verification output)';

  let failedMutationsSection = '';
  if (packet.priorFailedMutations.length > 0) {
    failedMutationsSection = '\nPRIOR FAILED MUTATION RECEIPTS:\n';
    for (const mut of packet.priorFailedMutations) {
      failedMutationsSection += `  • Turn ${mut.turnIndex} on ${mut.targetFile} (status: ${mut.enactedStatus}):\n`;
      failedMutationsSection += `    Attempt: ${mut.attemptedSnippet.replace(/\n/g, ' ')}\n`;
      failedMutationsSection += `    Resulting Error: ${mut.resultingVerificationError.replace(/\n/g, ' ')}\n`;
    }
  } else {
    failedMutationsSection = '\nPRIOR FAILED MUTATION RECEIPTS: None recorded prior to handoff.\n';
  }

  return `=== WTF COMPILED WORKING INTERFACE HANDOFF ===
WTF compiled the verified repository state directly into this continuation packet.
You do NOT need to rediscover file coordinates through unguided file reading.

TASK INTENT:
${packet.taskIntent}

TARGET FILE: ${packet.targetFile}
FAILURE COORDINATES: ${coordsStr}

BOUNDED CODE VIEWPORT (CURRENT WORKING CODE AT FAILURE COORDINATES):
${packet.boundedViewport.viewportText}

CURRENT REPOSITORY STATE:
${packet.repositoryState.uncommittedDiff}

CURRENT VERIFICATION OUTPUT:
${packet.currentVerification.stdoutSnippet}
${failedMutationsSection}
UNRESOLVED VERIFICATION STATUS:
${packet.unresolvedVerificationStatus}

ACTION REQUIRED:
Apply the verified correction to \`${packet.targetFile}\` using code modification.
`;
}
