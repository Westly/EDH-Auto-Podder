import { z } from "zod";

export const zCategory = z.object({
  categoryId: z.string(),
  name: z.string(),
  color: z.string(),
  rank: z.number().int(),
  createdIndex: z.number().int()
});

export const zPlayer = z.object({
  playerId: z.string(),
  displayName: z.string(),
  categoryId: z.string(),
  present: z.boolean().optional(),
  locked: z.boolean().optional(),
  createdIndex: z.number().int()
});

export const zGroup = z.object({
  groupId: z.string(),
  playerIds: z.array(z.string()),
  categoryId: z.string(),
  label: z.string().optional(),
  createdIndex: z.number().int()
});

export const zTable = z.object({
  tableId: z.string(),
  name: z.string(),
  seatCount: z.number().int().min(1).max(16),
  seats: z.array(z.string().nullable()),
  createdIndex: z.number().int()
});

export const zAutoPodSummary = z
  .object({
    moves: z.array(
      z.object({
        tableId: z.string(),
        seatedPlayerIds: z.array(z.string())
      })
    ),
    totalPlayersSeated: z.number().int().min(0)
  })
  .optional();

export const zAppState = z.object({
  version: z.literal(1),
  categories: z.array(zCategory),
  players: z.array(zPlayer),
  groups: z.array(zGroup),
  tables: z.array(zTable),
  connectMode: z.object({
    enabled: z.boolean(),
    selectedPlayerIds: z.array(z.string())
  }),
  counters: z.object({
    createdIndex: z.number().int()
  }),
  lastAutoPodSummary: zAutoPodSummary
});
