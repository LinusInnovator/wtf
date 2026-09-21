import type { AnalyzeResult } from '../core/evidence.js';
import type { CanonicalEvidenceDocumentV0 } from '../core/protocol-v0.js';

export interface FormatJsonOptions {
  pretty?: boolean;
  legacy?: boolean;
}

/**
 * Format WTF evidence as deterministic, machine-readable JSON.
 *
 * Invariant:
 * Exposes canonical Protocol v0 evidence graph with explicit schema versioning (wtf/protocol-v0).
 * Does not conflate canonical Protocol v0 with legacy wtf/0.1 schemas.
 *
 * Legacy wtf/0.1 receipt format is available via options.legacy or in the .legacy envelope.
 */
export function formatJson(
  result: AnalyzeResult | CanonicalEvidenceDocumentV0,
  options: boolean | FormatJsonOptions = true
): string {
  const pretty = typeof options === 'boolean' ? options : options.pretty ?? true;
  const legacy = typeof options === 'object' && options.legacy === true;

  if (legacy && 'receipt' in result) {
    return JSON.stringify(result.receipt, null, pretty ? 2 : undefined);
  }

  const doc: CanonicalEvidenceDocumentV0 = 'evidence' in result ? result.evidence : result;
  const legacyReceipt = 'receipt' in result ? result.receipt : undefined;

  const payload = {
    spec: doc.spec,
    version: doc.version,
    timestamp: doc.timestamp,
    repo: doc.repo,
    change: doc.change,
    diagnostic: doc.diagnostic,
    relation: doc.relation,
    verification: doc.verification,
    unknown: doc.unknown,
    ...(legacyReceipt ? { legacy: legacyReceipt } : {}),
  };

  return JSON.stringify(payload, null, pretty ? 2 : undefined);
}
