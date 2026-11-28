// El API manda peticiones a la dirección que le entrega el navegador. Para que nadie la
// use para hacerlo llamar a otro lado (SSRF), solo se aceptan los servicios de avisos
// de los navegadores.

const HOSTS = [
  /^fcm\.googleapis\.com$/, // Chrome, Edge en Android, Samsung Internet
  /^([a-z0-9-]+\.)*push\.apple\.com$/, // Safari e iPhone
  /^([a-z0-9-]+\.)*push\.services\.mozilla\.com$/, // Firefox
  /^([a-z0-9-]+\.)*notify\.windows\.com$/, // Edge en Windows
];

export const MAX_ENDPOINT_LENGTH = 1000;

export function isPushEndpoint(value: unknown): boolean {
  if (typeof value !== 'string' || value.length > MAX_ENDPOINT_LENGTH) {
    return false;
  }
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  return (
    url.protocol === 'https:' &&
    !url.username &&
    !url.password &&
    url.port === '' &&
    HOSTS.some((host) => host.test(url.hostname))
  );
}
