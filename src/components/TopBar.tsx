import React, { useState } from "react";
import { useAppState } from "../state/StateProvider";
import { downloadText } from "../utils/download";
import { zAppState } from "../state/schema";
import { toast } from "./Toasts";

export function TopBar({ onAutoPod, seatedCount }: { onAutoPod: () => void; seatedCount: number }) {
  const { state, dispatch, canUndo, canRedo } = useAppState();
  const [addCount, setAddCount] = useState("1");

  const exportJson = () => {
    const file = `fnm_podder_export_${new Date().toISOString().slice(0, 10)}.json`;
    downloadText(file, JSON.stringify(state, null, 2));
    toast("Exported.");
  };

  const importJson = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        const obj = JSON.parse(text);
        const parsed = zAppState.safeParse(obj);
        if (!parsed.success) return toast("Import failed (schema).");
        dispatch({ type: "IMPORT_STATE", snapshot: parsed.data });
        toast("Imported.");
      } catch {
        toast("Import failed (JSON).");
      }
    };
    input.click();
  };

  return (
    <div className="sectionHeader" style={{ borderRadius: 14 }}>
      <h3>FNM Podder</h3>
      <div className="btnRow">
        <button className="btn btnPrimary" onClick={onAutoPod}>Auto</button>

        <input
          className="input"
          style={{ width: 54, textAlign: "center" }}
          value={addCount}
          onChange={e => setAddCount(e.target.value.replace(/[^0-9]/g, ""))}
          aria-label="Number of tables to add"
          title="Number of tables"
        />
        <button
          className="btn iconBtn"
          onClick={() => {
            const n = Number(addCount || "1");
            dispatch({ type: "ADD_TABLES", count: n });
            toast(`Added ${Math.max(1, Math.min(50, Math.floor(n || 1)))} table(s).`);
          }}
          title="Add tables"
          aria-label="Add tables"
        >
          +
        </button>

        <button className="btn iconBtn" onClick={() => dispatch({ type: "UNDO" })} disabled={!canUndo} title="Undo">↶</button>
        <button className="btn iconBtn" onClick={() => dispatch({ type: "REDO" })} disabled={!canRedo} title="Redo">↷</button>

        <button className="btn" onClick={exportJson}>Export</button>
        <button className="btn" onClick={importJson}>Import</button>

        <span className="kbdHint">Seated: {seatedCount}</span>
      </div>
    </div>
  );
}
