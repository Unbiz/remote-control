export interface Position {
  x: number;
  y: number;
}

export interface Ship {
  position: Position;
  direction: boolean;
  length: number;
  type: ShipType;
}

export interface Player {
  name: string;
  index: string | number;
  password: string;
  wins: number;
}

export interface Room {
  roomId: string | number;
  roomUsers: {
    name: string;
    index: string | number;
  }[];
}

export interface GamePlayer {
  playerId: string | number;
  ships: Ship[];
  shots: Position[];
  hits: Position[];
}

export interface Game {
  gameId: string | number;
  players: GamePlayer[];
  currentPlayer: string | number;
  winner?: string | number;
}

export type MessageType =
  | 'reg'
  | 'update_winners'
  | 'create_room'
  | 'add_user_to_room'
  | 'create_game'
  | 'update_room'
  | 'add_ships'
  | 'start_game'
  | 'attack'
  | 'randomAttack'
  | 'turn'
  | 'finish';

export interface Message<T = any> {
  type: MessageType;
  data: T;
  id: number;
}

export interface RegRequest {
  name: string;
  password: string;
}

export interface AddUserToRoomRequest {
  indexRoom: string | number;
}

export interface AddShipsRequest {
  gameId: string | number;
  ships: Ship[];
  indexPlayer: string | number;
}

export interface AttackRequest {
  gameId: string | number;
  x: number;
  y: number;
  indexPlayer: string | number;
}

export interface RandomAttackRequest {
  gameId: string | number;
  indexPlayer: string | number;
}

export enum ShipType {
  Small = 'small',
  Medium = 'medium',
  Large = 'large',
  Huge = 'huge',
}

export enum AttackStatus {
  Miss = 'miss',
  Shot = 'shot',
  Killed = 'killed',
}

export interface RegResponse {
  name: string;
  index: string | number;
  error: boolean;
  errorText: string;
}

export interface CreateGameResponse {
  idGame: string | number;
  idPlayer: string | number;
}

export interface StartGameResponse {
  ships: Ship[];
  currentPlayerIndex: string | number;
}

export interface AttackResponse {
  position: Position;
  currentPlayer: string | number;
  status: AttackStatus;
}

export interface TurnResponse {
  currentPlayer: string | number;
}

export interface FinishResponse {
  winPlayer: string | number;
}

export interface UpdateWinnersResponse {
  name: string;
  wins: number;
}
[];

export interface UpdateRoomResponse extends Room {}
