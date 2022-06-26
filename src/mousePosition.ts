import robot from 'robotjs';
import { Duplex } from 'stream';

export const runMousePosition = (command: string, wsStream: Duplex) => {
  const { x, y } = robot.getMousePos();
  wsStream.write(`${command} ${x},${y}\0`);
};
