import { Head, router } from '@inertiajs/react';

import AppearanceTabs from '@/components/appearance-tabs';
import HeadingSmall from '@/components/heading-small';
import {
    type Appearance,
    type ColorTheme,
    useAppearance,
} from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';

import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { edit as editAppearance, update as updateAppearance } from '@/routes/appearance';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Appearance settings',
        href: editAppearance().url,
    },
];

export default function Appearance() {
    const { appearance, colorTheme, updateColorTheme } = useAppearance();

    const persistAppearance = (mode: Appearance, color: ColorTheme) => {
        router.patch(
            updateAppearance().url,
            {
                appearance: {
                    mode,
                    color,
                },
            },
            {
                preserveScroll: true,
                preserveState: true,
            },
        );
    };

    const handleModeChange = (mode: Appearance) => {
        persistAppearance(mode, colorTheme);
    };

    const handleColorChange = (theme: ColorTheme) => {
        updateColorTheme(theme);
        persistAppearance(appearance, theme);
    };

    const themes = [
        {
            value: 'default',
            label: 'Default',
            preview: 'oklch(0.205 0 0)',
        },
        {
            value: 'blue',
            label: 'Blue',
            preview: 'oklch(0.62 0.2 255)',
        },
        {
            value: 'green',
            label: 'Green',
            preview: 'oklch(0.62 0.18 150)',
        },
        {
            value: 'orange',
            label: 'Orange',
            preview: 'oklch(0.7 0.17 55)',
        },
        {
            value: 'red',
            label: 'Red',
            preview: 'oklch(0.6 0.22 25)',
        },
        {
            value: 'rose',
            label: 'Rose',
            preview: 'oklch(0.64 0.22 2)',
        },
        {
            value: 'violet',
            label: 'Violet',
            preview: 'oklch(0.6 0.2 290)',
        },
        {
            value: 'yellow',
            label: 'Yellow',
            preview: 'oklch(0.84 0.16 90)',
        },
    ] as const;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Appearance settings" />

            <h1 className="sr-only">Appearance Settings</h1>

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall
                        title="Appearance settings"
                        description="Update your account's appearance settings"
                    />
                    <AppearanceTabs onChange={handleModeChange} />
                    <div className="space-y-3">
                        <div>
                            <h2 className="text-sm font-medium">
                                Color theme
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Choose a color accent for buttons, links, and
                                highlights.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                            {themes.map((theme) => (
                                <button
                                    key={theme.value}
                                    type="button"
                                    onClick={() => handleColorChange(theme.value)}
                                    className={cn(
                                        'flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-left text-sm transition-colors whitespace-nowrap',
                                        colorTheme === theme.value
                                            ? 'border-primary ring-2 ring-ring/40'
                                            : 'border-border hover:border-muted-foreground/40',
                                    )}
                                >
                                    <span
                                        aria-hidden="true"
                                        className="h-4 w-4 shrink-0 rounded-full border"
                                        style={{
                                            backgroundColor: theme.preview,
                                        }}
                                    />
                                    <span className="flex-1">
                                        {theme.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
