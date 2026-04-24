import QRCode from 'qrcode';

interface PrintAnimalQrInput {
  code: string;
  name: string;
  species: string;
  penName: string | null;
  penLabel: string;
}

export async function printAnimalQr(input: PrintAnimalQrInput): Promise<void> {
  const svgString = await QRCode.toString(input.code, {
    type: 'svg',
    width: 280,
    margin: 2,
    color: { dark: '#1A3009', light: '#FFFFFF' },
  });

  const win = window.open('', '_blank', 'width=480,height=640');
  if (!win) return;

  const penLine = input.penName
    ? `<div class="meta-sub">${escapeHtml(input.penLabel)}: ${escapeHtml(input.penName)}</div>`
    : '';

  win.document.write(`<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${escapeHtml(input.name)} — ${escapeHtml(input.code)}</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1A2E0A; background: #fff; }
  .wrap { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px; gap: 16px; }
  .qr-frame { border: 4px solid #1A3009; border-radius: 16px; padding: 20px; background: #fff; }
  .qr-frame svg { display: block; width: 280px; height: 280px; }
  .code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 22px; font-weight: 700; letter-spacing: 2px; }
  .name { font-size: 16px; font-weight: 600; }
  .meta { font-size: 13px; color: #4B5563; }
  .meta-sub { font-size: 12px; color: #6B7280; margin-top: 2px; }
  @media print {
    @page { margin: 12mm; }
    .qr-frame { border-width: 2px; }
  }
</style>
</head>
<body>
  <div class="wrap">
    <div class="qr-frame">${svgString}</div>
    <div class="code">${escapeHtml(input.code)}</div>
    <div class="name">${escapeHtml(input.name)}</div>
    <div class="meta">${escapeHtml(input.species)}</div>
    ${penLine}
  </div>
  <script>
    window.addEventListener('load', function () {
      setTimeout(function () {
        window.focus();
        window.print();
      }, 100);
    });
    window.addEventListener('afterprint', function () { window.close(); });
  </script>
</body>
</html>`);
  win.document.close();
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
