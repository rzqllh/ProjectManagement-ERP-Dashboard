'use client';

import { useEffect } from 'react';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <html lang="en">
            <body style={{ backgroundColor: '#0a0e1a', color: '#e2e8f0', margin: 0 }}>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    padding: '2rem',
                }}>
                    <div style={{
                        background: 'rgba(17, 24, 39, 0.6)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '1rem',
                        padding: '2.5rem',
                        maxWidth: '28rem',
                        width: '100%',
                        textAlign: 'center',
                    }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            background: 'rgba(239,68,68,0.1)',
                            border: '1px solid rgba(239,68,68,0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1rem',
                            fontSize: '1.25rem',
                        }}>
                            ⚠️
                        </div>
                        <h2 style={{
                            fontSize: '1.25rem',
                            fontWeight: 700,
                            color: '#ef4444',
                            marginBottom: '0.5rem',
                        }}>
                            System Fault Detected
                        </h2>
                        <p style={{
                            fontSize: '0.875rem',
                            color: '#94a3b8',
                            marginBottom: '1.5rem',
                            lineHeight: 1.6,
                        }}>
                            A critical error occurred in the command center. Attempting recovery...
                        </p>
                        {error.digest && (
                            <p style={{
                                fontSize: '0.625rem',
                                color: '#374151',
                                fontFamily: 'monospace',
                                marginBottom: '1rem',
                            }}>
                                Error ID: {error.digest}
                            </p>
                        )}
                        <button
                            onClick={() => reset()}
                            style={{
                                background: '#06d6a0',
                                color: '#0a0e1a',
                                border: 'none',
                                borderRadius: '0.5rem',
                                padding: '0.625rem 1.5rem',
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                            }}
                        >
                            Reinitialize System
                        </button>
                    </div>
                </div>
            </body>
        </html>
    );
}
