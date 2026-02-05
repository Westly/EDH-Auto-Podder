export type UUID = string;

export type Category = {
  categoryId: UUID;
  name: string;
  color: string; // hex
  rank: number; // integer used for closeness math
  createdIndex: number;
};

export type Player = {
  playerId: UUID;
  displayName: string;
  categoryId: UUID;
  locked?: boolean;
  createdIndex: number;
};

export type Group = {
  groupId: UUID;
  playerIds: UUID[];
  categoryId: UUID;
  label?: string;
  createdIndex: number;
};

export type Table = {
  tableId: UUID;
  name: string;
  seatCount: number;
  seats: Array<UUID | null>;
  createdIndex: number;
};

export type AutoPodMove = {
  tableId: UUID;
  seatedPlayerIds: UUID[];
};

export type AutoPodSummary = {
  moves: AutoPodMove[];
  totalPlayersSeated: number;
};

export type AppState = {
  version: 1;
  categories: Category[];
  players: Player[];
  groups: Group[];
  tables: Table[];

  connectMode: {
    enabled: boolean;
    selectedPlayerIds: UUID[];
  };

  counters: {
    createdIndex: number;
  };

  lastAutoPodSummary?: AutoPodSummary;
};

export const STORAGE_KEY = "fnm_podder_state_v1";
