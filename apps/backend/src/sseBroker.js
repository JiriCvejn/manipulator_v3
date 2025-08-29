// File: apps/backend/src/sseBroker.js
// Jednoduchý in-memory SSE broker (Server-Sent Events) pro realtime notifikace.
// Použití:
//  - v routes/events.js:   import { addClient } from '../sseBroker.js';  → addClient(res)
//  - v routes/orders.js:   import { broadcast } from '../sseBroker.js';  → broadcast('order.created', {...})

const clients = new Set(); // { res, keepAlive }

export function addClient(res) {
  // SSE hlavičky
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no', // pro Nginx, aby nebuffroval
  });

  // uvítací event
  res.write(`event: hello\n`);
  res.write(`data: {"ok":true}\n\n`);

  // keep-alive (některé proxy zavírají neaktivní spojení)
  const keepAlive = setInterval(() => {
    try {
      res.write(`event: ping\n`);
      res.write(`data: {}\n\n`);
    } catch {
      // selhání zápisu = klient se odpojil, uklidíme v onClose
    }
  }, 25_000);

  const client = { res, keepAlive };
  clients.add(client);

  // úklid po ukončení
  const onClose = () => {
    clearInterval(keepAlive);
    clients.delete(client);
  };
  res.on('close', onClose);
  res.on('finish', onClose);
  res.on('error', onClose);
}

export function broadcast(eventType, payload) {
  const data = JSON.stringify(payload ?? {});
  for (const { res } of clients) {
    try {
      res.write(`event: ${eventType}\n`);
      res.write(`data: ${data}\n\n`);
    } catch {
      // pokud zápis selže, klient bude odstraněn v jeho onClose handleru
    }
  }
}

// Volitelná metrika
export function clientCount() {
  return clients.size;
}
