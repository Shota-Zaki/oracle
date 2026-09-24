// Dependency-free runtime tests, separate from the full upstream Vitest/build gate.
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { stripTypeScriptTypes } from 'node:module';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'oracle-zakko-test-'));
try {
  await fs.writeFile(path.join(temporary, 'package.json'), '{"type":"module"}\n');
  for (const name of await fs.readdir(path.join(root, 'src/zakko'))) {
    if (!name.endsWith('.ts') || name === 'mcp.ts') continue;
    const source = await fs.readFile(path.join(root, 'src/zakko', name), 'utf8');
    await fs.writeFile(path.join(temporary, name.replace(/\.ts$/, '.js')), stripTypeScriptTypes(source, { mode: 'transform' }));
  }
  // Parse changed entry adapters too, without pretending this resolves their dependencies.
  const entries = ["src/remote/server.ts", "src/browser/config.ts", "src/browser/configLogging.ts", "src/oracle/files.ts", "src/zakko/mcp.ts", "src/mcp/server.ts", "src/cli/help.ts", "bin/oracle-ops.ts"];
  for (const file of entries) stripTypeScriptTypes(await fs.readFile(path.join(root, file), "utf8"), { mode: "transform" });
  console.log(`# Entry syntax transform: ${entries.length} sources; not a dependency/type check`);
  const queue = await fs.readFile(path.join(root, 'src/remote/runSlots.ts'), 'utf8');
  await fs.writeFile(path.join(temporary, 'runSlots.js'), stripTypeScriptTypes(queue, { mode: 'transform' }));
  const test = path.join(root, 'tests/zakko/policy.test.mjs');
  const result = spawnSync(process.execPath, ['--test', '--test-concurrency=1', test], {
    stdio: 'inherit', env: { ...process.env, ZAKKO_TEST_MODULES: temporary },
  });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} finally { await fs.rm(temporary, { recursive: true, force: true }); }
