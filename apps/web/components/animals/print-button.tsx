'use client';

export function PrintButton(): React.JSX.Element {
  return (
    <button
      onClick={() => window.print()}
      className="no-print mt-2 rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-white hover:bg-primary-light transition-colors"
    >
      In mã QR
    </button>
  );
}
