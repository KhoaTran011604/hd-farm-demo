'use client';

import Error from 'next/error';

// Rendered when the locale in the URL does not match a configured locale
// (e.g. `/fr/...` while only `vi` and `en` are supported). Client-only to
// sidestep a monorepo SSG bug where Next renders the default 404 component
// with a null React hooks dispatcher.
export default function GlobalNotFound(): React.JSX.Element {
  return (
    <html lang="vi">
      <body>
        <Error statusCode={404} />
      </body>
    </html>
  );
}
