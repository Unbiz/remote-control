import robot from 'robotjs';

export const runDrawCommand = (command: string, args: string[]) => {
  const { x, y } = robot.getMousePos();

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
      robot.setMouseDelay(100);
      robot.mouseClick('left');
      robot.mouseToggle('down', 'left');

      robot.moveMouse(curX, y);
      robot.moveMouse(curX, curY);
      robot.moveMouse(x, curY);
      robot.moveMouse(x, y);

      robot.mouseToggle('up');
      break;
    case 'draw_square':
      const rectX = x + Number(args[0]);
      const rectY = y + Number(args[0]);
      robot.setMouseDelay(100);
      robot.mouseClick('left');
      robot.mouseToggle('down', 'left');

      robot.moveMouse(rectX, y);
      robot.moveMouse(rectX, rectY);
      robot.moveMouse(x, rectY);
      robot.moveMouse(x, y);

      robot.mouseToggle('up');
      break;
    default:
      return;
  }
};
