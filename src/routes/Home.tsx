import React, { useMemo, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCenter
} from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import { TableBoard } from "../components/TableBoard";
import { PlayerPool } from "../components/PlayerPool";
import { TopBar } from "../components/TopBar";
import { ActionModal } from "../components/ActionModal";
import { useAppState } from "../state/StateProvider";
import {
  isSeatDropId,
  isPoolDropId,
  isReadyDropId,
  isNotPresentDropId,
  isGroupDropId,
  isTableDropId,
  isPlayerDropId,
  parseSeatDropId,
  parsePlayerDropId
} from "../dnd/dndUtils";
import { toast } from "../components/Toasts";
import { autoPodApply } from "../autopod/autopod";
import { PlayerChip } from "../components/chips";

export default function Home() {
  const { state, dispatch } = useAppState();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 3 } }));

  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionEntityId, setActionEntityId] = useState<{ kind: "player" | "group"; id: string } | null>(null);

  const seatedPlayerIds = useMemo(() => {
    const set = new Set<string>();
    for (const t of state.tables) for (const s of t.seats) if (s) set.add(s);
    return set;
  }, [state.tables]);

  const playersById = useMemo(() => new Map(state.players.map(p => [p.playerId, p])), [state.players]);
  const catsById = useMemo(() => new Map(state.categories.map(c => [c.categoryId, c])), [state.categories]);

  const onDragStart = (e: DragStartEvent) => {
    setActiveDragId(String(e.active.id));
  };

  const onDragEnd = (e: DragEndEvent) => {
    const activeId = String(e.active.id);
    const overId = e.over?.id ? String(e.over.id) : null;
    setActiveDragId(null);

    if (!overId) return;

    if (activeId.startsWith("player:")) {
      const playerId = activeId.replace("player:", "");

      // Dropping into pool sections toggles presence.
      if (isReadyDropId(overId)) {
        dispatch({ type: "SET_PLAYER_PRESENT", playerId, present: true });
        return;
      }
      if (isNotPresentDropId(overId)) {
        dispatch({ type: "SET_PLAYER_PRESENT", playerId, present: false });
        toast("Marked Not Present.");
        return;
      }

      if (isSeatDropId(overId)) {
        const p = state.players.find(pp => pp.playerId === playerId);
        if (p && p.present === false) {
          toast("Can't seat: player is Not Present.", { kind: "error" });
          return;
        }
        const { tableId, seatIndex } = parseSeatDropId(overId);
        dispatch({ type: "ASSIGN_PLAYER_TO_SEAT", tableId, seatIndex, playerId });
        return;
      }
      if (isPoolDropId(overId)) {
        dispatch({ type: "UNSEAT_PLAYER", playerId });
        dispatch({ type: "REMOVE_PLAYER_FROM_GROUP", playerId });
        return;
      }
      if (isGroupDropId(overId)) {
        const p = state.players.find(pp => pp.playerId === playerId);
        if (p && p.present === false) {
          toast("Can't group: player is Not Present.", { kind: "error" });
          return;
        }
        const groupId = overId.replace("groupdrop:", "");
        dispatch({ type: "ADD_PLAYER_TO_GROUP", groupId, playerId });
        return;
      }
      if (isPlayerDropId(overId)) {
        const otherId = parsePlayerDropId(overId).playerId;
        dispatch({ type: "GROUP_PLAYERS_BY_DROP", aPlayerId: playerId, bPlayerId: otherId });
        return;
      }
    }

    if (activeId.startsWith("groupmember:")) {
      const parts = activeId.replace("groupmember:", "").split(":");
      const playerId = parts[1];
      if (isReadyDropId(overId)) {
        dispatch({ type: "SET_PLAYER_PRESENT", playerId, present: true });
        return;
      }
      if (isNotPresentDropId(overId)) {
        dispatch({ type: "SET_PLAYER_PRESENT", playerId, present: false });
        toast("Marked Not Present.");
        return;
      }
      if (isPoolDropId(overId)) {
        dispatch({ type: "REMOVE_PLAYER_FROM_GROUP", playerId });
        return;
      }
      if (isSeatDropId(overId)) {
        const p = state.players.find(pp => pp.playerId === playerId);
        if (p && p.present === false) {
          toast("Can't seat: player is Not Present.", { kind: "error" });
          return;
        }
        const { tableId, seatIndex } = parseSeatDropId(overId);
        dispatch({ type: "ASSIGN_PLAYER_TO_SEAT", tableId, seatIndex, playerId });
        return;
      }
      if (isPlayerDropId(overId)) {
        const otherId = parsePlayerDropId(overId).playerId;
        dispatch({ type: "GROUP_PLAYERS_BY_DROP", aPlayerId: playerId, bPlayerId: otherId });
        return;
      }
    }

    if (activeId.startsWith("group:")) {
      const groupId = activeId.replace("group:", "");
      if (isTableDropId(overId)) {
        const tableId = overId.replace("tabledrop:", "");
        dispatch({ type: "SEAT_GROUP_ON_TABLE", tableId, groupId });
        return;
      }
      if (isPoolDropId(overId)) return;
    }

    toast("Invalid drop.");
  };

  const runAutoPod = () => {
    const result = autoPodApply(state);
    if (result.summary.moves.length === 0) return toast("Auto: no moves.");
    dispatch({ type: "LOAD_STATE_SNAPSHOT", snapshot: result.nextState });
    dispatch({ type: "SET_LAST_AUTOPOD_SUMMARY", summary: result.summary });
    toast(`Auto seated ${result.summary.totalPlayersSeated}.`);
  };

  return (
    <div className="homeLayout">
      <TopBar onAutoPod={runAutoPod} seatedCount={seatedPlayerIds.size} />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToWindowEdges]}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <section className="tablesArea">
          <TableBoard />
        </section>

        <section className="poolArea">
          <PlayerPool
            onOpenActions={(kind, id) => {
              setActionEntityId({ kind, id });
              setActionModalOpen(true);
            }}
          />
        </section>

        <DragOverlay>
          {activeDragId ? <Overlay id={activeDragId} playersById={playersById} catsById={catsById} /> : null}
        </DragOverlay>
      </DndContext>

      <ActionModal open={actionModalOpen} entity={actionEntityId} onClose={() => setActionModalOpen(false)} />
    </div>
  );
}

function Overlay({
  id,
  playersById,
  catsById
}: {
  id: string;
  playersById: Map<string, any>;
  catsById: Map<string, any>;
}) {
  // show just name + color (no bracket number; color is enough)
  if (id.startsWith("player:")) {
    const pid = id.replace("player:", "");
    const p = playersById.get(pid);
    const cat = p ? catsById.get(p.categoryId) : null;
    return <PlayerChip dragId={id} name={p?.displayName ?? pid} color={cat?.color ?? "#999"} />;
  }
  if (id.startsWith("groupmember:")) {
    const pid = id.split(":").pop()!;
    const p = playersById.get(pid);
    const cat = p ? catsById.get(p.categoryId) : null;
    return <PlayerChip dragId={id} name={p?.displayName ?? pid} color={cat?.color ?? "#999"} />;
  }
  if (id.startsWith("group:")) {
    return (
      <div className="chip" style={{ cursor: "grabbing" }}>
        <span className="chipBadge" style={{ background: "#93c5fd" }} />
        <span>Group</span>
      </div>
    );
  }
  return null;
}
