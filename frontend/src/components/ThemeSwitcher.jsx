import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

export default function ThemeSwitcher() {
  const { theme, toggleTheme, themes } = useTheme();

  return (
    <div className="theme-switcher glass" style={{
      display: 'inline-flex',
      gap: '0.25rem',
      padding: '4px',
      borderRadius: '20px',
      marginRight: '1rem'
    }}>
      {themes.map((t) => (
        <button
          key={t.id}
          onClick={() => toggleTheme(t.id)}
          title={t.name}
          style={{
            border: 'none',
            background: theme === t.id ? 'var(--color-primary)' : 'transparent',
            color: theme === t.id ? 'white' : 'var(--color-text-muted)',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1rem',
            transition: 'var(--transition)'
          }}
        >
          {t.icon}
        </button>
      ))}
    </div>
  );
}
