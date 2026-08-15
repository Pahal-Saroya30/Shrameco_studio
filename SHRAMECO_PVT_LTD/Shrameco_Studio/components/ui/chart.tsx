'use client';

import * as React from 'react';
import * as RechartsPrimitive from 'recharts';

// Helper utility for joining classnames
const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

// Format config interface
export type ChartConfig = Record<
	string,
	{
		label?: React.ReactNode;
		icon?: React.ComponentType;
		color?: string;
		theme?: Record<string, string>;
	}
>;

type ChartContextProps = {
	config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
	const context = React.useContext(ChartContext);
	if (!context) {
		throw new Error('useChart must be used within a ChartContainer');
	}
	return context;
}

export const ChartContainer = React.forwardRef<
	HTMLDivElement,
	React.ComponentProps<'div'> & {
		config: ChartConfig;
		children: React.ReactElement;
	}
>(({ className, children, config, ...props }, ref) => {
	// Create CSS variables for theme colors dynamically
	const styles = React.useMemo(() => {
		const colorStyles: Record<string, string> = {};
		Object.entries(config).forEach(([key, val]) => {
			if (val.color) {
				colorStyles[`--color-${key}`] = val.color;
			}
		});
		return colorStyles;
	}, [config]);

	return (
		<ChartContext.Provider value={{ config }}>
			<div
				ref={ref}
				style={styles as React.CSSProperties}
				className={cn('w-full', className)}
				{...props}
			>
				<RechartsPrimitive.ResponsiveContainer width="100%" height="100%">
					{children}
				</RechartsPrimitive.ResponsiveContainer>
			</div>
		</ChartContext.Provider>
	);
});
ChartContainer.displayName = 'ChartContainer';

export const ChartTooltip = RechartsPrimitive.Tooltip;

export const ChartTooltipContent = React.forwardRef<
	HTMLDivElement,
	React.ComponentProps<'div'> & {
		active?: boolean;
		payload?: any[];
		label?: any;
		hideLabel?: boolean;
		hideIndicator?: boolean;
		indicator?: 'dot' | 'line' | 'dashed';
		nameKey?: string;
		labelKey?: string;
	}
>(
	(
		{
			active,
			payload,
			label,
			hideLabel = false,
			hideIndicator = false,
			indicator = 'dot',
			nameKey,
			labelKey,
			className,
		},
		ref
	) => {
		const { config } = useChart();

		if (!active || !payload || !payload.length) {
			return null;
		}

		return (
			<div
				ref={ref}
				className={cn(
					'grid min-w-[8rem] items-start gap-1.5 rounded-xl border border-slate-200 bg-white p-2.5 shadow-md shadow-slate-100 text-xs font-semibold text-slate-800 animate-fade-in',
					className
				)}
			>
				{!hideLabel && (
					<div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
						{labelKey && config[labelKey]?.label ? config[labelKey].label : label}
					</div>
				)}
				<div className="grid gap-1.5">
					{payload.map((item, index) => {
						const key = nameKey || item.name || item.dataKey || 'value';
						const itemConfig = config[key];
						const name = itemConfig?.label || item.name;

						return (
							<div
								key={index}
								className="flex items-center justify-between gap-4"
							>
								<div className="flex items-center space-x-1.5">
									{!hideIndicator && (
										<div
											className={cn(
												'rounded-full',
												indicator === 'dot' && 'w-2 h-2',
												indicator === 'line' && 'w-1 h-3',
												indicator === 'dashed' && 'w-1 h-3 border-t-2 border-dashed'
											)}
											style={{
												backgroundColor: item.color || item.payload?.fill || 'var(--chart-1)',
												borderColor: item.color || item.payload?.fill || 'var(--chart-1)'
											}}
										/>
									)}
									<span className="text-slate-500">{name}</span>
								</div>
								<span className="font-bold text-slate-900">
									{item.value?.toLocaleString()}
								</span>
							</div>
						);
					})}
				</div>
			</div>
		);
	}
);
ChartTooltipContent.displayName = 'ChartTooltipContent';

export const ChartLegend = RechartsPrimitive.Legend;

export const ChartLegendContent = React.forwardRef<
	HTMLDivElement,
	React.ComponentProps<'div'> & {
		payload?: any[];
		nameKey?: string;
	}
>(({ payload, nameKey, className }, ref) => {
	const { config } = useChart();

	if (!payload || !payload.length) {
		return null;
	}

	return (
		<div
			ref={ref}
			className={cn('flex flex-wrap items-center justify-center gap-4 text-xs font-bold text-slate-600', className)}
		>
			{payload.map((item, index) => {
				const key = nameKey || item.value || 'value';
				const itemConfig = config[key];
				const name = itemConfig?.label || item.value;

				return (
					<div key={index} className="flex items-center space-x-1.5">
						<div
							className="w-2.5 h-2.5 rounded-sm"
							style={{
								backgroundColor: item.color || 'var(--chart-1)',
							}}
						/>
						<span>{name}</span>
					</div>
				);
			})}
		</div>
	);
});
ChartLegendContent.displayName = 'ChartLegendContent';
