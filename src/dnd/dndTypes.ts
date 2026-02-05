export type DragEntity =
  | { kind: "player"; playerId: string }
  | { kind: "group"; groupId: string }
  | { kind: "groupmember"; groupId: string; playerId: string };
