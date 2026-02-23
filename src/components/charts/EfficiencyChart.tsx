import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    Cell
} from 'recharts';

interface EfficiencyData {
    name: string;
    actual: number;
    target: number;
}

interface EfficiencyChartProps {
    data: EfficiencyData[];
    type: 'diesel' | 'coolant';
}

const EfficiencyChart: React.FC<EfficiencyChartProps> = ({ data, type }) => {
    const color = type === 'diesel' ? '#EAB308' : '#3B82F6'; // Yellow for diesel, Blue for coolant

    return (
        <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94a3b8', fontSize: 10 }}
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94a3b8', fontSize: 10 }}
                    />
                    <Tooltip
                        cursor={{ fill: '#ffffff05' }}
                        contentStyle={{
                            backgroundColor: '#0f172a',
                            border: '1px solid #ffffff10',
                            borderRadius: '8px',
                            fontSize: '12px',
                            color: '#fff'
                        }}
                    />
                    <Legend
                        verticalAlign="top"
                        align="right"
                        iconType="circle"
                        wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', paddingBottom: '20px' }}
                    />
                    <Bar
                        dataKey="actual"
                        name="Actual (Litres)"
                        fill={color}
                        radius={[4, 4, 0, 0]}
                        barSize={20}
                    >
                        {data.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={entry.actual > entry.target ? '#EF4444' : color} // Red if wastage detected
                            />
                        ))}
                    </Bar>
                    <Bar
                        dataKey="target"
                        name="Target (Litres)"
                        fill="#334155"
                        radius={[4, 4, 0, 0]}
                        barSize={20}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default EfficiencyChart;
