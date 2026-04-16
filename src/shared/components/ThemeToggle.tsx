'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

type Theme = 'light' | 'dark';

const STORAGE_KEY = 'theme';

function readStoredTheme(): Theme | null {
    if (typeof window === 'undefined') return null;
    try {
        const v = window.localStorage.getItem(STORAGE_KEY);
        return v === 'light' || v === 'dark' ? v : null;
    } catch {
        return null;
    }
}

function applyTheme(theme: Theme) {
    if (typeof document === 'undefined') return;
    document.body.classList.toggle('light-mode', theme === 'light');
}

export function ThemeToggle({ className }: { className?: string }) {
    const [theme, setTheme] = useState<Theme>('dark');

    useEffect(() => {
        const stored = readStoredTheme();
        if (stored) {
            setTheme(stored);
            applyTheme(stored);
            return;
        }
        const mq = window.matchMedia('(prefers-color-scheme: light)');
        const initial: Theme = mq.matches ? 'light' : 'dark';
        setTheme(initial);
        applyTheme(initial);

        const onChange = (e: MediaQueryListEvent) => {
            if (readStoredTheme()) return;
            const next: Theme = e.matches ? 'light' : 'dark';
            setTheme(next);
            applyTheme(next);
        };
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, []);

    const toggle = () => {
        const next: Theme = theme === 'light' ? 'dark' : 'light';
        setTheme(next);
        applyTheme(next);
        try {
            window.localStorage.setItem(STORAGE_KEY, next);
        } catch {
            /* quota / disabled storage — ignore */
        }
    };

    const label = theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro';

    return (
        <button
            type="button"
            onClick={toggle}
            className={className ?? 'header-btn'}
            title={label}
            aria-label={label}
        >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
    );
}
