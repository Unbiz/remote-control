import WebSocket, { RawData } from 'ws';
import { store } from '../store/store';
import {
  Message,
  Room,
  Ship,
  Game,
  GamePlayer,
  Position,
  AttackRequest,
  RegRequest,
  AddUserToRoomRequest,
  AddShipsRequest,
  RandomAttackRequest,
  RegResponse,
} from '../types/types';
import { getMessageWithSerializedData, parseRequestData } from '../utils';

export class WebSocketHandler {
  private clients: Map<WebSocket, string | number> = new Map();

  private broadcast<T>(message: Message<T>, excludeClient?: WebSocket): void {
    for (const [client] of this.clients.entries()) {
      if (client !== excludeClient && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(getMessageWithSerializedData(message)));
      }
    }
  }

  private sendTo<T>(client: WebSocket, message: Message<T>): void {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(getMessageWithSerializedData(message)));
    }
  }

  private updateWinners(): void {
    const winners = store
      .getAllPlayers()
      .sort((a, b) => b.wins - a.wins)
      .map(({ name, wins }) => ({ name, wins }));

    this.broadcast({
      type: 'update_winners',
      data: winners,
      id: 0,
    });
  }

  private updateRooms(): void {
    const availableRooms = store
      .getRooms()
      .filter((room) => room.roomUsers.length === 1);

    this.broadcast({
      type: 'update_room',
      data: availableRooms,
      id: 0,
    });
  }

  handleConnection(ws: WebSocket): void {
    console.log('New client connected');

    ws.on('message', (data: RawData) => {
      try {
        const message: Message = parseRequestData(data);
        console.log('Received:', message);

        switch (message.type) {
          case 'reg':
            this.handleRegistration(ws, message as Message<RegRequest>);
            break;
          case 'create_room':
            this.handleCreateRoom(ws, message as Message<''>);
            break;
          case 'add_user_to_room':
            this.handleAddUserToRoom(
              ws,
              message as Message<AddUserToRoomRequest>,
            );
            break;
          case 'add_ships':
            this.handleAddShips(message as Message<AddShipsRequest>);
            break;
          case 'attack':
            this.handleAttack(message as Message<AttackRequest>);
            break;
          case 'randomAttack':
            this.handleRandomAttack(message as Message<RandomAttackRequest>);
            break;
        }
      } catch (err) {
        console.error('Error processing message:', err);
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected');
      this.clients.delete(ws);
    });
  }

  private handleRegistration(
    ws: WebSocket,
    message: Message<RegRequest>,
  ): void {
    const { name, password } = message.data;
    console.log('Registration data:', name, message);
    let player = store.getPlayerByName(name);

    if (player) {
      if (player.password !== password) {
        const errorResponse: Message<RegResponse> = {
          type: 'reg',
          data: {
            name: '',
            index: '',
            error: true,
            errorText: 'Неверный пароль',
          },
          id: 0,
        };
        this.sendTo(ws, errorResponse);
        return;
      }
    } else {
      player = {
        name,
        password,
        index: store.generateId(),
        wins: 0,
      };
      store.addPlayer(player);
      console.log('New player created:', player);
    }

    this.clients.set(ws, player.index);

    console.log('Player registered:', player);

    const regResponse: Message<RegResponse> = {
      type: 'reg',
      data: {
        name: player.name,
        index: player.index,
        error: false,
        errorText: '',
      },
      id: 0,
    };

    this.sendTo(ws, regResponse);
    this.updateWinners();
    this.updateRooms();
  }

  private handleCreateRoom(ws: WebSocket, message: Message<''>): void {
    const playerIndex = this.clients.get(ws);

    if (playerIndex == null) {
      return;
    }

    const player = store.getPlayer(playerIndex);

    if (player) {
      const roomId = store.generateId();
      const room: Room = {
        roomId,
        roomUsers: [
          {
            name: player.name,
            index: player.index,
          },
        ],
      };

      store.createRoom(room);
      this.updateRooms();
    }
  }

  private handleAddUserToRoom(
    ws: WebSocket,
    message: Message<AddUserToRoomRequest>,
  ): void {
    const { indexRoom } = message.data;
    const playerIndex = this.clients.get(ws);

    if (playerIndex == null) {
      return;
    }

    const player = store.getPlayer(playerIndex);
    const room = store.getRoom(indexRoom);

    if (player && room) {
      room.roomUsers.push({
        name: player.name,
        index: player.index,
      });

      if (room.roomUsers.length === 2) {
        const gameId = store.generateId();
        const game: Game = {
          gameId,
          players: room.roomUsers.map(
            (user: { name: string; index: string | number }) => ({
              playerId: user.index,
              ships: [],
              shots: [],
              hits: [],
            }),
          ),
          currentPlayer: room.roomUsers[0].index,
        };

        store.createGame(game);
        store.removeRoom(room.roomId);

        for (const [client, clientPlayerIndex] of this.clients.entries()) {
          if (
            room.roomUsers.some(
              (u: { index: string | number }) => u.index === clientPlayerIndex,
            )
          ) {
            this.sendTo(client, {
              type: 'create_game',
              data: {
                idGame: gameId,
                idPlayer: clientPlayerIndex,
              },
              id: 0,
            });
          }
        }
      }

      this.updateRooms();
    }
  }

  private handleAddShips(message: Message<AddShipsRequest>): void {
    const { gameId, ships, indexPlayer } = message.data;
    const game = store.getGame(gameId);

    console.log('Adding ships:', {
      gameId,
      indexPlayer,
      ships: JSON.stringify(ships, null, 2),
    });

    if (game) {
      const player = game.players.find(
        (p: GamePlayer) => p.playerId === indexPlayer,
      );

      if (player) {
        const validShips = ships.every((ship) => {
          const { x, y } = ship.position;
          const isValid = x >= 0 && x < 10 && y >= 0 && y < 10;

          if (!isValid) {
            console.error('Invalid ship position:', ship);
          }

          return isValid;
        });

        if (!validShips) {
          console.error('Invalid ships positions detected');
          return;
        }

        console.log('Adding ships for player:', {
          indexPlayer,
          ships: ships.map((s) => ({
            pos: s.position,
            length: s.length,
            direction: s.direction,
          })),
        });

        player.ships = ships;
        store.updateGame(game);

        if (game.players.every((p: GamePlayer) => p.ships.length > 0)) {
          for (const gamePlayer of game.players) {
            for (const [client, clientPlayerIndex] of this.clients.entries()) {
              if (gamePlayer.playerId === clientPlayerIndex) {
                this.sendTo(client, {
                  type: 'start_game',
                  data: {
                    ships: gamePlayer.ships,
                    currentPlayerIndex: gamePlayer.playerId,
                  },
                  id: 0,
                });
              }
            }
          }

          this.broadcast({
            type: 'turn',
            data: {
              currentPlayer: game.currentPlayer,
            },
            id: 0,
          });
        }
      }
    }
  }

  private isShipHit(position: Position, ships: Ship[]): boolean {
    return ships.some((ship) => {
      const { x: shipStartX, y: shipStartY } = ship.position;
      const vertical = ship.direction;

      const shipEndX = vertical ? shipStartX : shipStartX + ship.length - 1;
      const shipEndY = vertical ? shipStartY + ship.length - 1 : shipStartY;

      const isWithinX = position.x >= shipStartX && position.x <= shipEndX;
      const isWithinY = position.y >= shipStartY && position.y <= shipEndY;

      if (isWithinX && isWithinY) {
        return true;
      }
      return false;
    });
  }

  private isShipKilled(ship: Ship, hits: Position[]): boolean {
    const { x: shipStartX, y: shipStartY } = ship.position;
    const vertical = ship.direction;

    // const shipEndX = vertical ? shipStartX : shipStartX + ship.length - 1;
    // const shipEndY = vertical ? shipStartY + ship.length - 1 : shipStartY;

    for (let i = 0; i < ship.length; i++) {
      const checkX = vertical ? shipStartX : shipStartX + i;
      const checkY = vertical ? shipStartY + i : shipStartY;

      if (!hits.some((hit) => hit.x === checkX && hit.y === checkY)) {
        return false;
      }
    }
    return true;
  }

  private handleAttack(message: Message<AttackRequest>): void {
    const { gameId, x, y, indexPlayer } = message.data;
    const game = store.getGame(gameId);

    console.log('Attack received:', { gameId, x, y, indexPlayer });

    if (game && game.currentPlayer === indexPlayer) {
      const attackingPlayer = game.players.find(
        (p: GamePlayer) => p.playerId === indexPlayer,
      );
      const defendingPlayer = game.players.find(
        (p: GamePlayer) => p.playerId !== indexPlayer,
      );

      if (attackingPlayer && defendingPlayer) {
        const position = { x, y };

        attackingPlayer.shots.push(position);
        const isHit = this.isShipHit(position, defendingPlayer.ships);

        if (isHit) {
          attackingPlayer.hits.push(position);

          const hitShip = defendingPlayer.ships.find((ship: Ship) => {
            const { x: shipStartX, y: shipStartY } = ship.position;
            const vertical = ship.direction;

            const shipEndX = vertical
              ? shipStartX
              : shipStartX + ship.length - 1;
            const shipEndY = vertical
              ? shipStartY + ship.length - 1
              : shipStartY;

            const isWithinX =
              position.x >= shipStartX && position.x <= shipEndX;
            const isWithinY =
              position.y >= shipStartY && position.y <= shipEndY;

            return isWithinX && isWithinY;
          });

          if (hitShip && this.isShipKilled(hitShip, attackingPlayer.hits)) {
            this.broadcast({
              type: 'attack',
              data: {
                position,
                currentPlayer: indexPlayer,
                status: 'killed',
              },
              id: 0,
            });

            const { x: shipStartX, y: shipStartY } = hitShip.position;
            const vertical = hitShip.direction;

            const shipEndX = vertical
              ? shipStartX
              : shipStartX + hitShip.length - 1;
            const shipEndY = vertical
              ? shipStartY + hitShip.length - 1
              : shipStartY;

            const areaStartX = Math.max(0, shipStartX - 1);
            const areaStartY = Math.max(0, shipStartY - 1);
            const areaEndX = Math.min(9, shipEndX + 1);
            const areaEndY = Math.min(9, shipEndY + 1);

            for (let x = areaStartX; x <= areaEndX; x++) {
              for (let y = areaStartY; y <= areaEndY; y++) {
                if (x >= 0 && x < 10 && y >= 0 && y < 10) {
                  const isCellShip = defendingPlayer.ships.some((ship: Ship) =>
                    this.isShipHit({ x, y }, [ship]),
                  );

                  if (!isCellShip) {
                    this.broadcast({
                      type: 'attack',
                      data: {
                        position: { x, y },
                        currentPlayer: indexPlayer,
                        status: 'miss',
                      },
                      id: 0,
                    });
                  }
                }
              }
            }
          } else {
            this.broadcast({
              type: 'attack',
              data: {
                position,
                currentPlayer: indexPlayer,
                status: 'shot',
              },
              id: 0,
            });
          }

          const allShipsKilled = defendingPlayer.ships.every((ship: Ship) =>
            this.isShipKilled(ship, attackingPlayer.hits),
          );

          if (allShipsKilled) {
            game.winner = indexPlayer;
            store.updatePlayerWins(indexPlayer);

            this.broadcast({
              type: 'finish',
              data: {
                winPlayer: indexPlayer,
              },
              id: 0,
            });

            this.updateWinners();
            store.removeGame(gameId);
            return;
          }
        } else {
          this.broadcast({
            type: 'attack',
            data: {
              position,
              currentPlayer: indexPlayer,
              status: 'miss',
            },
            id: 0,
          });

          game.currentPlayer = defendingPlayer.playerId;
        }

        store.updateGame(game);

        this.broadcast({
          type: 'turn',
          data: {
            currentPlayer: game.currentPlayer,
          },
          id: 0,
        });
      }
    }
  }

  private handleRandomAttack(message: Message<RandomAttackRequest>): void {
    const { gameId, indexPlayer } = message.data;
    const game = store.getGame(gameId);

    if (game && game.currentPlayer === indexPlayer) {
      const attackingPlayer = game.players.find(
        (p: GamePlayer) => p.playerId === indexPlayer,
      );

      if (attackingPlayer) {
        let x: number, y: number;

        do {
          x = Math.floor(Math.random() * 10);
          y = Math.floor(Math.random() * 10);
        } while (
          attackingPlayer.shots.some(
            (shot: Position) => shot.x === x && shot.y === y,
          )
        );

        this.handleAttack({
          type: 'attack',
          data: { gameId, x, y, indexPlayer },
          id: 0,
        });
      }
    }
  }

  public closeAllConnections(): void {
    console.log('Closing all WebSocket connections...');

    for (const [client] of this.clients.entries()) {
      if (client.readyState === WebSocket.OPEN) {
        client.close();
      }
    }

    this.clients.clear();

    console.log('All WebSocket connections closed');
  }
}
