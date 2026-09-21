import fs from 'node:fs';
import path from 'node:path';
import { analyzeRepo } from './core/evidence.js';
import { formatTerminal } from './formatters/terminal.js';
import { formatShow } from './formatters/show.js';
import { formatJson } from './formatters/json.js';
import { formatAgent } from './formatters/agent.js';

const VERSION = '0.1.0';

export function runCli(args: string[] = process.argv.slice(2)): void {
  let isJson = false;
  let isVerify = false;
  let isShow = false;
  let isCheck = false;
  let isAgent = false;
  let commit: string | undefined;
  let range: string | undefined;
  let stagedOnly = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--version' || arg === '-v') {
      console.log(`wtf v${VERSION}`);
      process.exit(0);
    }

    if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }

    if (arg === '--json' || arg === '-j') {
      isJson = true;
    } else if (arg === 'check') {
      isCheck = true;
      isVerify = true;
      isAgent = true;
    } else if (arg === '--agent') {
      isAgent = true;
    } else if (arg === 'verify') {
      isVerify = true;
    } else if (arg === 'show') {
      isShow = true;
    } else if (arg === '--verify') {
      isVerify = true;
    } else if (arg === '--staged' || arg === '-s') {
      stagedOnly = true;
    } else if (arg === '--commit' || arg === '-c') {
      commit = args[++i];
      if (!commit) {
        console.error('Error: --commit requires a commit reference');
        process.exit(1);
      }
    } else if (arg === '--range' || arg === '-r') {
      range = args[++i];
      if (!range) {
        console.error('Error: --range requires a revision range');
        process.exit(1);
      }
    } else if (arg.includes('..')) {
      range = arg;
    } else if (arg === 'init-agent') {
      const printOnly = args.includes('--print') || args.includes('-p');
      initAgentInstructions(printOnly);
      process.exit(0);
    }
  }

  try {
    const result = analyzeRepo(process.cwd(), {
      verify: isVerify,
      commit,
      range,
      stagedOnly,
    });

    if (isJson) {
      console.log(formatJson(result));
    } else if (isCheck || isAgent) {
      console.log(formatAgent(result));
    } else if (isShow) {
      console.log(formatShow(result));
    } else {
      console.log(formatTerminal(result));
    }

    /**
     * Exit Code Semantics:
     * 0: SUCCESS / OBSERVED
     *    - Observation mode: repository analysis complete.
     *    - Verification mode: all executed verification checks passed (or no failures established).
     *    - Mechanical observations (auth changes, migrations, deps, skips) are reported as evidence
     *      and NEVER cause non-zero exit codes.
     * 1: VERIFICATION_FAILED
     *    - Verification executed and deterministically established failure (TESTS_FAILED or BUILD_FAILED).
     * 2: VERIFICATION_INCOMPLETE
     *    - Verification was actively requested, but execution was interrupted (TIMEOUT) or could not be invoked (INVOCATION_FAILED).
     * 3: TOOL_EXECUTION_ERROR
     *    - Fatal error or unhandled exception in WTF tool execution.
     */
    const hasFailedVerif =
      isVerify &&
      result.evidence.verification.items.some(
        (v) => v.status === 'FAILED' || v.lifecycle === 'TESTS_FAILED' || v.lifecycle === 'BUILD_FAILED'
      );
    const hasIncompleteVerif =
      isVerify &&
      result.evidence.verification.items.some(
        (v) => v.status === 'TIMEOUT' || v.lifecycle === 'TIMEOUT' || v.lifecycle === 'INVOCATION_FAILED'
      );

    if (hasFailedVerif) {
      process.exit(1);
    } else if (hasIncompleteVerif) {
      process.exit(2);
    }
  } catch (err: any) {
    if (isJson) {
      console.error(JSON.stringify({ error: err.message }));
    } else {
      console.error(`\x1b[31mError:\x1b[0m ${err.message}`);
    }
    process.exit(3);
  }
}

function printHelp(): void {
  console.log(`
\x1b[1m\x1b[36mWTF\x1b[0m — Developer Evidence Engine (v${VERSION})
See what changed, what actually worked, and what deserves attention.

\x1b[1mUSAGE:\x1b[0m
  $ wtf                 Inspect what just changed (read-only)
  $ wtf check           Verify tests, inspect changes & emit token-dense agent report (1 turn)
  $ wtf verify          Run discovered project checks and generate verified receipt
  $ wtf show            Drill down into evidence findings and diff snippets
  $ wtf --json          Output machine-readable wtf/0.1 JSON schema for agents

\x1b[1mOPTIONS:\x1b[0m
  -j, --json            Emit machine-readable JSON (spec: wtf/0.1)
      --agent           Emit token-dense markdown formatted for AI agents
  -s, --staged          Analyze only staged git changes
  -c, --commit <hash>   Analyze a specific commit
  -r, --range <rev..rev> Analyze a git revision range (e.g. main..HEAD)
      --verify          Execute test/typecheck runners
  -h, --help            Show this help message
  -v, --version         Show version

\x1b[1mSUBCOMMANDS:\x1b[0m
  check                 Single-turn verification and change inspection for coding agents
  verify                Run detected project test and build targets
  show                  Display detailed evidence ledger
  init-agent            Configure autonomous agent completion protocol in repo (use --print for dry-run)

\x1b[1mEVIDENCE TIERS:\x1b[0m
  REPORTED  Claims from external sources / commit messages
  OBSERVED  Directly observed in git diff & repository state
  VERIFIED  Independently executed checks (tests, typecheck, build)
  UNKNOWN   Unverified checks or unprovable intent

\x1b[1mEXIT CODES:\x1b[0m
  0  Success / evidence observed (all executed checks passed, or observation complete)
  1  Verification failed (tests or compilation deterministically failed)
  2  Verification incomplete (timeout or invocation failure during active verification)
  3  Tool execution error (fatal error in WTF CLI execution)
`);
}

function initAgentInstructions(printOnly = false): void {
  const protocol = [
    '## Task Completion Protocol with WTF',
    'Before declaring any coding task complete:',
    '1. Run `wtf check` (or `npx agent-wtf check`). This verifies tests, inspects changes, and surfaces risks in a single turn.',
    '2. If checks fail under `[FAILED]` or critical items appear under `[PAY ATTENTION]`, resolve them.',
    '3. Attach the one-line `WTF-RECEIPT:` to your final completion report.',
    '4. Epistemic boundary: passing checks prove only that executed tests passed, not that overall user intent or requirements are met.'
  ].join('\n');

  if (printOnly) {
    console.log(`\n### WTF Agent Completion Protocol (For AGENTS.md / CLAUDE.md / .cursorrules)\n\n${protocol}\n`);
    return;
  }

  const cwd = process.cwd();
  const targets = ['AGENTS.md'];
  if (fs.existsSync(path.join(cwd, 'CLAUDE.md'))) targets.push('CLAUDE.md');
  if (fs.existsSync(path.join(cwd, '.cursorrules'))) targets.push('.cursorrules');
  if (fs.existsSync(path.join(cwd, '.github'))) targets.push('.github/copilot-instructions.md');

  console.log(`\n\x1b[1m\x1b[36mWTF\x1b[0m — Configuring Autonomous Agent Protocol\n`);

  for (const relPath of targets) {
    const filePath = path.join(cwd, relPath);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('Task Completion Protocol with WTF') || content.includes('agent-wtf check')) {
        console.log(`  \x1b[32m✓\x1b[0m ${relPath} already includes WTF protocol.`);
      } else {
        fs.appendFileSync(filePath, `\n\n${protocol}\n`);
        console.log(`  \x1b[32m✓\x1b[0m Appended WTF Completion Protocol to ${relPath}`);
      }
    } else {
      fs.writeFileSync(filePath, `# Agent Guidelines\n\n${protocol}\n`);
      console.log(`  \x1b[32m✓\x1b[0m Created ${relPath} with WTF Completion Protocol`);
    }
  }

  console.log(`\n\x1b[32mAutonomous protocol active:\x1b[0m Coding agents in this repository will now run WTF and verify work before concluding tasks.\n`);
}

// Run CLI when invoked as script
runCli();
