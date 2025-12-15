"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--bg-color)" }}>
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div style={{
                flex: 1,
                marginLeft: "280px", // Desktop
                display: "flex",
                flexDirection: "column",
                transition: "margin-left 0.3s ease",
                width: "100%"
            }} className="main-content">
                <Header onMenuClick={() => setSidebarOpen(true)} />
                <main style={{ padding: "2rem", flex: 1 }}>
                    {children}
                </main>
                <Footer />
            </div>

            <style jsx global>{`
        @media (max-width: 1024px) {
          .main-content {
            margin-left: 0 !important;
          }
        }
      `}</style>
        </div>
    );
}
