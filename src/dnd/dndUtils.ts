export function seatDropId(tableId: string, seatIndex: number) {
  return `seat:${tableId}:${seatIndex}`;
}
export function parseSeatDropId(id: string) {
  const parts = id.split(":");
  return { tableId: parts[1], seatIndex: Number(parts[2]) };
}
export function isSeatDropId(id: string) {
  return id.startsWith("seat:");
}

export function poolDropId() {
  return "pooldrop:pool";
}
export function isPoolDropId(id: string) {
  return id === "pooldrop:pool";
}

export function readyDropId() {
  return "pooldrop:ready";
}
export function isReadyDropId(id: string) {
  return id === "pooldrop:ready";
}

export function notPresentDropId() {
  return "pooldrop:notpresent";
}
export function isNotPresentDropId(id: string) {
  return id === "pooldrop:notpresent";
}

export function groupDropId(groupId: string) {
  return `groupdrop:${groupId}`;
}
export function isGroupDropId(id: string) {
  return id.startsWith("groupdrop:");
}

export function tableDropId(tableId: string) {
  return `tabledrop:${tableId}`;
}
export function isTableDropId(id: string) {
  return id.startsWith("tabledrop:");
}

export function playerDropId(playerId: string) {
  return `playerdrop:${playerId}`;
}
export function isPlayerDropId(id: string) {
  return id.startsWith("playerdrop:");
}

export function parsePlayerDropId(id: string) {
  // Supports IDs like:
  //  - playerdrop:<playerId>
  //  - playerdrop:<playerId>:<uniqueToken>
  const parts = id.split(":");
  return { playerId: parts[1] };
}

export function playerDropIdWithToken(playerId: string, token: string) {
  return `playerdrop:${playerId}:${token}`;
}
