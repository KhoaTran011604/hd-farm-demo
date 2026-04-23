import type { ReactNode } from 'react';

// Pass-through layout. Html/body live in [locale]/layout.tsx (localized routes)
// and in not-found.tsx (unmatched locale paths). Next.js 15 allows this when
// every rendered leaf supplies its own html/body.
export default function RootLayout({ children }: { children: ReactNode }): ReactNode {
  return children;
}
