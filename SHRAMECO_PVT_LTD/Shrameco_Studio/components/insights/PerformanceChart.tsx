'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const ResponsiveContainer = dynamic(
	() => import('recharts').then((mod) => mod.ResponsiveContainer),
	{ ssr: false }
);
const AreaChart = dynamic(() => import('recharts').then((mod) => mod.AreaChart), {
	ssr: false,
});
const Area = dynamic(() => import('recharts').then((mod) => mod.Area), {
	ssr: false,
});
const XAxis = dynamic(() => import('recharts').then((mod) => mod.XAxis), {
	ssr: false,
});
const YAxis = dynamic(() => import('recharts').then((mod) => mod.YAxis), {
	ssr: false,
});
const Tooltip = dynamic(() => import('recharts').then((mod) => mod.Tooltip), {
	ssr: false,
});

interface PerformanceChartProps {
	selectedPeriod: string;
	mergedChartData: any[];
	chartData: any[];
	chartConfig: any;
}

export const PerformanceChart: React.FC<PerformanceChartProps> = React.memo(
	({ selectedPeriod, mergedChartData, chartData, chartConfig }) => {
		return (
			<div className="h-64 sm:h-72 md:h-80 w-full pt-2">
				<ResponsiveContainer width="100%" height="100%">
					{selectedPeriod === 'Both' ? (
						<AreaChart data={mergedChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
							<defs>
								<linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
									<stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.25} />
									<stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0} />
								</linearGradient>
								<linearGradient id="colorPrevious" x1="0" y1="0" x2="0" y2="1">
									<stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
									<stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
								</linearGradient>
							</defs>
							<XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
							<YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
							<Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '0.75rem', border: 'none', color: '#fff' }} />
							<Area type="monotone" dataKey="current" name={chartConfig.current.label} stroke="#8B5CF6" strokeWidth={2.5} fill="url(#colorCurrent)" />
							<Area type="monotone" dataKey="previous" name={chartConfig.previous.label} stroke="#10b981" strokeWidth={2.5} fill="url(#colorPrevious)" />
						</AreaChart>
					) : (
						<AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
							<defs>
								<linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
									<stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.25} />
									<stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0} />
								</linearGradient>
							</defs>
							<XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
							<YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
							<Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '0.75rem', border: 'none', color: '#fff' }} />
							<Area type="monotone" dataKey="value" name={chartConfig.value.label} stroke="#8B5CF6" strokeWidth={2.5} fill="url(#colorValue)" />
						</AreaChart>
					)}
				</ResponsiveContainer>
			</div>
		);
	}
);

PerformanceChart.displayName = 'PerformanceChart';
