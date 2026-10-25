import type { ReactNode } from "react";

export type ReceiptRow = { label: string; value: ReactNode; title?: string };

/** Receipt-style card shared by the proof card, the home mockup and the footer. */
export function Receipt({
  title,
  badge,
  rows,
  total,
  children,
  className = "",
}: {
  title: string;
  badge?: ReactNode;
  rows: ReceiptRow[];
  total?: ReceiptRow;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`receipt ${className}`}>
      <div className="receipt-head">
        <h3>{title}</h3>
        {badge && <span className="mono muted">{badge}</span>}
      </div>
      <div className="receipt-sep" style={{ marginTop: 0 }} />
      {rows.map((r) => (
        <div className="receipt-row" key={r.label}>
          <span>{r.label}</span>
          <span title={r.title}>{r.value}</span>
        </div>
      ))}
      {total && (
        <>
          <div className="receipt-sep" />
          <div className="receipt-row receipt-total">
            <span>{total.label}</span>
            <span className="ok">{total.value}</span>
          </div>
        </>
      )}
      {children}
    </div>
  );
}
