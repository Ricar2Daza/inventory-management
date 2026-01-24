import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable, { type RowInput } from 'jspdf-autotable';

type RowData = Record<string, unknown>;

// Exportar a Excel (.xlsx)
export const downloadExcel = <T extends RowData>(data: T[], filename: string) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, `${filename}.xlsx`);
};

// Exportar a PDF
export const downloadPDF = <T extends RowData>(
    data: T[],
    filename: string,
    columns: { header: string; dataKey: keyof T }[]
) => {
    const doc = new jsPDF();

    // Título
    doc.setFontSize(18);
    doc.text(filename.replace(/-/g, ' ').toUpperCase(), 14, 22);
    doc.setFontSize(11);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 30);

    // Tabla
    autoTable(doc, {
        startY: 35,
        head: [columns.map(c => c.header)],
        body: data.map(item => columns.map(c => item[c.dataKey])) as RowInput[],
        styles: { fontSize: 8 },
        headStyles: { fillColor: [66, 66, 166] } // Color primario de tu marca
    });

    doc.save(`${filename}.pdf`);
};

// Mantener la de CSV por compatibilidad si se desea, o usar la de Excel
export const downloadCSV = <T>(data: T[], filename: string) => {
    downloadExcel(data as RowData[], filename);
};
