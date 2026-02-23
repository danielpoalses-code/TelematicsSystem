import React from 'react';
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ReferenceLine
} from 'recharts';

interface SensorTrendChartProps {
    data: any[];
    dataKey: string;
    color?: string;
    unit?: string;
    threshold?: number;
    height?: number;
}

const SensorTrendChart: React.FC<SensorTrendChartProps> = ({
    data,
    dataKey,
    color = '#E94560',
    unit = '',
    threshold,
    height = 300
}) => {
    return (
        <div className="w-full h-full min-h-[200px]" style={{ height }}>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                        dataKey="timestamp"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 10 }}
                        minTickGap={30}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 10 }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#16213E',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            fontSize: '12px'
                        }}
                        itemStyle={{ color: '#fff' }}
                        cursor={{ stroke: 'rgba(255,255,255,0.1)' }}
                    />
                    {threshold && (
                        <ReferenceLine
                            y={threshold}
                            stroke="#EF4444"
                            strokeDasharray="3 3"
                            label={{ position: 'right', value: 'Critical', fill: '#EF4444', fontSize: 10 }}
                        />
                    )}
                    <Line
                        type="monotone"
                        dataKey={dataKey}
                        stroke={color}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, fill: color, stroke: '#fff' }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default SensorTrendChart;
