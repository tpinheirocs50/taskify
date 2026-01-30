import * as React from 'react';
import {
    Legend,
    ResponsiveContainer,
    Tooltip,
    type LegendProps,
    type TooltipProps,
} from 'recharts';
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

import { cn } from '@/lib/utils';

export type ChartConfig = Record<
    string,
    {
        label?: React.ReactNode;
        color?: string;
        icon?: React.ComponentType;
    }
>;

interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
    config: ChartConfig;
    children: React.ReactElement;
}

export function ChartContainer({
    config,
    children,
    className,
    ...props
}: ChartContainerProps) {
    const style = React.useMemo(() => {
        const entries = Object.entries(config)
            .filter(([, value]) => value.color)
            .map(([key, value]) => [`--color-${key}`, value.color]);

        return Object.fromEntries(entries) as React.CSSProperties;
    }, [config]);

    return (
        <div
            className={cn('w-full', className)}
            style={style}
            {...props}
        >
            <ResponsiveContainer>{children}</ResponsiveContainer>
        </div>
    );
}

export const ChartTooltip = Tooltip;
export const ChartLegend = Legend;

type ChartTooltipPayloadItem = {
    dataKey?: string | number;
    name?: string;
    color?: string;
    value?: number | string;
};

export function ChartTooltipContent({
    active,
    payload,
    label,
}: TooltipProps<ValueType, NameType> & {
    payload?: ChartTooltipPayloadItem[];
    label?: string | number;
}) {
    if (!active || !payload?.length) return null;

    return (
        <div className="rounded-lg border bg-background px-3 py-2 text-xs shadow-sm">
            {label ? (
                <div className="mb-2 font-medium text-foreground">
                    {label}
                </div>
            ) : null}
            <div className="grid gap-1.5">
                {payload.map((item) => (
                    <div
                        key={String(item.dataKey ?? item.name)}
                        className="flex items-center gap-2"
                    >
                        <span
                            className="h-2 w-2 rounded-full"
                            style={{
                                backgroundColor: `var(--color-${String(
                                    item.dataKey ?? 'revenue',
                                )})`,
                            }}
                        />
                        <span className="text-muted-foreground">
                            {item.name ?? item.dataKey}
                        </span>
                        <span className="ml-auto font-medium text-foreground">
                            {item.value}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function ChartLegendContent({
    payload,
}: LegendProps & { payload?: Array<{ value: string; color: string }> }) {
    if (!payload?.length) return null;

    return (
        <div className="flex flex-wrap gap-3 text-xs">
            {payload.map((item) => (
                <div key={item.value} className="flex items-center gap-2">
                    <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: item.color }}
                    />
                    <span className="text-muted-foreground">{item.value}</span>
                </div>
            ))}
        </div>
    );
}
