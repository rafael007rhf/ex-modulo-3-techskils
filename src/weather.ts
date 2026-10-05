import { config } from './config';

export function maskSecret(secret: string): string {
  if (secret.length <= 4) {
    return '****';
  }

  return '****' + secret.slice(-4);
}

export async function getWeather(city: string): Promise<unknown> {
  const url = new URL('https://api.exemplo.com/v1/weather');
  url.searchParams.set('city', city);

  const response = await fetch(url, {
    headers: {
      Authorization: 'Bearer ' + config.api.key,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    console.error('Falha na API de clima', {
      status: response.status,
      statusText: response.statusText,
    });

    throw new Error(
      'Falha na API de clima (HTTP ' + response.status + ').',
    );
  }

  return response.json();
}
