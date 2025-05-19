import { httpServer } from './src/http_server/index';
import { WebSocketServer } from 'ws';
import { WebSocketHandler } from './src/ws-handler/ws-handler';

const HTTP_PORT = 8181;
const WS_PORT = 3000;

// Start HTTP server
httpServer.listen(HTTP_PORT, () => {
  console.log(`HTTP server started on port ${HTTP_PORT}`);
});

const wss = new WebSocketServer({ port: WS_PORT });
const wsHandler = new WebSocketHandler();

console.log(`WebSocket server started on ws://localhost:${WS_PORT}`);

wss.on('connection', (ws) => {
  wsHandler.handleConnection(ws);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT. Run connections and server shutdown...');

  wsHandler.closeAllConnections();

  wss.close(() => {
    console.log('WebSocket server closed');

    httpServer.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  });
});
