import robot from 'robotjs';

export const runMouseCommand = (command: string, distance: number) => {
  const { x, y } = robot.getMousePos();

  switch (command) {
    case 'mouse_up': {
      robot.moveMouseSmooth(x, y - distance);
      break;
    }
    case 'mouse_down': {
      robot.moveMouseSmooth(x, y + distance);
      break;
    }
    case 'mouse_left': {
      robot.moveMouseSmooth(x - distance, y);
      break;
    }
    case 'mouse_right': {
      robot.moveMouseSmooth(x + distance, y);
      break;
    }
    case 'mouse_position': {
      break;
    }
    default:
      break;
  }
};
