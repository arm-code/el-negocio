import { isPushEndpoint } from './push-endpoint';

describe('isPushEndpoint', () => {
  it.each([
    'https://fcm.googleapis.com/fcm/send/abc:123',
    'https://web.push.apple.com/QGdsf',
    'https://updates.push.services.mozilla.com/wpush/v2/abc',
    'https://wns2-by3p.notify.windows.com/w/?token=abc',
  ])('acepta el servicio de un navegador: %s', (url) => {
    expect(isPushEndpoint(url)).toBe(true);
  });

  it.each([
    'http://fcm.googleapis.com/fcm/send/abc',
    'https://localhost/x',
    'https://127.0.0.1/x',
    'http://api:3500/api',
    'https://fcm.googleapis.com.evil.test/x',
    'https://evilpush.apple.com.evil.test/x',
    'https://notify.windows.com.evil.test/x',
    'https://fcm.googleapis.com@evil.test/x',
    'https://user:pass@fcm.googleapis.com/x',
    'https://fcm.googleapis.com:8443/x',
    `https://fcm.googleapis.com/${'a'.repeat(1000)}`,
    'no es una dirección',
    '',
  ])('rechaza cualquier otra: %s', (url) => {
    expect(isPushEndpoint(url)).toBe(false);
  });

  it('rechaza lo que no es texto', () => {
    expect(isPushEndpoint(undefined)).toBe(false);
    expect(isPushEndpoint(42)).toBe(false);
  });
});
