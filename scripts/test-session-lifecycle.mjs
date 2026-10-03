// Execute the real formatter with Node24; separate from Vitest/typecheck/build.
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
  for (const file of ['src/zakko/copy.ts', 'src/cli/sessionLifecycle.ts']) {
    const target = path.join(temporary, file.replace(/\.ts$/, '.js'));
    await fs.mkdir(path.dirname(target), { recursive: true });
    const source = await fs.readFile(path.join(root, file), 'utf8');
    await fs.writeFile(target, stripTypeScriptTypes(source, { mode: 'transform' }));
  }
  const result = spawnSync(process.execPath, ['--test', path.join(root, 'tests/zakko/sessionLifecycle.test.mjs')], {
    stdio: 'inherit', env: { ...process.env, ZAKKO_LIFECYCLE_MODULES: temporary },
  });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} finally {
  await fs.rm(temporary, { recursive: true, force: true });
}
