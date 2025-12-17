import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Sistema de Inventario",
  description: "Gestión de inventario inteligente",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <Script id="silence-console" strategy="beforeInteractive">
          {`(function(){try{
            var c=window.console||{};
            c.log=function(){};
            c.info=function(){};
            c.debug=function(){};
            c.trace=function(){};
            c.warn=function(){};
            c.error=function(){};
            window.console=c;
            window.onerror=function(){return true};
            window.addEventListener('error',function(e){try{e.preventDefault();}catch(_){}} ,true);
            window.addEventListener('unhandledrejection',function(e){try{e.preventDefault();}catch(_){}} ,true);
          }catch(_){}})();`}
        </Script>
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
