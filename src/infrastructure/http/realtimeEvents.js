const clients = new Set();

export function publishDataChanged(event) {
  const payload = `event: data-changed\ndata: ${JSON.stringify(event)}\n\n`;
  for (const response of clients) {
    if (response.destroyed || response.writableEnded) {
      clients.delete(response);
      continue;
    }
    response.write(payload);
  }
}

export function addRealtimeClient(response) {
  clients.add(response);
  return () => clients.delete(response);
}

export function getRealtimeClientCount() {
  return clients.size;
}
