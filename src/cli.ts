import { analyzeRepo } from './core/evidence.js';
import { formatTerminal } from './formatters/terminal.js';
import { formatShow } from './formatters/show.js';
import { formatJson } from './formatters/json.js';

const VERSION = '0.1.0';

export function runCli(args: string[] = process.argv.slice(2)): void {
  let isJson = false;
  let isVerify = false;
  let isShow = false;
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
      printAgentInstructions();
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
    } else if (isShow) {
      console.log(formatShow(result));
    } else {
      console.log(formatTerminal(result));
    }

    // If verification was run and failed, exit code 1
    if (isVerify && result.receipt.verification.some((v) => v.status === 'FAILED')) {
      process.exit(1);
    }
  } catch (err: any) {
    if (isJson) {
      console.error(JSON.stringify({ error: err.message }));
    } else {
      console.error(`\x1b[31mError:\x1b[0m ${err.message}`);
    }
    process.exit(1);
  }
}

function printHelp(): void {
  console.log(`
\x1b[1m\x1b[36mWTF\x1b[0m — Developer Evidence Engine (v${VERSION})
See what changed, what actually worked, and what deserves attention.

\x1b[1mUSAGE:\x1b[0m
  $ wtf                 Inspect what just changed (read-only)
  $ wtf verify          Run discovered project checks and generate verified receipt
  $ wtf show            Drill down into evidence findings and diff snippets
  $ wtf --json          Output machine-readable wtf/0.1 JSON schema for agents

\x1b[1mOPTIONS:\x1b[0m
  -j, --json            Emit machine-readable JSON (spec: wtf/0.1)
  -s, --staged          Analyze only staged git changes
  -c, --commit <hash>   Analyze a specific commit
  -r, --range <rev..rev> Analyze a git revision range (e.g. main..HEAD)
      --verify          Execute test/typecheck runners
  -h, --help            Show this help message
  -v, --version         Show version

\x1b[1mSUBCOMMANDS:\x1b[0m
  verify                Run detected project test and build targets
  show                  Display detailed evidence ledger
  init-agent            Print agent completion instruction template

\x1b[1mEVIDENCE TIERS:\x1b[0m
  REPORTED  Claims from external sources / commit messages
  OBSERVED  Directly observed in git diff & repository state
  VERIFIED  Independently executed and validated by WTF
  UNKNOWN   Unverified or missing evidence
`);
}

function printAgentInstructions(): void {
  console.log(`
### WTF Agent Completion Protocol (For AGENTS.md / CLAUDE.md / .cursorrules)

Add the following to your agent instructions:

\`\`\`markdown
## Task Completion Protocol with WTF
Before declaring any coding task complete:
1. Run \`wtf\` (or \`wtf --json\`) to inspect all changes.
2. Review all items under PAY ATTENTION and ALSO.
3. If tests or typechecks exist, run \`wtf verify\` to independently validate them.
4. Never describe code as verified unless WTF marks it VERIFIED.
5. If unresolved findings exist (e.g. skipped tests, debug leftovers, migration risks), fix them or document them in your final report.
\`\`\`
`);
}

// Run CLI when invoked as script
runCli();
