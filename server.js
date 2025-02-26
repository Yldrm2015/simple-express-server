import { Response } from 'express';
import fetch from 'node-fetch';
import { parseIp } from './utils';
import { SUBS } from './config';

const ALLOWED_REQUEST_TIMESTAMP_DIFF_MS = 30 * 60 * 1000;
const IPv4_REGEX = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;

export async function POST(request) {
  const { requestId, data } = await request.json();
  const identificationEvent = await (
    await fetch(`https://eu.api.fpjs.io/events/${requestId}`, {
      headers: {
        'Content-Type': 'application/json',
        'Auth-API-Key': SUBS.main.serverApiKey,
      },
    })
  ).json();

  const { okay, error } = validateFingerprintResult(identificationEvent, request);
  if (!okay) {
    return Response.json({ error }, { status: 403 });
  }

  const visitorId = identificationEvent?.products?.identification?.data?.visitorId;
  if (await submissionsDatabase.has(visitorId)) {
    return Response.json({ message: 'Already submitted' }, { status: 403 });
  }

  submissionsDatabase.set(visitorId, data);
  return Response.json({ status: 'OK' });
}

function validateFingerprintResult(identificationEvent, request) {
  const identification = identificationEvent.products?.identification?.data;

  if (!identification) {
    return { okay: false, error: 'Identification event not found, potential spoofing attack.' };
  }

  // Check freshness
  if (Date.now() - Number(new Date(identification.time)) > ALLOWED_REQUEST_TIMESTAMP_DIFF_MS) {
    return { okay: false, error: 'Old identification request, potential replay attack.' };
  }

  // Check origin matches
  const identificationOrigin = new URL(identification.url).origin;
  const requestOrigin = request.headers.origin;
  if (identificationOrigin !== requestOrigin) {
    return { okay: false, error: 'Unexpected origin, potential replay attack.' };
  }

  // Check IP matches
  const identificationIp = identification.ip;
  const requestIp = parseIp(request);
  if (IPv4_REGEX.test(requestIp) && identificationIp !== requestIp) {
    return { okay: false, error: 'Unexpected IP address, potential replay attack.' };
  }

  // Bot detection
  if (identificationEvent.products?.botd?.data?.bot?.result === 'bad') {
    return { okay: false, error: 'Malicious bot detected.' };
  }

  if (identificationEvent.products?.vpn?.data?.result === true) {
    return { okay: false, error: 'VPN network detected.' };
  }

  if (identificationEvent.products?.tor?.data?.result === true) {
    return { okay: false, error: 'Tor network detected.' };
  }

  if (identificationEvent.products?.tampering?.data?.result === true) {
    return { okay: false, error: 'Browser tampering detected.' };
  }

  return { okay: true };
}
