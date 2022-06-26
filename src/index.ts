import { httpServer } from './http_server/index';
import robot from 'robotjs';
import { createWebSocketStream, WebSocketServer } from 'ws';
import { runMouseCommand } from './mouseCommands';
import { runDrawCommand } from './drawCommands';
import { runScreenCommand } from './screenCommands';
import { runMousePosition } from './mousePosition';

const HTTP_PORT = 3000;

console.log(`Start static http server on the ${HTTP_PORT} port!`);
httpServer.listen(HTTP_PORT);

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (ws) => {
  const wsStream = createWebSocketStream(ws, {
    encoding: 'utf8',
    decodeStrings: false,
  });

  wsStream.on('data', async (data: string) => {
    const command = data.split(' ')[0];

    if (command.startsWith('mouse_position')) {
      runMousePosition(command, wsStream);
    } else if (command.startsWith('mouse_')) {
      const distance = Number(data.split(' ')[1]);
      runMouseCommand(command, distance);
      wsStream.write(`${command}\0`);
    } else if (command.startsWith('draw_')) {
      const args = data.toString().split(' ').slice(1);
      runDrawCommand(command, args);
      wsStream.write(`${command}\0`);
    } else if (command.startsWith('prnt_scrn')) {
      runScreenCommand(wsStream);
    }
  });
});

process.on('SIGINT', () => {
  console.log('Websocket closed...');
  wss.close();
  process.exit();
});
