"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [loading, isAuthenticated, router]);

  // Handle initial state for sidebar width to avoid flash
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--bg-color)" }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div style={{
        flex: 1,
        marginLeft: isMobile ? "0" : "260px",
        display: "flex",
        flexDirection: "column",
        transition: "margin-left 0.3s ease",
        width: "100%",
        minWidth: 0,
        overflowX: "hidden" // Ensure no horizontal scroll
      }} className="main-content">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main style={{ padding: isMobile ? "1rem" : "2rem", flex: 1 }}>
          {isAuthenticated ? children : null}
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
