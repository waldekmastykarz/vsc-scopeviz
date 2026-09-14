import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const args = process.argv.slice(2);
const check = args.includes('--check');
const cwdIndex = args.indexOf('--cwd');
const cwd = cwdIndex === -1 ? process.cwd() : resolve(args[cwdIndex + 1]);
const packagePath = resolve(cwd, 'package.json');
const lockfilePath = resolve(cwd, 'package-lock.json');

const readJson = async path => JSON.parse(await readFile(path, 'utf8'));
const packageJson = await readJson(packagePath);
const lockfile = await readJson(lockfilePath);
const typesVersion = packageJson.devDependencies?.['@types/vscode'];

if (!/^\d+\.\d+\.\d+$/.test(typesVersion ?? '')) {
  throw new Error('@types/vscode must use an exact semantic version');
}

const engineVersion = `^${typesVersion}`;
const matches = packageJson.engines?.vscode === engineVersion
  && lockfile.packages?.['']?.engines?.vscode === engineVersion
  && lockfile.packages?.['']?.devDependencies?.['@types/vscode'] === typesVersion;

if (check) {
  if (!matches) {
    throw new Error(`engines.vscode and package-lock.json must match @types/vscode ${typesVersion}`);
  }
  process.exit(0);
}

packageJson.engines.vscode = engineVersion;
lockfile.packages[''].engines.vscode = engineVersion;
lockfile.packages[''].devDependencies['@types/vscode'] = typesVersion;

await Promise.all([
  writeFile(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`),
  writeFile(lockfilePath, `${JSON.stringify(lockfile, null, 2)}\n`),
]);
