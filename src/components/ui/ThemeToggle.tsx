'use client';

import { Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
  // In a real app with next-themes, this would toggle the theme.
  // For this demo, we'll just show the icon.
  return (
    <button className="btn btn-ghost btn-icon" title="Toggle theme">
      <Sun size={18} />
    </button>
  );
}
