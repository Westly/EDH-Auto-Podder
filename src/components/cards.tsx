import React from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";

export function PlayerChip({
  dragId,
  dropId,
  title,
  color,
  right,
  onClick
}: {
  dragId: string;
  dropId?: string;
  title: string;
  color: string;
  right?: React.ReactNode;
  onClick?: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: dragId });
  const droppable = useDroppable({ id: dropId ?? `__no_drop__:${dragId}`, disabled: !dropId });

  const style: React.CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.65 : 1,
    outline: droppable.isOver ? "2px solid rgba(59,130,246,.65)" : "none"
  };

  const ref = (node: HTMLDivElement | null) => {
    setNodeRef(node);
    droppable.setNodeRef(node);
  };

  return (
    <div
      ref={ref}
      className="chip"
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      title={title}
    >
      <span className="badge" style={{ background: color }} />
      <div className="chipTitle">{title}</div>
      {right}
    </div>
  );
}

export function GroupDragHandle({
  id,
  color,
  title,
  subtitle,
  right
}: {
  id: string;
  color: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
  const style: React.CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.65 : 1
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="chip" title="Drag group to a table">
      <span className="badge" style={{ background: color }} />
      <div style={{ minWidth: 0 }}>
        <div className="chipTitle" style={{ maxWidth: 160 }}>{title}</div>
        {subtitle ? <div className="kbdHint">{subtitle}</div> : null}
      </div>
      {right}
    </div>
  );
}
