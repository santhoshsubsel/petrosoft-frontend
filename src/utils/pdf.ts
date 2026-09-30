import { jsPDF } from "jspdf";

export interface OilInvoicePdfInput {
  invoiceNumber: string;
  invoiceDate: string;
  paymentMethod: string;
  subtotal: number | string;
  discount: number | string;
  totalAmount: number | string;
  businessUnit?: string;
  lines: Array<{
    productName: string;
    quantity: number | string;
    unitPrice: number | string;
    totalAmount: number | string;
  }>;
}

const money = (value: number | string | undefined) =>
  `Rs. ${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function downloadOilInvoicePdf(data: OilInvoicePdfInput) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 18;

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(data.businessUnit || "RAJ AGENCIES, HPCL DEALER", 14, y);
  y += 8;
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Lubricant Oil Invoice", 14, y);
  doc.text(`Invoice: ${data.invoiceNumber}`, pageWidth - 14, y, { align: "right" });
  y += 7;
  doc.setFontSize(9);
  doc.text(`Date: ${new Date(data.invoiceDate).toLocaleDateString("en-IN")}`, 14, y);
  doc.text(`Payment: ${data.paymentMethod}`, pageWidth - 14, y, { align: "right" });
  y += 8;

  doc.line(14, y, pageWidth - 14, y);
  y += 7;

  doc.setFont("helvetica", "bold");
  doc.text("Product", 14, y);
  doc.text("Qty", 120, y, { align: "right" });
  doc.text("Rate", 150, y, { align: "right" });
  doc.text("Amount", pageWidth - 14, y, { align: "right" });
  y += 5;
  doc.setFont("helvetica", "normal");

  for (const line of data.lines) {
    doc.text(line.productName.slice(0, 48), 14, y);
    doc.text(String(line.quantity), 120, y, { align: "right" });
    doc.text(money(line.unitPrice), 150, y, { align: "right" });
    doc.text(money(line.totalAmount), pageWidth - 14, y, { align: "right" });
    y += 6;
    if (y > 270) {
      doc.addPage();
      y = 18;
    }
  }

  y += 4;
  doc.line(110, y, pageWidth - 14, y);
  y += 7;
  doc.text("Subtotal", 145, y, { align: "right" });
  doc.text(money(data.subtotal), pageWidth - 14, y, { align: "right" });
  y += 6;
  doc.text("Discount", 145, y, { align: "right" });
  doc.text(money(data.discount), pageWidth - 14, y, { align: "right" });
  y += 7;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Grand Total", 145, y, { align: "right" });
  doc.text(money(data.totalAmount), pageWidth - 14, y, { align: "right" });
  y += 18;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Thank you.", pageWidth / 2, y, { align: "center" });

  doc.save(`${data.invoiceNumber}.pdf`);
}

export interface PaymentReceiptPdfInput {
  receiptNumber: string;
  customerName: string;
  phone?: string | null;
  amount: number | string;
  paymentMethod?: string;
  referenceNumber?: string | null;
  receivedAt?: string;
  outstandingAmount?: number | string;
}

export function downloadPaymentReceiptPdf(data: PaymentReceiptPdfInput) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 24;
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Cash Receipt", pageWidth / 2, y, { align: "center" });
  y += 12;
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  const rows = [
    ["Receipt Number", data.receiptNumber],
    ["Customer", data.customerName],
    ["Phone", data.phone || "-"],
    ["Date", data.receivedAt ? new Date(data.receivedAt).toLocaleString("en-IN") : "-"],
    ["Payment Method", data.paymentMethod || "-"],
    ["Reference", data.referenceNumber || "-"],
    ["Amount Received", money(data.amount)],
    ["Outstanding After Payment", money(data.outstandingAmount)],
  ];
  for (const [label, value] of rows) {
    doc.setFont("helvetica", "bold");
    doc.text(label, 22, y);
    doc.setFont("helvetica", "normal");
    doc.text(String(value), pageWidth - 22, y, { align: "right" });
    doc.line(22, y + 3, pageWidth - 22, y + 3);
    y += 11;
  }
  doc.setFontSize(9);
  doc.text("Thank you.", pageWidth / 2, y + 10, { align: "center" });
  doc.save(`${data.receiptNumber}.pdf`);
}
