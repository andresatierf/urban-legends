export function ThemeScript() {
  // This script runs before React hydration
  const themeInitScript = `
    (function() {
      try {
        const stored = localStorage.getItem('theme-preference');
        const theme = stored === 'light' || stored === 'dark' || stored === 'system'
          ? stored
          : 'system';

        let resolved = theme;
        if (theme === 'system') {
          resolved = window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light';
        }

        if (resolved === 'dark') {
          document.documentElement.classList.add('dark');
        }
      } catch (e) {
        // Fail silently
      }
    })();
  `;

  return (
    <script
      // biome-ignore lint/security/noDangerouslySetInnerHtml: Required for theme initialization before React hydration to prevent FOUC
      dangerouslySetInnerHTML={{ __html: themeInitScript }}
      suppressHydrationWarning
    />
  );
}
