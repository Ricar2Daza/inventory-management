"use client";

import { useState } from "react";
import axios from "axios";

interface ImportProductsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function ImportProductsModal({
    isOpen,
    onClose,
    onSuccess,
}: ImportProductsModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [uploadResult, setUploadResult] = useState<{
        created: number;
        errors: string[];
    } | null>(null);
    const [dragging, setDragging] = useState(false);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setUploadResult(null);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
            setUploadResult(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setLoading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            // Ajustar URL según tu configuración (puerto 8000 default fastapi)
            const res = await axios.post("http://localhost:8000/products/import", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            setUploadResult(res.data);
            if (res.data.created > 0) {
                // Opcional: Cerrar automáticamente o esperar confirmación
                // onSuccess(); 
            }
        } catch (error) {
            console.error(error);
            setUploadResult({
                created: 0,
                errors: ["Error de conexión o archivo inválido"],
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadTemplate = () => {
        const csvContent =
            "sku,name,unit_price,current_stock,min_stock_level,category_name,supplier_name\n" +
            "SKU001,Producto Ejemplo,100.50,50,5,Electrónica,Proveedor A";
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "template_productos.csv");
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all scale-100">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                        Importar Productos (CSV)
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    >
                        <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                <div className="p-6">
                    {!uploadResult ? (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${dragging
                                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                        : "border-gray-300 dark:border-gray-600 hover:border-blue-400"
                                    }`}
                            >
                                <div className="flex flex-col items-center justify-center space-y-2">
                                    <svg
                                        className="w-10 h-10 text-gray-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={1.5}
                                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                        />
                                    </svg>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                        {file
                                            ? file.name
                                            : "Arrastra tu archivo CSV aquí o haz clic para seleccionar"}
                                    </p>
                                    <label className="cursor-pointer">
                                        <span className="text-blue-600 font-medium hover:text-blue-500">
                                            Examinar archivos
                                        </span>
                                        <input
                                            type="file"
                                            accept=".csv"
                                            className="hidden"
                                            onChange={handleFileChange}
                                        />
                                    </label>
                                </div>
                            </div>

                            <div className="flex justify-between items-center text-sm">
                                <button
                                    type="button"
                                    onClick={handleDownloadTemplate}
                                    className="text-blue-600 hover:text-blue-700 underline flex items-center gap-1"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                    Descargar Plantilla
                                </button>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors dark:bg-slate-700 dark:text-gray-200 dark:hover:bg-slate-600"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={!file || loading}
                                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30"
                                >
                                    {loading ? (
                                        <span className="flex items-center gap-2">
                                            <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Procesando...
                                        </span>
                                    ) : (
                                        "Importar Productos"
                                    )}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-4 animate-fadeIn">
                            <div className={`p-4 rounded-lg bg-gray-50 dark:bg-slate-700/50 ${uploadResult.errors.length === 0 ? 'border-l-4 border-green-500' : 'border-l-4 border-yellow-500'}`}>
                                <h3 className="font-bold text-lg mb-2 dark:text-white">Resumen de Importación</h3>
                                <p className="text-gray-700 dark:text-gray-300">
                                    ✅ Productos creados: <strong>{uploadResult.created}</strong>
                                </p>
                                {uploadResult.errors.length > 0 && (
                                    <div className="mt-3">
                                        <p className="font-semibold text-red-600 dark:text-red-400 mb-1">
                                            ⚠️ Errores ({uploadResult.errors.length}):
                                        </p>
                                        <ul className="text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded max-h-40 overflow-y-auto">
                                            {uploadResult.errors.map((err, idx) => (
                                                <li key={idx} className="mb-1 border-b border-red-100 last:border-0 pb-1">
                                                    • {err}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-end pt-2">
                                <button
                                    onClick={() => {
                                        onSuccess();
                                        onClose();
                                    }}
                                    className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
