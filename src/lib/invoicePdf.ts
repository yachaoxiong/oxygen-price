import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

type InvoicePdfInput = {
  invoiceElement: HTMLDivElement;
  invoiceNo: string;
};

async function renderInvoicePdfBlob({ invoiceElement }: { invoiceElement: HTMLDivElement }): Promise<Blob> {
  try {
    await document.fonts.ready;
  } catch {
    // ignore font readiness failures
  }

  const exportHost = document.createElement("div");
  exportHost.style.position = "fixed";
  exportHost.style.left = "-10000px";
  exportHost.style.top = "0";
  exportHost.style.width = "850px";
  exportHost.style.height = "1202px";
  exportHost.style.background = "#ffffff";
  exportHost.style.zIndex = "-1";
  exportHost.style.pointerEvents = "none";

  const clonedInvoice = invoiceElement.cloneNode(true) as HTMLElement;
  clonedInvoice.style.width = "850px";
  clonedInvoice.style.height = "1202px";
  clonedInvoice.style.transform = "none";
  clonedInvoice.style.margin = "0";

  exportHost.appendChild(clonedInvoice);
  document.body.appendChild(exportHost);

  try {
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));

    const canvas = await html2canvas(clonedInvoice, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false,
      width: 850,
      height: 1202,
      windowWidth: 850,
      windowHeight: 1202,
    });

    const imageData = canvas.toDataURL("image/png", 1);
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    const pdfWidth = doc.internal.pageSize.getWidth();
    const pdfHeight = doc.internal.pageSize.getHeight();
    const renderRatio = Math.min(pdfWidth / canvas.width, pdfHeight / canvas.height);
    const renderWidth = canvas.width * renderRatio;
    const renderHeight = canvas.height * renderRatio;
    const offsetX = (pdfWidth - renderWidth) / 2;
    const offsetY = (pdfHeight - renderHeight) / 2;

    doc.addImage(imageData, "PNG", offsetX, offsetY, renderWidth, renderHeight, undefined, "FAST");

    return doc.output("blob");
  } finally {
    document.body.removeChild(exportHost);
  }
}

export async function generateInvoicePdfBlob({ invoiceElement }: { invoiceElement: HTMLDivElement }): Promise<Blob> {
  return renderInvoicePdfBlob({ invoiceElement });
}

export async function downloadInvoicePdfFromElement({ invoiceElement, invoiceNo }: InvoicePdfInput) {
  const pdfBlob = await renderInvoicePdfBlob({ invoiceElement });
  const safeInvoiceNo = invoiceNo.replace(/[^A-Za-z0-9_-]/g, "");

  const blobUrl = URL.createObjectURL(pdfBlob);
  const anchor = document.createElement("a");
  anchor.href = blobUrl;
  anchor.download = `${safeInvoiceNo || "invoice"}.pdf`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(blobUrl);
}

export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Failed to convert PDF blob to base64."));
        return;
      }

      const base64 = result.split(",")[1];
      if (!base64) {
        reject(new Error("Generated PDF is empty."));
        return;
      }
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Failed to read generated PDF."));
    reader.readAsDataURL(blob);
  });
}
