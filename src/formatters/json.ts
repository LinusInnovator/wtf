import type { AnalyzeResult } from '../core/evidence.js';

export function formatJson(result: AnalyzeResult, pretty: boolean = true): string {
  return JSON.stringify(result.receipt, null, pretty ? 2 : undefined);
}
