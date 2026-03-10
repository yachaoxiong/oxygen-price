type PrintWindowOptions = {
  width: number;
  height: number;
  delayMs?: number;
};

export function printHtml(html: string, options: PrintWindowOptions) {
  const win = window.open("", "_blank", `width=${options.width},height=${options.height}`);
  if (!win) return;

  const doc = win.document;
  doc.open();
  doc.close();

  const parsed = new DOMParser().parseFromString(html, "text/html");
  doc.documentElement.replaceWith(doc.importNode(parsed.documentElement, true));
  win.focus();

  const delayMs = options.delayMs ?? 0;
  if (delayMs > 0) {
    setTimeout(() => {
      win.print();
    }, delayMs);
    return;
  }

  win.print();
}
