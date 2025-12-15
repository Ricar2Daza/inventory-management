import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Exportar a Excel (.xlsx)
export const downloadExcel = (data: any[], filename: string) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, `${filename}.xlsx`);
};

// Exportar a PDF
export const downloadPDF = (data: any[], filename: string, columns: { header: string, dataKey: string }[]) => {
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
        body: data.map(item => columns.map(c => item[c.dataKey])),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [66, 66, 166] } // Color primario de tu marca
    });

    doc.save(`${filename}.pdf`);
};

// Manter la de CSV por compatibilidad si se desea, o usar la de Excel
export const downloadCSV = (data: any[], filename: string) => {
    downloadExcel(data, filename); // Reemplazamos CSV por Excel real que es mejor
};
