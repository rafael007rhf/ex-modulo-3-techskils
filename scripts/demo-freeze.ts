import { config } from '../src/config';

console.log('tipo de config.port:', typeof config.port);
console.log('host antes da tentativa:', config.db.host);

try {
  const mutableDb = config.db as { host: string };
  mutableDb.host = 'localhost-alterado';
  console.log('alteração inesperadamente aceita');
} catch (error) {
  const message =
    error instanceof Error ? error.message : 'erro desconhecido';

  console.log('alteração bloqueada:', message);
}

console.log('host depois da tentativa:', config.db.host);
