import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import type { Appearance, ColorTheme } from './hooks/use-appearance';
import { initializeTheme } from './hooks/use-appearance';
import type { SharedData } from './types';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) =>
        resolvePageComponent(
            `./pages/${name}.tsx`,
            import.meta.glob('./pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        // Initialize theme from server props if user is authenticated
        const pageProps = props.initialPage.props as Partial<SharedData>;
        const serverAppearance =
            (pageProps?.auth?.user?.appearance?.mode as
                | Appearance
                | undefined) || null;
        const serverColorTheme =
            (pageProps?.auth?.user?.appearance?.color as
                | ColorTheme
                | undefined) || null;

        initializeTheme(serverAppearance, serverColorTheme);

        root.render(
            <StrictMode>
                <App {...props} />
            </StrictMode>,
        );
    },
    progress: {
        color: '#4B5563',
    },
});
