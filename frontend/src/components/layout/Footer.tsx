"use client";

import styles from "./Footer.module.css";
import { useState } from "react";
import Image from "next/image";
import { useTheme } from "@/context/ThemeContext";

export default function Footer() {
  const year = new Date().getFullYear();
  const { theme } = useTheme();
  const logoCandidates = theme === "dark"
    ? [
        "/logo-octava-capa-remove.png",
        "/logo-octava-capa.png",
        "/logo-octava-capa.jpg",
        "/logo-octava-capa.png.png",
        "/logo-octava-capa.jpg.png",
        "/globe.svg"
      ]
    : [
        "/logo-octava-capa.png",
        "/logo-octava-capa-remove.png",
        "/logo-octava-capa.jpg",
        "/logo-octava-capa.png.png",
        "/logo-octava-capa.jpg.png",
        "/globe.svg"
      ];
  const [logoIndex, setLogoIndex] = useState(0);
  const logoSrc = logoCandidates[logoIndex];
  return (
    <footer className={styles.footer}>
      <div className={styles.brand}>
        <Image
          src={logoSrc}
          alt="Octava Capa"
          className={`${styles.logo} brand-mark`}
          width={32}
          height={32}
          onError={() => setLogoIndex(i => Math.min(i + 1, logoCandidates.length - 1))}
        />
        <span>Octava Capa — Software Development</span>
      </div>
      <div className={styles.links}>
        <span className={styles.link}>© {year}</span>
        <span className={styles.link}>Todos los derechos reservados</span>
      </div>
    </footer>
  );
}
