import robot from 'robotjs';

export const runDrawCommand = (command: string, args: string[]) => {
  const { x, y } = robot.getMousePos();
  const smoothSpeed = 100;

  switch (command) {
    case 'draw_circle':
      robot.mouseClick('left');
      robot.mouseToggle('down', 'left');
      robot.setMouseDelay(5);

      const piSqrt = Math.PI * 2;

      for (let i = 0; i <= piSqrt; i += 0.02) {
        const curX = x + Number(args[0]) * Math.cos(i) - Number(args[0]);
        const curY = y + Number(args[0]) * Math.sin(i);
        robot.dragMouse(curX, curY);
      }

      robot.mouseToggle('up');
      break;
    case 'draw_rectangle':
      const curX = x + Number(args[0]);
      const curY = y + Number(args[1]);
      robot.mouseClick('left');
      robot.mouseToggle('down', 'left');

      robot.moveMouseSmooth(curX, y, smoothSpeed);
      robot.moveMouseSmooth(curX, curY, smoothSpeed);
      robot.moveMouseSmooth(x, curY, smoothSpeed);
      robot.moveMouseSmooth(x, y, smoothSpeed);

      robot.mouseToggle('up');
      break;
    case 'draw_square':
      const rectX = x + Number(args[0]);
      const rectY = y + Number(args[0]);
      robot.mouseClick('left');
      robot.mouseToggle('down', 'left');

      robot.moveMouseSmooth(rectX, y, smoothSpeed);
      robot.moveMouseSmooth(rectX, rectY, smoothSpeed);
      robot.moveMouseSmooth(x, rectY, smoothSpeed);
      robot.moveMouseSmooth(x, y, smoothSpeed);

      robot.mouseToggle('up');
      break;
    default:
      return;
  }
};
