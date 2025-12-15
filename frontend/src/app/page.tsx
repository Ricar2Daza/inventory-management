import Link from 'next/link';
import styles from './page.module.css';

export default function Home() {
  return (
    <main className={styles.main}>
      <div className="container">
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: '2rem'
        }}>
          <h1 style={{ fontSize: '3rem', fontWeight: '800', color: 'var(--primary-color)' }}>
            Sistema de Inventario
          </h1>
          <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)' }}>
            Panel de Administración Seguro y Eficiente
          </p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link href="/login" className="btn btn-primary" style={{ padding: '0.75rem 2rem', borderRadius: 'var(--radius-md)' }}>
              Iniciar Sesión
            </Link>
            <a href="http://localhost:8000/docs" target="_blank" className="btn" style={{
              border: '1px solid var(--border-color)',
              padding: '0.75rem 2rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'white'
            }}>
              Documentación
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
