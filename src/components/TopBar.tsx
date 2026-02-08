import React from "react";
import { useAppState } from "../state/StateProvider";
import { downloadText } from "../utils/download";
import { zAppState } from "../state/schema";
import { toast } from "./Toasts";
import { openPrintView } from "../utils/print";
import { FaUndo, FaRedo, FaPrint, FaFileExport, FaFileImport, MdMagicWand } from "./Icons";

export function TopBar({ onAutoPod, seatedCount }: { onAutoPod: () => void; seatedCount: number }) {
  const { state, dispatch, canUndo, canRedo } = useAppState();

  const exportJson = () => {
    const file = `edh_auto_podder_export_${new Date().toISOString().slice(0, 10)}.json`;
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
      <h3>EDH Auto Podder</h3>
      <div className="btnRow">
        {/* Only top-bar button with text */}
        <button className="btn btnPrimary btnWithIcon" onClick={onAutoPod} title="Auto Pod">
          <MdMagicWand className="iconSvg" />
          <span>Auto Pod</span>
        </button>

        {/* Icon buttons with tooltips */}
        <button
          className="btn iconBtn"
          onClick={() => openPrintView(state)}
          title="Print seating"
          aria-label="Print seating"
        >
          <FaPrint className="iconSvg" />
        </button>

        <button
          className="btn iconBtn"
          onClick={() => dispatch({ type: "UNDO" })}
          disabled={!canUndo}
          title="Undo"
          aria-label="Undo"
        >
          <FaUndo className="iconSvg" />
        </button>

        <button
          className="btn iconBtn"
          onClick={() => dispatch({ type: "REDO" })}
          disabled={!canRedo}
          title="Redo"
          aria-label="Redo"
        >
          <FaRedo className="iconSvg" />
        </button>

        <button className="btn iconBtn" onClick={exportJson} title="Export" aria-label="Export">
          <FaFileExport className="iconSvg" />
        </button>

        <button className="btn iconBtn" onClick={importJson} title="Import" aria-label="Import">
          <FaFileImport className="iconSvg" />
        </button>

        <span className="kbdHint">Seated: {seatedCount}</span>
      </div>
    </div>
  );
}
