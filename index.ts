import { WebSocketServer } from 'ws';

const WS_PORT = 3000;

const wss = new WebSocketServer({ port: WS_PORT });
console.log(`WebSocket server started on ws://localhost:${WS_PORT}`);

wss.on('connection', (ws) => {
  console.log('New client connected');
});
