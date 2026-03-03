import React from 'react';

export interface LogoProps {
  className?: string;
  iconOnly?: boolean;
}

export function Logo({ className = '', iconOnly = false }: LogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Ícone: e-logo.png */}
      <img
        src="/images/e-logo.png"
        alt="Easyfy"
        width={40}
        height={40}
        className="flex-shrink-0"
      />

      {/* Texto "easyfy" - Oculto se iconOnly for true */}
      {!iconOnly && (
        <span
          className="text-[#1E293B] leading-none select-none"
          style={{
            fontFamily: "Quicksand, var(--font-logo), sans-serif",
            fontWeight: 700,
            fontSize: '1.75rem',
            letterSpacing: '-0.01em',
          }}
        >
          asyfy
        </span>
      )}
    </div>
  );
}
