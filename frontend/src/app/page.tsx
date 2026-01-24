import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <main>
      <div className="container">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            gap: "2rem",
          }}
        >
          <div
            style={{
              position: "relative",
              height: 112,
              width: 112,
              margin: "0 auto",
              marginBottom: 24,
            }}
          >
            <Image
              src="/logo-octava-capa.png"
              alt="Octava Capa"
              className="brand-logo-light brand-mark"
              fill
              style={{ objectFit: "contain" }}
            />
            <Image
              src="/logo-octava-capa-remove.png"
              alt="Octava Capa"
              className="brand-logo-dark brand-mark"
              fill
              style={{ objectFit: "contain" }}
            />
          </div>
          <h1
            style={{
              fontSize: "3rem",
              fontWeight: "800",
              color: "var(--primary-color)",
            }}
          >
            Sistema de Inventario
          </h1>
          <p
            style={{
              fontSize: "1.25rem",
              color: "var(--text-secondary)",
            }}
          >
            Panel de Administración Seguro y Eficiente
          </p>
          <div style={{ display: "flex", gap: "1rem" }}>
            <Link
              href="/login"
              className="btn btn-primary"
              style={{
                padding: "0.75rem 2rem",
                borderRadius: "var(--radius-md)",
              }}
            >
              Iniciar Sesión
            </Link>
            <a
              href="http://localhost:8000/docs"
              target="_blank"
              className="btn"
              style={{
                border: "1px solid var(--border-color)",
                padding: "0.75rem 2rem",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--surface-color)",
              }}
            >
              Documentación
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
