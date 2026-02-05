import React, { useMemo, useState } from "react";
import { useAppState } from "../state/StateProvider";
import { CategorySelect } from "./CategorySelect";
import { toast } from "./Toasts";

export function ActionModal({
  open,
  entity,
  onClose
}: {
  open: boolean;
  entity: { kind: "player" | "group"; id: string } | null;
  onClose: () => void;
}) {
  const { state, dispatch } = useAppState();

  const [rename, setRename] = useState("");

  const player = entity?.kind === "player" ? state.players.find(p => p.playerId === entity.id) : null;
  const group = entity?.kind === "group" ? state.groups.find(g => g.groupId === entity.id) : null;

  const inGroupId = useMemo(() => {
    if (!player) return null;
    const g = state.groups.find(gr => gr.playerIds.includes(player.playerId));
    return g?.groupId ?? null;
  }, [player, state.groups]);

  const close = () => {
    setRename("");
    onClose();
  };

  if (!open || !entity) return null;

  return (
    <div className="modalBackdrop" role="dialog" aria-modal="true">
      <div className="modalCard">
        <div className="modalHeader">
          <h3>Actions</h3>
          <button className="btn btnSmall" onClick={close}>
            Close
          </button>
        </div>

        <div className="modalBody">
          {player ? (
            <>
              <div className="notice">
                <b>Player:</b> {player.displayName}
                <div className="kbdHint">Keyboard fallback: use this modal to assign/unassign.</div>
              </div>

              <div className="formRow">
                <label className="kbdHint">Category</label>
                <CategorySelect
                  categories={state.categories}
                  value={player.categoryId}
                  onChange={(categoryId) => dispatch({ type: "SET_PLAYER_CATEGORY", playerId: player.playerId, categoryId })}
                />
              </div>

              {inGroupId ? (
                <div className="notice noticeWarn">
                  This player is in a group. To make them an individual, click:
                  <div style={{ marginTop: 8 }}>
                    <button
                      className="btn btnDanger"
                      onClick={() => {
                        dispatch({ type: "REMOVE_PLAYER_FROM_GROUP", playerId: player.playerId });
                        toast("Removed from group.");
                      }}
                    >
                      Remove from group
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="notice">
                Seating:
                <div className="btnRow" style={{ marginTop: 8 }}>
                  <button
                    className="btn"
                    onClick={() => {
                      dispatch({ type: "UNSEAT_PLAYER", playerId: player.playerId });
                      toast("Unseated (if seated).");
                    }}
                  >
                    Unseat
                  </button>
                  <button
                    className="btn btnDanger"
                    onClick={() => {
                      if (!window.confirm("Remove player entirely?")) return;
                      dispatch({ type: "REMOVE_PLAYER", playerId: player.playerId });
                      toast("Player removed.");
                      close();
                    }}
                  >
                    Delete Player
                  </button>
                </div>
              </div>

              <AssignToSeatPicker playerId={player.playerId} />
            </>
          ) : null}

          {group ? (
            <>
              <div className="notice">
                <b>Group:</b> {group.label || "(no label)"} • size {group.playerIds.length}
              </div>

              <div className="formRow">
                <label className="kbdHint">Category</label>
                <CategorySelect
                  categories={state.categories}
                  value={group.categoryId}
                  onChange={(categoryId) => dispatch({ type: "SET_GROUP_CATEGORY", groupId: group.groupId, categoryId })}
                />
              </div>

              <div className="formRow">
                <input
                  className="input"
                  placeholder="Rename group label"
                  value={rename}
                  onChange={e => setRename(e.target.value)}
                />
                <button
                  className="btn"
                  onClick={() => {
                    const v = rename.trim();
                    if (!v) return toast("Enter a label.");
                    dispatch({ type: "RENAME_GROUP", groupId: group.groupId, label: v });
                    setRename("");
                    toast("Renamed group.");
                  }}
                >
                  Save
                </button>
              </div>

              <div className="notice noticeWarn">
                Auto Pod does not partially seat groups. Drag individuals if you want to split.
              </div>
            </>
          ) : null}
        </div>

        <div className="modalFooter">
          <button className="btn" onClick={close}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function AssignToSeatPicker({ playerId }: { playerId: string }) {
  const { state, dispatch } = useAppState();
  const [tableId, setTableId] = useState(state.tables[0]?.tableId ?? "");
  const [seatIndex, setSeatIndex] = useState(0);

  const table = state.tables.find(t => t.tableId === tableId);

  const canAssign = table ? table.seats[seatIndex] == null : false;

  return (
    <div className="notice">
      <b>Assign to seat</b> (keyboard fallback)
      {state.tables.length === 0 ? (
        <div className="kbdHint" style={{ marginTop: 6 }}>
          No tables available.
        </div>
      ) : (
        <div className="formRow" style={{ marginTop: 8 }}>
          <select value={tableId} onChange={e => setTableId(e.target.value)}>
            {state.tables.map(t => (
              <option key={t.tableId} value={t.tableId}>
                Table {t.name}
              </option>
            ))}
          </select>

          <select value={String(seatIndex)} onChange={e => setSeatIndex(Number(e.target.value))}>
            {(table?.seats ?? []).map((_, idx) => (
              <option key={idx} value={String(idx)}>
                Seat {idx + 1} {table?.seats[idx] ? "(occupied)" : ""}
              </option>
            ))}
          </select>

          <button
            className="btn btnPrimary"
            disabled={!canAssign}
            onClick={() => {
              if (!table) return;
              dispatch({ type: "ASSIGN_PLAYER_TO_SEAT", tableId, seatIndex, playerId });
              toast("Assigned to seat.");
            }}
          >
            Assign
          </button>
        </div>
      )}
    </div>
  );
}
