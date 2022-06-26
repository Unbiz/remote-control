import robot from 'robotjs';

export const runMouseCommand = (command: string, offset: number) => {
  const { x, y } = robot.getMousePos();

  switch (command) {
    case 'mouse_up': {
      robot.moveMouseSmooth(x, y - offset);
      break;
    }
    case 'mouse_down': {
      robot.moveMouseSmooth(x, y + offset);
      break;
    }
    case 'mouse_left': {
      robot.moveMouseSmooth(x - offset, y);
      break;
    }
    case 'mouse_right': {
      robot.moveMouseSmooth(x + offset, y);
      break;
    }
    default:
      break;
  }
};
