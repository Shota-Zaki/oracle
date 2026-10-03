// Execute actual CLI copy and validation diagnostics with Node24; separate from full gates.
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { stripTypeScriptTypes } from 'node:module';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'oracle-lifecycle-test-'));
try {
  await fs.writeFile(path.join(temporary, 'package.json'), '{"type":"module"}\n');
  for (const file of [
    'src/zakko/copy.ts', 'src/cli/sessionLifecycle.ts', 'src/cli/reattachGuidance.ts',
    'src/cli/errorUtils.ts',
    'src/cli/stdin.ts', 'src/cli/docsCheck.ts',
  ]) {
    const target = path.join(temporary, file.replace(/\.ts$/, '.js'));
    await fs.mkdir(path.dirname(target), { recursive: true });
    const source = await fs.readFile(path.join(root, file), 'utf8');
    await fs.writeFile(target, stripTypeScriptTypes(source, { mode: 'transform' }));
  }
  const result = spawnSync(process.execPath, [
    '--test',
    path.join(root, 'tests/zakko/sessionLifecycle.node.mjs'),
    path.join(root, 'tests/zakko/reattachGuidance.node.mjs'),
    path.join(root, 'tests/zakko/errorUtils.node.mjs'),
    path.join(root, 'tests/zakko/validationCopy.node.mjs'),
  ], {
    stdio: 'inherit', env: { ...process.env, ZAKKO_LIFECYCLE_MODULES: temporary },
  });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} finally {
  await fs.rm(temporary, { recursive: true, force: true });
}
