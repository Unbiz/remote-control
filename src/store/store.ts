import { Game, Player, Room } from '../types/types';

class Store {
  private players: Map<string | number, Player> = new Map();
  private rooms: Map<string | number, Room> = new Map();
  private games: Map<string | number, Game> = new Map();
  private nextId = 1;

  generateId(): string | number {
    return this.nextId += 1;
  }

  addPlayer(player: Player): void {
    this.players.set(player.index, player);
  }

  getPlayer(index: string | number): Player | null {
    return this.players.get(index) ?? null;
  }

  getPlayerByCredentials(name: string, password: string): Player | null {
    return (
      Array.from(this.players.values()).find(
        (p) => p.name === name && p.password === password,
      ) ?? null
    );
  }

  getPlayerByName(name: string): Player | null {
    return (
      Array.from(this.players.values()).find((p) => p.name === name) ?? null
    );
  }

  updatePlayerWins(playerIndex: string | number): void {
    const player = this.players.get(playerIndex);
    if (player) {
      player.wins += 1;
      this.players.set(playerIndex, player);
    }
  }

  getAllPlayers(): Player[] {
    return Array.from(this.players.values());
  }

  createRoom(room: Room): void {
    this.rooms.set(room.roomId, room);
  }

  getRoom(roomId: string | number): Room | null {
    return this.rooms.get(roomId) ?? null;
  }

  getRooms(): Room[] {
    return Array.from(this.rooms.values());
  }

  removeRoom(roomId: string | number): void {
    this.rooms.delete(roomId);
  }

  createGame(game: Game): void {
    this.games.set(game.gameId, game);
  }

  getGame(gameId: string | number): Game | null {
    return this.games.get(gameId) ?? null;
  }

  updateGame(game: Game): void {
    this.games.set(game.gameId, game);
  }

  removeGame(gameId: string | number): void {
    this.games.delete(gameId);
  }
}

export const store = new Store();
