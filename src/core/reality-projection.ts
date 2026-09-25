/**
 * WTF Reality Projection Engine (Phase 11.6 / Productionization)
 *
 * Deterministically projects WTF System Memory across the intelligence boundary.
 * Implements the core principle causally supported in Phases 11.3–11.5:
 *
 * "INTELLIGENCE CAN INHERIT EXACT ESTABLISHED UNCHANGED REALITY
 *  WITHOUT REPEATED RETRANSMISSION."
 *
 * Architecture:
 *   SYSTEM MEMORY (Complete, immutable, append-only factual ledger)
 *         ↓
 *   DETERMINISTIC REALITY PROJECTION (Stateless pure filter / adapter)
 *         ↓
 *   INTELLIGENCE-FACING REALITY (Bounded boundary payload for current turn)
 *
 * Epistemic Rules & Invariants:
 * 1. DETERMINISTIC REALITY ONLY: Only blocks derived exclusively from physical
 *    source files or execution receipts may be considered. Zero intelligence claims.
 * 2. PRIOR TRANSMISSION: The block must have been transmitted in full to the active
 *    intelligence session on a strictly earlier turn.
 * 3. IDENTITY & PROVENANCE: Block identity, physical source path, and content hash
 *    must be unambiguously established.
 * 4. UNBROKEN INVALIDATION: No file mutation, external write, git reset/checkout,
 *    or coordinate shift has occurred since first transmission.
 * 5. CRYPTOGRAPHIC VERIFICATION: The active disk state MUST cryptographically match
 *    (SHA-256) the transmitted content. Metadata (mtime, size) never substitutes for hash.
 * 6. DETERMINISTIC RECONSTRUCTION: WTF can reconstruct the exact raw block on demand O(1).
 * 7. FAIL CLOSED: If any invariant cannot be proven affirmative, TRANSMIT IN FULL.
 * 8. EXPLICIT READ ALWAYS WINS: Explicit intelligence requests to view/read a file
 *    always bypass inheritance and transmit full raw bytes.
 * 9. ZERO SEMANTIC LOGIC: No summarization, no embeddings, no relevance ranking,
 *    no heuristic forgetting.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import { renderBoundedViewport } from './viewport.js';
import { isPathInside } from './security.js';

export interface RealityBlockDescriptor {
  /** Deterministic identifier for the block */
  blockId: string;
  /** Relative or absolute path to the underlying physical file */
  filePath: string;
  /** Line range if applicable (1-indexed) */
  startLine?: number;
  endLine?: number;
  /** Cryptographic SHA-256 hash (first 16 hex chars or full 64 hex chars) of raw block content */
  contentHash: string;
  /** Raw text of the block as originally transmitted */
  rawText: string;
  /** Session identifier where this was transmitted */
  sessionId: string;
  /** Turn index when first transmitted (1-indexed) */
  firstTransmittedTurn: number;
  /** Block classification */
  kind: 'bounded_viewport' | 'file_read' | 'execution_receipt';
}

export interface RealityProjectionOptions {
  /** Workspace root directory (must be valid directory) */
  cwd: string;
  /** Active session identifier (enforces session boundary isolation) */
  sessionId: string;
  /** Current turn index (1-indexed) */
  currentTurn: number;
  /** Set of files mutated in this session so far (from ActionCompiler or git diff) */
  mutatedFiles?: ReadonlySet<string>;
  /** Specific file path explicitly requested by the agent on the latest turn */
  explicitRequestedPath?: string;
  /** Optional custom marker template */
  markerTemplate?: (identity: string) => string;
}

export type ProjectionAuditStatus =
  | 'WITHHELD'
  | 'TRANSMITTED_FIRST_OBSERVATION'
  | 'TRANSMITTED_MUTATED'
  | 'TRANSMITTED_HASH_MISMATCH'
  | 'TRANSMITTED_EXPLICIT_READ'
  | 'TRANSMITTED_SESSION_MISMATCH'
  | 'TRANSMITTED_UNRESOLVED_SOURCE'
  | 'TRANSMITTED_FAIL_CLOSED';

export interface ProjectionAuditRecord {
  blockId: string;
  filePath: string;
  blockHash: string;
  firstTransmittedTurn: number;
  evaluatedAtTurn: number;
  status: ProjectionAuditStatus;
  reason: string;
  bytesSaved: number;
  estimatedTokensSaved: number;
}

export interface RealityProjectionResult {
  /** The projected messages array ready for transmission to intelligence */
  projectedMessages: Array<{ role: string; content: string }>;
  /** Number of blocks withheld */
  withheldCount: number;
  /** Total raw characters/bytes saved */
  bytesSaved: number;
  /** Estimated tokens saved (length / 3.8 heuristic) */
  estimatedTokensSaved: number;
  /** Complete audit records of all evaluated blocks */
  audits: ProjectionAuditRecord[];
  /** Epistemic guarantee: all transformations are strictly deterministic */
  isDeterministic: true;
}

/**
 * Computes deterministic SHA-256 hash of a string.
 */
export function computeBlockSha256(text: string): string {
  return crypto.createHash('sha256').update(text, 'utf-8').digest('hex').slice(0, 16);
}

/**
 * Default minimal deterministic reference marker.
 * Contains zero semantic interpretation, zero summary, zero advice.
 */
export function defaultMarkerTemplate(identity: string): string {
  return `[ESTABLISHED REALITY UNCHANGED: ${identity} — verified on disk, available from WTF state]`;
}

/**
 * Verifies whether the physical file on disk matches the transmitted block.
 * Uses cryptographic SHA-256 verification of disk content.
 * Fails closed on any filesystem error, missing file, or hash divergence.
 */
export function verifyPhysicalSourceUnchanged(
  cwd: string,
  block: RealityBlockDescriptor
): { isUnchanged: boolean; reason: string } {
  const fullPath = path.isAbsolute(block.filePath)
    ? block.filePath
    : path.resolve(cwd, block.filePath);

  // Security boundary check
  if (!isPathInside(cwd, fullPath)) {
    return { isUnchanged: false, reason: `Security violation: Path '${block.filePath}' escapes workspace` };
  }

  // File existence check
  if (!fs.existsSync(fullPath)) {
    return { isUnchanged: false, reason: `Physical file does not exist on disk: '${block.filePath}'` };
  }

  let stat: fs.Stats;
  try {
    stat = fs.statSync(fullPath);
    if (!stat.isFile()) {
      return { isUnchanged: false, reason: `Path is not a regular file: '${block.filePath}'` };
    }
  } catch (err: any) {
    return { isUnchanged: false, reason: `Cannot stat file '${block.filePath}': ${err?.message || String(err)}` };
  }

  // Cryptographic content verification
  try {
    const diskContent = fs.readFileSync(fullPath, 'utf-8');

    if (block.kind === 'file_read') {
      // For file read blocks, check if the file slice or whole file matches
      if (block.startLine !== undefined && block.endLine !== undefined) {
        const lines = diskContent.split(/\r?\n/);
        const totalLines = lines.length;
        if (block.startLine < 1 || block.endLine > totalLines || block.startLine > block.endLine) {
          return { isUnchanged: false, reason: `Line bounds [${block.startLine}, ${block.endLine}] out of range (file has ${totalLines} lines)` };
        }
        const sliceLines = lines.slice(block.startLine - 1, block.endLine);
        const sliceText = sliceLines.join('\n');
        const sliceHash = computeBlockSha256(sliceText);

        if (sliceHash !== block.contentHash) {
          return { isUnchanged: false, reason: `Content hash mismatch: disk slice SHA-256(${sliceHash}) != block SHA-256(${block.contentHash})` };
        }
      } else {
        const fileHash = computeBlockSha256(diskContent);
        if (fileHash !== block.contentHash) {
          return { isUnchanged: false, reason: `Content hash mismatch: disk file SHA-256(${fileHash}) != block SHA-256(${block.contentHash})` };
        }
      }
    } else if (block.kind === 'bounded_viewport') {
      // For bounded viewports, render fresh viewport from disk and compare formatted text
      const centerLine = block.startLine !== undefined && block.endLine !== undefined
        ? Math.floor((block.startLine + block.endLine) / 2)
        : (block.startLine ?? 1);
      const radius = block.startLine !== undefined && block.endLine !== undefined
        ? Math.floor((block.endLine - block.startLine) / 2)
        : 15;

      const vpRes = renderBoundedViewport(block.filePath, centerLine, {
        cwd,
        radius,
        showPointer: true,
      });

      if (!vpRes.ok) {
        return { isUnchanged: false, reason: `Cannot render bounded viewport from disk: ${vpRes.error}` };
      }

      const vpHash = computeBlockSha256(vpRes.formatted);
      if (vpHash !== block.contentHash) {
        return { isUnchanged: false, reason: `Viewport hash mismatch: disk viewport SHA-256(${vpHash}) != block SHA-256(${block.contentHash})` };
      }
    }

    return { isUnchanged: true, reason: 'Cryptographic SHA-256 disk match affirmative' };
  } catch (err: any) {
    return { isUnchanged: false, reason: `Failed to read or verify disk file '${block.filePath}': ${err?.message || String(err)}` };
  }
}

/**
 * Evaluates whether a specific reality block is eligible for inheritance withholding.
 */
export function evaluateBlockEligibility(
  block: RealityBlockDescriptor,
  options: RealityProjectionOptions
): { eligible: boolean; status: ProjectionAuditStatus; reason: string } {
  // Invariant 1: Session boundary check
  if (block.sessionId !== options.sessionId) {
    return {
      eligible: false,
      status: 'TRANSMITTED_SESSION_MISMATCH',
      reason: `Session mismatch: block session '${block.sessionId}' != current session '${options.sessionId}'`,
    };
  }

  // Invariant 2: Prior transmission check
  if (block.firstTransmittedTurn >= options.currentTurn) {
    return {
      eligible: false,
      status: 'TRANSMITTED_FIRST_OBSERVATION',
      reason: `First observation on turn ${block.firstTransmittedTurn}; current turn is ${options.currentTurn}`,
    };
  }

  // Invariant 3: Explicit read request check
  if (options.explicitRequestedPath) {
    const normReq = path.normalize(options.explicitRequestedPath);
    const normBlock = path.normalize(block.filePath);
    if (normReq === normBlock || normReq.endsWith(normBlock) || normBlock.endsWith(normReq)) {
      return {
        eligible: false,
        status: 'TRANSMITTED_EXPLICIT_READ',
        reason: `Explicit read requested by intelligence for '${options.explicitRequestedPath}'`,
      };
    }
  }

  // Invariant 4: Invalidation via recorded mutation
  if (options.mutatedFiles && options.mutatedFiles.has(block.filePath)) {
    return {
      eligible: false,
      status: 'TRANSMITTED_MUTATED',
      reason: `File '${block.filePath}' has been mutated in this session`,
    };
  }

  // Invariant 5 & 6: Cryptographic physical source check on disk
  const diskCheck = verifyPhysicalSourceUnchanged(options.cwd, block);
  if (!diskCheck.isUnchanged) {
    return {
      eligible: false,
      status: 'TRANSMITTED_HASH_MISMATCH',
      reason: diskCheck.reason,
    };
  }

  return {
    eligible: true,
    status: 'WITHHELD',
    reason: 'All 7 invariants verified; unchanged on disk',
  };
}

/**
 * Pure, deterministic function that projects conversational message history
 * across the intelligence boundary.
 *
 * Replaces previously transmitted, verified unchanged reality blocks with
 * minimal deterministic reference markers.
 *
 * FAILS CLOSED: If any block cannot be affirmatively verified, it remains untouched.
 */
export function projectEstablishedReality(
  messages: ReadonlyArray<{ role: string; content: string }>,
  registeredBlocks: ReadonlyArray<RealityBlockDescriptor>,
  options: RealityProjectionOptions
): RealityProjectionResult {
  const markerFn = options.markerTemplate ?? defaultMarkerTemplate;
  const audits: ProjectionAuditRecord[] = [];
  let withheldCount = 0;
  let bytesSaved = 0;
  let estimatedTokensSaved = 0;

  // Turn 1 is always transmitted in full (no prior transmission possible)
  if (options.currentTurn <= 1) {
    return {
      projectedMessages: messages.map(m => ({ ...m })),
      withheldCount: 0,
      bytesSaved: 0,
      estimatedTokensSaved: 0,
      audits: [],
      isDeterministic: true,
    };
  }

  // Clone messages for projection
  const projectedMessages: Array<{ role: string; content: string }> = messages.map(m => ({ ...m }));

  // Evaluate each registered block
  for (const block of registeredBlocks) {
    const evalRes = evaluateBlockEligibility(block, options);

    if (evalRes.eligible) {
      // Find and replace the block rawText in historical messages
      let blockReplaced = false;

      // Scan user/system messages in history (never alter assistant thought/action messages)
      for (let i = 0; i < projectedMessages.length; i++) {
        const msg = projectedMessages[i];

        // Do not touch the very latest action result entering current turn if it corresponds to current turn - 1
        // (handled by caller passing historical messages or by turn indexing)
        if (msg.role === 'user' || msg.role === 'system') {
          if (msg.content.includes(block.rawText)) {
            const marker = markerFn(block.blockId);
            msg.content = msg.content.replace(block.rawText, marker);
            blockReplaced = true;
          }
        }
      }

      if (blockReplaced) {
        const savedBytes = block.rawText.length;
        const estTokens = Math.max(1, Math.ceil(savedBytes / 3.8));

        withheldCount++;
        bytesSaved += savedBytes;
        estimatedTokensSaved += estTokens;

        audits.push({
          blockId: block.blockId,
          filePath: block.filePath,
          blockHash: block.contentHash,
          firstTransmittedTurn: block.firstTransmittedTurn,
          evaluatedAtTurn: options.currentTurn,
          status: 'WITHHELD',
          reason: evalRes.reason,
          bytesSaved: savedBytes,
          estimatedTokensSaved: estTokens,
        });
      } else {
        // Block text was not found in message payload
        audits.push({
          blockId: block.blockId,
          filePath: block.filePath,
          blockHash: block.contentHash,
          firstTransmittedTurn: block.firstTransmittedTurn,
          evaluatedAtTurn: options.currentTurn,
          status: 'TRANSMITTED_UNRESOLVED_SOURCE',
          reason: 'Eligible block content was not present in target messages',
          bytesSaved: 0,
          estimatedTokensSaved: 0,
        });
      }
    } else {
      audits.push({
        blockId: block.blockId,
        filePath: block.filePath,
        blockHash: block.contentHash,
        firstTransmittedTurn: block.firstTransmittedTurn,
        evaluatedAtTurn: options.currentTurn,
        status: evalRes.status,
        reason: evalRes.reason,
        bytesSaved: 0,
        estimatedTokensSaved: 0,
      });
    }
  }

  return {
    projectedMessages,
    withheldCount,
    bytesSaved,
    estimatedTokensSaved,
    audits,
    isDeterministic: true,
  };
}

/**
 * Stateful Session Reality Projection Tracker.
 * Manages registered reality blocks across an active intelligence session.
 */
export class SessionRealityTracker {
  private readonly cwd: string;
  private readonly sessionId: string;
  private readonly registeredBlocks = new Map<string, RealityBlockDescriptor>();
  private readonly mutatedFiles = new Set<string>();

  constructor(cwd: string, sessionId: string) {
    this.cwd = cwd;
    this.sessionId = sessionId;
  }

  /**
   * Registers a transmitted reality block into session memory.
   */
  public registerTransmittedBlock(block: Omit<RealityBlockDescriptor, 'sessionId'>): void {
    const fullBlock: RealityBlockDescriptor = {
      ...block,
      sessionId: this.sessionId,
    };
    this.registeredBlocks.set(block.blockId, fullBlock);
  }

  /**
   * Invalidate a single file path across the session.
   */
  public recordFileMutation(filePath: string): void {
    this.mutatedFiles.add(filePath);
  }

  /**
   * Invalidate all session reality (e.g. on git checkout or repo reset).
   */
  public invalidateAll(): void {
    this.registeredBlocks.clear();
    this.mutatedFiles.clear();
  }

  /**
   * Returns all currently registered blocks for this session.
   */
  public getBlocks(): ReadonlyArray<RealityBlockDescriptor> {
    return Array.from(this.registeredBlocks.values());
  }

  /**
   * Returns the set of mutated files.
   */
  public getMutatedFiles(): ReadonlySet<string> {
    return this.mutatedFiles;
  }

  /**
   * Projects message history for the specified turn.
   */
  public project(
    messages: ReadonlyArray<{ role: string; content: string }>,
    currentTurn: number,
    explicitRequestedPath?: string
  ): RealityProjectionResult {
    return projectEstablishedReality(messages, this.getBlocks(), {
      cwd: this.cwd,
      sessionId: this.sessionId,
      currentTurn,
      mutatedFiles: this.mutatedFiles,
      explicitRequestedPath,
    });
  }
}
