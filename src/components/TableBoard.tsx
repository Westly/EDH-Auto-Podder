import React, { useMemo } from "react";
import { useDroppable } from "@dnd-kit/core";
import { useAppState } from "../state/StateProvider";
import { tablesSorted } from "../utils/sort";
import { seatDropId, tableDropId, playerDropIdWithToken } from "../dnd/dndUtils";
import { PlayerChip } from "./chips";
import { toast } from "./Toasts";

export function TableBoard() {
  const { state } = useAppState();
  const tables = useMemo(() => tablesSorted(state.tables), [state.tables]);

  return (
    <>
      <div className="sectionHeader">
        <h3>Tables</h3>
        <div className="kbdHint">Drag players or groups into seats</div>
      </div>

      <div className="gridTables">
        {tables.map(t => (
          <TableCard key={t.tableId} tableId={t.tableId} />
        ))}
        {tables.length === 0 ? (
          <div className="notice noticeWarn">Add tables with the number box + “+” button.</div>
        ) : null}
      </div>
    </>
  );
}

function TableCard({ tableId }: { tableId: string }) {
  const { state, dispatch } = useAppState();
  const table = state.tables.find(t => t.tableId === tableId)!;

  const { setNodeRef, isOver } = useDroppable({ id: tableDropId(table.tableId) });

  const playersById = useMemo(() => new Map(state.players.map(p => [p.playerId, p])), [state.players]);
  const categoriesById = useMemo(() => new Map(state.categories.map(c => [c.categoryId, c])), [state.categories]);

  const openSeats = table.seats.filter(s => !s).length;

  const removeSeat = () => {
    const lastIndex = table.seatCount - 1;
    const last = table.seats[lastIndex];
    if (last) {
      const ok = window.confirm("Last seat occupied. Unseat it and remove the seat?");
      if (!ok) return;
      dispatch({ type: "CLEAR_SEAT", tableId: table.tableId, seatIndex: lastIndex });
      dispatch({ type: "REMOVE_SEAT", tableId: table.tableId, mode: "UNSEAT_EXCESS" });
      toast("Seat removed.");
      return;
    }
    dispatch({ type: "REMOVE_SEAT", tableId: table.tableId, mode: "BLOCK" });
  };

  const seatCount = table.seats.length;

  return (
    <div className="tableCard" ref={setNodeRef} style={{ outline: isOver ? "2px solid rgba(46,229,157,.6)" : "none" }}>
      <div className="tableHeader">
        <div className="tableTitle">
          <span className="kbdHint">Table</span>
          <input
            value={table.name}
            onChange={e => dispatch({ type: "RENAME_TABLE", tableId: table.tableId, name: e.target.value })}
            aria-label="Table name/number"
          />
          <span className="tableMeta">{openSeats}/{seatCount} open</span>
        </div>

        <div className="btnRow">
          <button className="btn iconBtn" onClick={() => dispatch({ type: "ADD_SEAT", tableId: table.tableId })} title="Add seat">+</button>
          <button className="btn iconBtn" onClick={removeSeat} title="Remove seat">−</button>
          <button className="btn iconBtn btnDanger" onClick={() => dispatch({ type: "REMOVE_TABLE", tableId: table.tableId })} title="Remove table">×</button>
        </div>
      </div>

      <div className="seatsGrid">
        {table.seats.map((pid, idx) => (
          <Seat key={idx} tableId={table.tableId} seatIndex={idx} playerId={pid} playersById={playersById} categoriesById={categoriesById} />
        ))}
      </div>
    </div>
  );
}

function Seat({
  tableId,
  seatIndex,
  playerId,
  playersById,
  categoriesById
}: {
  tableId: string;
  seatIndex: number;
  playerId: string | null;
  playersById: Map<string, any>;
  categoriesById: Map<string, any>;
}) {
  const { dispatch } = useAppState();
  const id = seatDropId(tableId, seatIndex);
  const { setNodeRef, isOver } = useDroppable({ id });

  const player = playerId ? playersById.get(playerId) : null;
  const cat = player ? categoriesById.get(player.categoryId) : null;

  return (
    <div
      className={"seatCell " + (player ? "filled" : "")}
      ref={setNodeRef}
      style={{ outline: isOver ? "2px solid rgba(59,130,246,.65)" : "none" }}
    >
      {!player ? (
        <span className="seatLabel">{seatIndex + 1}</span>
      ) : (
        <div className="seatInner">
          <PlayerChip
            dragId={`player:${player.playerId}`}
            dropId={playerDropIdWithToken(player.playerId, `seat:${tableId}:${seatIndex}`)}
            name={player.displayName}
            color={cat?.color || "#999"}
          />
          <button className="xBtn" onClick={() => dispatch({ type: "CLEAR_SEAT", tableId, seatIndex })} aria-label="Clear seat">×</button>
        </div>
      )}
    </div>
  );
}
