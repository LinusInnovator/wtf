#!/usr/bin/env bash
set -euo pipefail

# WTF Deterministic Launch Demo
# Demonstrates: Agent claims done -> WTF catches skipped test & debug log -> Agent fixes -> WTF verify passes

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
WTF_BIN="${WTF_BIN:-$REPO_ROOT/bin/wtf.js}"

DEMO_DIR="$(mktemp -d /tmp/wtf-demo-XXXXXX)"
trap 'rm -rf "$DEMO_DIR"' EXIT

echo "Setting up demo repository at $DEMO_DIR..."

cd "$DEMO_DIR"

git init -q
git config user.email "demo@example.com"
git config user.name "Demo User"

cat << 'EOF' > package.json
{
  "name": "payment-service",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "test": "node --test test/*.test.js"
  }
}
EOF

mkdir -p src test
cat << 'EOF' > src/charge.js
export function calculateCharge(amount, discount = 0) {
  if (discount > amount) return 0;
  return amount - discount;
}
EOF

cat << 'EOF' > test/charge.test.js
import test from 'node:test';
import assert from 'node:assert';
import { calculateCharge } from '../src/charge.js';

test('calculates basic charge', () => {
  assert.strictEqual(calculateCharge(100, 10), 90);
});

test('clamps discount to zero', () => {
  assert.strictEqual(calculateCharge(50, 100), 0);
});
EOF

git add .
git commit -qm "Initial commit"

echo ""

echo "========================================================="
echo "STEP 1: AGENT COMPLETION CLAIM"
echo "========================================================="
echo "Agent: 'Done! Added VIP coupon support and confirmed all tests pass.'"

# Agent introduces changes: adds feature, but leaves a console.log and skips edge-case test
cat << 'EOF' > src/charge.js
export function calculateCharge(amount, discount = 0, isVip = false) {
  console.log("DEBUG: charge calculation", { amount, discount, isVip });
  const finalDiscount = isVip ? discount * 1.5 : discount;
  if (finalDiscount > amount) return 0;
  return amount - finalDiscount;
}
EOF

cat << 'EOF' > test/charge.test.js
import test from 'node:test';
import assert from 'node:assert';
import { calculateCharge } from '../src/charge.js';

test('calculates basic charge', () => {
  assert.strictEqual(calculateCharge(100, 10), 90);
});

test.skip('handles VIP coupon cap calculation', () => {
  assert.strictEqual(calculateCharge(100, 80, true), 0);
});
EOF

echo ""
echo "========================================================="
echo "STEP 2: RUN WTF ($ wtf)"
echo "========================================================="
node "$WTF_BIN" || true

echo ""
echo "========================================================="
echo "STEP 3: AGENT RESPONDS TO EVIDENCE & FIXES ISSUES"
echo "========================================================="
echo "Agent: 'Fixing debug log leftover in src/charge.js and un-skipping test in test/charge.test.js...'"

cat << 'EOF' > src/charge.js
export function calculateCharge(amount, discount = 0, isVip = false) {
  const finalDiscount = isVip ? discount * 1.5 : discount;
  if (finalDiscount > amount) return 0;
  return amount - finalDiscount;
}
EOF

cat << 'EOF' > test/charge.test.js
import test from 'node:test';
import assert from 'node:assert';
import { calculateCharge } from '../src/charge.js';

test('calculates basic charge', () => {
  assert.strictEqual(calculateCharge(100, 10), 90);
});

test('handles VIP coupon cap calculation', () => {
  assert.strictEqual(calculateCharge(100, 80, true), 0);
});
EOF

echo ""
echo "========================================================="
echo "STEP 4: RUN WTF VERIFY ($ wtf verify)"
echo "========================================================="
node "$WTF_BIN" verify || true

echo ""
echo "========================================================="
echo "DEMO COMPLETE: Clean, independently verified receipt."
echo "========================================================="
