// WebSocket smoke test for memory-space chat gateway.
// Usage:
//   BASE=http://127.0.0.1:3000 ALICE_TOKEN=... BOB_TOKEN=... node tests/ws-smoke.js
//
// Verifies: connect auth (no token rejected), two clients receive each other's
// messages in the couple room, typing event delivery.

const path = require('path');
const { createRequire } = require('module');
const localRequire = createRequire(path.resolve(__dirname, '../frontend/package.json'));
const { io } = localRequire('socket.io-client');

const BASE = process.env.BASE || 'http://127.0.0.1:3000';
const A = process.env.ALICE_TOKEN;
const B = process.env.BOB_TOKEN;

if (!A || !B) {
  console.error('ALICE_TOKEN and BOB_TOKEN env vars required.');
  process.exit(2);
}

let pass = 0, fail = 0;
const ok = (m) => { pass++; console.log(`  PASS ${m}`); };
const bad = (m, e) => { fail++; console.log(`  FAIL ${m}${e ? ' :: ' + e : ''}`); };

const connect = (token) =>
  io(BASE + '/chat', {
    transports: ['websocket'],
    auth: { token },
    reconnection: false,
    timeout: 5000,
  });

function waitEvent(sock, ev, ms = 4000) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout ' + ev)), ms);
    sock.once(ev, (payload) => { clearTimeout(t); resolve(payload); });
  });
}

(async () => {
  console.log('==> 1. Unauthenticated connect should be force-disconnected');
  await new Promise((resolve) => {
    const noAuth = io(BASE + '/chat', { transports: ['websocket'], reconnection: false, timeout: 4000 });
    let kicked = false;
    const finish = (success, why) => { try { noAuth.disconnect(); } catch {} ; (success ? ok : bad)(why); resolve(); };
    noAuth.on('connect_error', () => finish(true, 'no-token: connect_error (rejected at handshake)'));
    noAuth.on('disconnect', () => { kicked = true; finish(true, 'no-token: server disconnected client'); });
    noAuth.on('connected', () => finish(false, 'no-token: received "connected" auth event (BUG)'));
    setTimeout(() => { if (!kicked) finish(false, 'no-token: still connected after 3s (BUG)'); }, 3000);
  });

  console.log('==> 2. Authenticated connect (wait for "connected" auth event)');
  const alice = connect(A);
  const bob = connect(B);
  try {
    await Promise.all([waitEvent(alice, 'connected'), waitEvent(bob, 'connected')]);
    ok('both clients got "connected" auth event');
  } catch (e) { bad('clients failed to authenticate', e.message); }

  console.log('==> 3. Alice sends -> Bob receives');
  const tag = 'WS-SMOKE-' + Date.now();
  try {
    const recv = waitEvent(bob, 'message:new');
    alice.emit('message:send', { msgType: 'text', content: tag });
    const msg = await recv;
    if (msg && (msg.content === tag || msg?.message?.content === tag)) ok('bob received alice message');
    else bad('payload mismatch', JSON.stringify(msg));
  } catch (e) { bad('did not receive message', e.message); }

  console.log('==> 4. Typing event');
  try {
    const recv = waitEvent(bob, 'typing', 3000);
    alice.emit('typing', { typing: true });
    const t = await recv;
    ok('typing event delivered (' + JSON.stringify(t) + ')');
  } catch (e) { bad('typing not delivered', e.message); }

  alice.disconnect();
  bob.disconnect();

  console.log('\n===================================');
  console.log(`PASS: ${pass}   FAIL: ${fail}`);
  console.log('===================================');
  process.exit(fail > 0 ? 1 : 0);
})();
