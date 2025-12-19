"use client";

import { useState } from "react";
import api from "@/services/api";
import styles from "./ImportProductsModal.module.css";

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
            const res = await api.post("/products/import", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            setUploadResult(res.data);
        } catch (error: any) {
            console.error(error);
            setUploadResult({
                created: 0,
                errors: [error.response?.data?.detail || "Error al procesar el archivo."],
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadTemplate = () => {
        const csvContent =
            "sku,nombre,precio,cantidad_actual,alerta_stock_bajo,categoria,proveedor\n" +
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
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2>Importar Productos (CSV)</h2>
                    <button onClick={onClose} className={styles.closeBtn}>✕</button>
                </div>

                <div className={styles.body}>
                    {!uploadResult ? (
                        <form onSubmit={handleSubmit}>
                            <a
                                href="#"
                                onClick={(e) => { e.preventDefault(); handleDownloadTemplate(); }}
                                className={styles.templateLink}
                            >
                                📥 Descargar Plantilla CSV
                            </a>

                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                className={`${styles.dropzone} ${dragging ? styles.dragging : ""}`}
                                onClick={() => document.getElementById("fileInput")?.click()}
                            >
                                <div className={styles.dropzoneIcon}>📁</div>
                                <div className={styles.dropzoneText}>
                                    {file ? (
                                        <strong style={{ color: "var(--primary-color)" }}>{file.name}</strong>
                                    ) : (
                                        <>
                                            Arrastra tu archivo CSV aquí o <span className={styles.browseLink}>búscalo</span>
                                        </>
                                    )}
                                </div>
                                <input
                                    id="fileInput"
                                    type="file"
                                    accept=".csv"
                                    style={{ display: "none" }}
                                    onChange={handleFileChange}
                                />
                            </div>

                            <div className={styles.actions}>
                                <button type="button" className="btn" onClick={onClose}>Cancelar</button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={!file || loading}
                                >
                                    {loading ? "Procesando..." : "Comenzar Importación"}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className={styles.resultsContainer}>
                            <div className={`${styles.results} ${uploadResult.errors.length > 0 ? styles.hasErrors : ""}`}>
                                <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>Resultado:</h3>
                                <p>✅ Productos creados: <strong>{uploadResult.created}</strong></p>

                                {uploadResult.errors.length > 0 && (
                                    <ul className={styles.errorList}>
                                        {uploadResult.errors.map((err, idx) => (
                                            <li key={idx}>• {err}</li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div className={styles.actions}>
                                <button
                                    onClick={() => {
                                        if (uploadResult.created > 0) onSuccess();
                                        onClose();
                                    }}
                                    className="btn btn-primary"
                                >
                                    Cerrar y Actualizar
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
