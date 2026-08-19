import type { ReactNode } from "react";

type DialogProps = {
  title: string;
  onClose(): void;
  children: ReactNode;
  leading?: ReactNode;
};

export function Dialog({ title, onClose, children, leading }: DialogProps) {
  return (
    <div
      className="dialog-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <section
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        <header className="dialog-header">
          <div>{leading}</div>
          <h2 id="dialog-title">{title}</h2>
          <button className="icon-button" aria-label="Close" onClick={onClose}>
            ×
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}
