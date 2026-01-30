import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import type { Appearance, ColorTheme } from '@/hooks/use-appearance';
import { initializeTheme } from '@/hooks/use-appearance';
import type { SharedData } from '@/types';

/**
 * Component that initializes theme from user preferences when auth state changes.
 * This ensures each user's saved theme is applied when they log in.
 */
export function ThemeInitializer() {
    const { auth } = usePage<SharedData>().props;

    useEffect(() => {
        const serverAppearance =
            (auth?.user?.appearance?.mode as Appearance | undefined) || null;
        const serverColorTheme =
            (auth?.user?.appearance?.color as ColorTheme | undefined) || null;

        initializeTheme(serverAppearance, serverColorTheme);
    }, [auth?.user?.id]); // Re-initialize when user changes (login/logout/switch user)

    return null;
}
