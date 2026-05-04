import type { ReactNode } from "react";

export function Modal({
  children,
  title,
  onClose,
}: {
  children: ReactNode;
  title: string;
  onClose: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(6, 8, 12, 0.72)",
        display: "grid",
        placeItems: "center",
        padding: "1rem",
        zIndex: 50,
      }}
      onMouseDown={(ev) => {
        if (ev.target === ev.currentTarget) onClose();
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: "min(480px, 100%)",
          maxHeight: "90vh",
          overflowY: "auto",
          padding: "1.25rem 1.35rem",
        }}
        onMouseDown={(ev) => ev.stopPropagation()}
      >
        <h2 style={{ margin: "0 0 1rem", fontSize: "1.1rem" }}>{title}</h2>
        {children}
      </div>
    </div>
  );
}
