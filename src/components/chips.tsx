import React from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";

/**
 * IMPORTANT:
 * dnd-kit droppable IDs must be unique. We always register a droppable,
 * but when no explicit dropId is desired we use a unique "noop" id tied to dragId.
 */
export function PlayerChip({
  dragId,
  dropId,
  name,
  color,
  sub,
  onClick
}: {
  dragId: string;
  dropId?: string; // when provided, this chip can be a drop target too
  name: string;
  color: string;
  sub?: string;
  onClick?: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: dragId });

  const effectiveDropId = dropId ?? `noopdrop:${dragId}`;
  const drop = useDroppable({ id: effectiveDropId });

  const ref = (node: HTMLElement | null) => {
    setNodeRef(node);
    drop.setNodeRef(node);
  };

  const style: React.CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.35 : 1,
    outline: dropId && drop.isOver ? "2px solid rgba(34,197,94,.65)" : "none"
  };

  return (
    <div
      ref={ref as any}
      className="chip"
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      title={name}
    >
      <span className="chipBadge" style={{ background: color }} />
      <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 150 }}>{name}</span>
      {sub ? <span className="chipSub">{sub}</span> : null}
    </div>
  );
}

export function GroupShell({
  dragId,
  dropId,
  title,
  color,
  right,
  children
}: {
  dragId: string;
  dropId: string;
  title: string;
  color: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: dragId });
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: dropId });

  const ref = (node: HTMLElement | null) => {
    setNodeRef(node);
    setDropRef(node);
  };

  const style: React.CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.5 : 1,
    outline: isOver ? "2px solid rgba(59,130,246,.6)" : "none"
  };

  return (
    <div ref={ref as any} className="groupBox" style={style} {...listeners} {...attributes}>
      <div className="groupTop">
        <div className="groupTitle">
          <span className="chipBadge" style={{ background: color, width: 12, height: 12 }} />
          <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</span>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>{right}</div>
      </div>
      <div className="groupMembers">{children}</div>
    </div>
  );
}
