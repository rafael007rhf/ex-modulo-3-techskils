import fs from 'node:fs';
import path from 'node:path';

const PROJECT_ROOT = path.resolve(__dirname, '..');
const exampleFile = path.resolve(PROJECT_ROOT, '.env.example');
const targetName = process.argv[2] || '.env';
const targetFile = path.resolve(PROJECT_ROOT, targetName);

function keys(file: string): string[] {
  return fs
    .readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'))
    .map((line) => line.replace(/^export\s+/, ''))
    .map((line) => line.split('=', 1)[0]?.trim())
    .filter((key): key is string => Boolean(key));
}

if (!fs.existsSync(targetFile)) {
  console.error(
    'Arquivo ' +
      targetName +
      ' não encontrado. Crie-o a partir de .env.example.',
  );
  process.exit(1);
}

const requiredKeys = new Set(keys(exampleFile));
const localKeys = new Set(keys(targetFile));

const missing = Array.from(requiredKeys).filter(
  (key) => !localKeys.has(key),
);

if (missing.length > 0) {
  console.error('Configuração incompleta em ' + targetName + '.');
  console.error('Variáveis ausentes: ' + missing.join(', '));
  process.exit(1);
}

console.log(
  'Ambiente ' +
    targetName +
    ' contém todas as chaves de .env.example.',
);
