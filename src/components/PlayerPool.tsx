import React, { useMemo, useRef, useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { useAppState } from "../state/StateProvider";
import { groupDropId, poolDropId, playerDropIdWithToken } from "../dnd/dndUtils";
import { groupsSorted, playersSorted, groupFallbackName } from "../utils/sort";
import { CategorySelect } from "./CategorySelect";
import { GroupShell, PlayerChip } from "./chips";
import { toast } from "./Toasts";

export function PlayerPool({ onOpenActions }: { onOpenActions: (kind: "player" | "group", id: string) => void }) {
  const { state, dispatch } = useAppState();

  const playersById = useMemo(() => new Map(state.players.map(p => [p.playerId, p])), [state.players]);
  const catsById = useMemo(() => new Map(state.categories.map(c => [c.categoryId, c])), [state.categories]);

  const seatedPlayerIds = useMemo(() => {
    const set = new Set<string>();
    for (const t of state.tables) for (const s of t.seats) if (s) set.add(s);
    return set;
  }, [state.tables]);

  const playerToGroup = useMemo(() => {
    const m = new Map<string, string>();
    for (const g of state.groups) for (const pid of g.playerIds) m.set(pid, g.groupId);
    return m;
  }, [state.groups]);

  const groups = useMemo(() => groupsSorted(state.groups, playersById, catsById), [state.groups, playersById, catsById]);
  const individuals = useMemo(() => {
    const ungrouped = state.players.filter(p => !playerToGroup.has(p.playerId));
    return playersSorted(ungrouped, catsById);
  }, [state.players, playerToGroup, catsById]);

  const { setNodeRef: poolRef, isOver: poolOver } = useDroppable({ id: poolDropId() });

  const [newName, setNewName] = useState("");
  const [newCat, setNewCat] = useState(state.categories.find(c => c.rank === 3)?.categoryId ?? state.categories[0]?.categoryId ?? "");
  const nameRef = useRef<HTMLInputElement | null>(null);

  const focusName = () => {
    requestAnimationFrame(() => {
      nameRef.current?.focus();
      nameRef.current?.select();
    });
  };

  const addPlayer = () => {
    const name = newName.trim();
    if (!name) return toast("Enter a name.");

    const normalized = name.replace(/\s+/g, " ").toLocaleLowerCase();
    const exists = state.players.some(p => p.displayName.trim().replace(/\s+/g, " ").toLocaleLowerCase() === normalized);
    if (exists) return toast("Duplicate name not allowed.");

    dispatch({ type: "ADD_PLAYER", displayName: name, categoryId: newCat });
    setNewName("");
    focusName();
  };

  const addEmptyGroup = () => {
    const defaultCat = state.categories.find(c => c.rank === 3)?.categoryId ?? state.categories[0]?.categoryId ?? "";
    dispatch({ type: "ADD_EMPTY_GROUP", categoryId: defaultCat });
    toast("Group added.");
  };

  return (
    <>
      <div className="sectionHeader">
        <h3>Pool</h3>
        <div className="btnRow">
          <button className="btn iconBtn" onClick={addEmptyGroup} title="Add empty group">+</button>
        </div>
      </div>

      <div className="poolInner">
        <div className="poolRow">
          <input
            ref={nameRef}
            className="input"
            placeholder="Player"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addPlayer();
              }
            }}
          />
          <CategorySelect categories={state.categories} value={newCat} onChange={setNewCat} />
          <button className="btn btnPrimary" onClick={addPlayer}>+</button>
          <span className="kbdHint">Tip: drag player onto player to group.</span>
        </div>

        <div className="poolTwoCols">
          <div className="groupBox" ref={poolRef} style={{ outline: poolOver ? "2px solid rgba(34,197,94,.65)" : "none" }}>
            <div className="groupTop">
              <div className="groupTitle"><span>Groups</span></div>
              <div className="kbdHint">Drop here to unseat / ungroup</div>
            </div>

            <div className="groupMembers" style={{ flexDirection: "column", gap: 8 }}>
              {groups.length === 0 ? <div className="kbdHint">No groups.</div> : null}
              {groups.map(g => (
                <GroupRow key={g.groupId} groupId={g.groupId} seatedPlayerIds={seatedPlayerIds} onOpenActions={onOpenActions} />
              ))}
            </div>
          </div>

          <div className="groupBox">
            <div className="groupTop">
              <div className="groupTitle"><span>Individuals</span></div>
              <div className="kbdHint">Drag to seats</div>
            </div>

            <div className="groupMembers">
              {individuals.length === 0 ? <div className="kbdHint">No ungrouped players.</div> : null}
              {individuals.map(p => {
                const cat = catsById.get(p.categoryId);
                const seated = seatedPlayerIds.has(p.playerId);
                return (
                  <PlayerChip
                    key={p.playerId}
                    dragId={`player:${p.playerId}`}
                    dropId={playerDropIdWithToken(p.playerId, "pool")}
                    name={p.displayName}
                    color={cat?.color ?? "#999"}
                    sub={seated ? "S" : undefined}
                    onClick={() => onOpenActions("player", p.playerId)}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {state.lastAutoPodSummary && state.lastAutoPodSummary.moves.length > 0 ? (
          <div className="notice noticeGood">
            <b>Auto</b>{" "}
            {state.lastAutoPodSummary.moves.map(m => {
              const t = state.tables.find(tt => tt.tableId === m.tableId);
              const names = m.seatedPlayerIds.map(pid => state.players.find(pp => pp.playerId === pid)?.displayName ?? pid);
              return `T${t?.name ?? "?"}: ${names.join(", ")}`;
            }).join(" | ")}
          </div>
        ) : null}
      </div>
    </>
  );
}

function GroupRow({
  groupId,
  seatedPlayerIds,
  onOpenActions
}: {
  groupId: string;
  seatedPlayerIds: Set<string>;
  onOpenActions: (kind: "player" | "group", id: string) => void;
}) {
  const { state, dispatch } = useAppState();
  const g = state.groups.find(x => x.groupId === groupId)!;

  const playersById = useMemo(() => new Map(state.players.map(p => [p.playerId, p])), [state.players]);
  const catsById = useMemo(() => new Map(state.categories.map(c => [c.categoryId, c])), [state.categories]);

  const title = (g.label?.trim() || groupFallbackName(g, playersById)) + ` (${g.playerIds.length})`;
  const cat = catsById.get(g.categoryId);
  const anySeated = g.playerIds.some(pid => seatedPlayerIds.has(pid));
  const drop = groupDropId(g.groupId);

  return (
    <GroupShell
      dragId={`group:${g.groupId}`}
      dropId={drop}
      title={title}
      color={cat?.color ?? "#999"}
      right={
        <>
          <button className="btn iconBtn" title="Edit" onClick={() => onOpenActions("group", g.groupId)}>⋯</button>
          <button className="btn iconBtn btnDanger" title="Delete group" onClick={() => dispatch({ type: "DELETE_GROUP", groupId: g.groupId })}>×</button>
        </>
      }
    >
      {anySeated ? <span className="kbdHint">contains seated → Auto won’t move</span> : null}
      {g.playerIds.map(pid => {
        const p = playersById.get(pid);
        const pcat = p ? catsById.get(p.categoryId) : null;
        const seated = seatedPlayerIds.has(pid);
        return (
          <PlayerChip
            key={pid}
            dragId={`groupmember:${g.groupId}:${pid}`}
            dropId={playerDropIdWithToken(pid, `group:${g.groupId}`)}
            name={p?.displayName ?? pid}
            color={pcat?.color ?? "#999"}
            sub={seated ? "S" : undefined}
            onClick={() => onOpenActions("player", pid)}
          />
        );
      })}
      {g.playerIds.length === 0 ? <span className="kbdHint">Drop players here</span> : null}
    </GroupShell>
  );
}
