import Jimp from 'jimp';
import robot from 'robotjs';
import { Duplex } from 'stream';

export const runScreenCommand = (wsStream: Duplex) => {
  const { x, y } = robot.getMousePos();
  const screen = robot.screen.capture(x - 100, y - 100, 200, 200).image;

  new Jimp({ data: screen, width: 200, height: 200 }, (_err: Error, image) => {
    let pos = 0;

    image.scan(0, 0, 200, 200, (_x: any, _y: any, idx: number) => {
      image.bitmap.data[idx + 2] = screen.readUInt8(pos);
      pos += 1;
      image.bitmap.data[idx + 1] = screen.readUInt8(pos);
      pos += 1;
      image.bitmap.data[idx + 0] = screen.readUInt8(pos);
      pos += 1;
      image.bitmap.data[idx + 3] = screen.readUInt8(pos);
      pos += 1;
    });

    image.getBuffer(Jimp.MIME_JPEG, (err: Error, buffer: string) => {
      const imageInStr = Buffer.from(buffer, 'base64').toString('base64');
      wsStream.write(`prnt_scrn ${imageInStr}\0`);
    });
  });
};
