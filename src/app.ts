import type { Server } from 'node:http';
import express from 'express';
import { config } from './config';
import { connectionAddress } from './db';
import { log } from './logger';
import { getWeather } from './weather';

const app = express();

function realPort(server: Server | undefined): number {
  const address = server?.address();

  if (address && typeof address === 'object') {
    return address.port;
  }

  return config.port;
}

app.get('/health', (_req, res) => {
  const server = app.locals.server as Server | undefined;

  res.json({
    ok: true,
    env: config.env,
    port: realPort(server),
  });
});

app.get('/weather/:city', async (req, res, next) => {
  try {
    const data = await getWeather(req.params.city);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

app.use(
  (
    error: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    const stack =
      config.http.includeStackInErrors && error instanceof Error
        ? error.stack
        : undefined;

    res.status(500).json({
      error: 'erro interno',
      ...(stack ? { stack } : {}),
    });
  },
);

const server = app.listen(config.port, () => {
  const port = realPort(server);

  console.log('servidor no ar na porta ' + port);
  console.log('ambiente: ' + config.env);
  console.log(
    'configuração: ' +
      (config.envFile || 'variáveis do sistema'),
  );
  console.log('banco: ' + connectionAddress);

  log('aplicação iniciada', 'info', {
    port,
    env: config.env,
  });
});

app.locals.server = server;

server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    console.error(
      'Não foi possível iniciar: a porta ' +
        config.port +
        ' já está em uso.',
    );
    process.exit(1);
  }

  console.error('Falha ao iniciar o servidor:', error.message);
  process.exit(1);
});
