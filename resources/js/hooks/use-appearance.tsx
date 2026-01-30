import { useCallback, useMemo, useSyncExternalStore } from 'react';

export type ResolvedAppearance = 'light' | 'dark';
export type Appearance = ResolvedAppearance | 'system';
export type ColorTheme =
    | 'default'
    | 'blue'
    | 'green'
    | 'orange'
    | 'red'
    | 'rose'
    | 'violet'
    | 'yellow';

const listeners = new Set<() => void>();
const colorThemeClasses = [
    'theme-blue',
    'theme-green',
    'theme-orange',
    'theme-red',
    'theme-rose',
    'theme-violet',
    'theme-yellow',
] as const;
let currentAppearance: Appearance = 'system';
let currentColorTheme: ColorTheme = 'default';

const prefersDark = (): boolean => {
    if (typeof window === 'undefined') return false;

    return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

const setCookie = (name: string, value: string, days = 365): void => {
    if (typeof document === 'undefined') return;
    const maxAge = days * 24 * 60 * 60;
    document.cookie = `${name}=${value};path=/;max-age=${maxAge};SameSite=Lax`;
};

const getStoredAppearance = (): Appearance => {
    if (typeof window === 'undefined') return 'system';

    return (localStorage.getItem('appearance') as Appearance) || 'system';
};

const getStoredColorTheme = (): ColorTheme => {
    if (typeof window === 'undefined') return 'default';

    return (localStorage.getItem('color-theme') as ColorTheme) || 'default';
};

const isDarkMode = (appearance: Appearance): boolean => {
    return appearance === 'dark' || (appearance === 'system' && prefersDark());
};

const applyTheme = (appearance: Appearance): void => {
    if (typeof document === 'undefined') return;

    const isDark = isDarkMode(appearance);

    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
};

const applyColorTheme = (theme: ColorTheme): void => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    root.classList.remove(...colorThemeClasses);

    if (theme !== 'default') {
        root.classList.add(`theme-${theme}`);
    }
};

const subscribe = (callback: () => void) => {
    listeners.add(callback);

    return () => listeners.delete(callback);
};

const notify = (): void => listeners.forEach((listener) => listener());

const mediaQuery = (): MediaQueryList | null => {
    if (typeof window === 'undefined') return null;

    return window.matchMedia('(prefers-color-scheme: dark)');
};

const handleSystemThemeChange = (): void => {
    applyTheme(currentAppearance);
    notify();
};

export function initializeTheme(
    serverAppearance?: Appearance | null,
    serverColorTheme?: ColorTheme | null,
): void {
    if (typeof window === 'undefined') return;

    // Use server values if provided (user is logged in), otherwise fall back to localStorage
    const appearance = serverAppearance || getStoredAppearance() || 'system';
    const colorTheme = serverColorTheme || getStoredColorTheme() || 'default';

    // Update localStorage to match server values
    localStorage.setItem('appearance', appearance);
    localStorage.setItem('color-theme', colorTheme);
    setCookie('appearance', appearance);
    setCookie('color-theme', colorTheme);

    currentAppearance = appearance;
    currentColorTheme = colorTheme;
    applyTheme(currentAppearance);
    applyColorTheme(currentColorTheme);

    // Set up system theme change listener
    mediaQuery()?.addEventListener('change', handleSystemThemeChange);
}

export function useAppearance() {
    const appearance: Appearance = useSyncExternalStore(
        subscribe,
        () => currentAppearance,
        () => 'system',
    );
    const colorTheme: ColorTheme = useSyncExternalStore(
        subscribe,
        () => currentColorTheme,
        () => 'default',
    );

    const resolvedAppearance: ResolvedAppearance = useMemo(
        () => (isDarkMode(appearance) ? 'dark' : 'light'),
        [appearance],
    );

    const updateAppearance = useCallback((mode: Appearance): void => {
        currentAppearance = mode;

        // Store in localStorage for client-side persistence...
        localStorage.setItem('appearance', mode);

        // Store in cookie for SSR...
        setCookie('appearance', mode);

        applyTheme(mode);
        notify();
    }, []);

    const updateColorTheme = useCallback((theme: ColorTheme): void => {
        currentColorTheme = theme;

        localStorage.setItem('color-theme', theme);
        setCookie('color-theme', theme);

        applyColorTheme(theme);
        notify();
    }, []);

    return {
        appearance,
        resolvedAppearance,
        colorTheme,
        updateAppearance,
        updateColorTheme,
    } as const;
}
