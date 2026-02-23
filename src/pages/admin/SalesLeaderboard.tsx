import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Trophy, Truck, TrendingUp, Search, ArrowUpDown, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// Fleet counts per dealership — sourced from fleet_condition.csv (21 Feb 2026)
// Real tracked units per dealer, sorted by fleet size descending
// ─────────────────────────────────────────────────────────────────────────────
const DEALERSHIPS = [
    { name: 'Powerstar Centurion',                              region: 'Gauteng',          country: 'South Africa', units: 243 },
    { name: 'Powerstar Ermelo',                                 region: 'Mpumalanga',        country: 'South Africa', units: 87  },
    { name: 'Powerstar Empangeni',                              region: 'KwaZulu-Natal',     country: 'South Africa', units: 66  },
    { name: 'Powerstar Pinetown TCD',                           region: 'KwaZulu-Natal',     country: 'South Africa', units: 50  },
    { name: 'Powerstar Brackenfell',                            region: 'Western Cape',      country: 'South Africa', units: 45  },
    { name: 'Powerstar Brakpan',                                region: 'Gauteng',           country: 'South Africa', units: 37  },
    { name: 'Powerstar Polokwane',                              region: 'Limpopo',           country: 'South Africa', units: 35  },
    { name: 'Powerstar PMB – Almighty Equipment',               region: 'KwaZulu-Natal',     country: 'South Africa', units: 30  },
    { name: 'Powerstar Namibia – Windhoek (GDP Investments)',   region: 'Khomas',            country: 'Namibia',      units: 28  },
    { name: 'Powerstar Namibia – Swakopmund (Hendeca Machinery)',region: 'Erongo',           country: 'Namibia',      units: 24  },
    { name: 'Powerstar Zimbabwe – Harare (T/A Machinery)',      region: 'Harare',            country: 'Zimbabwe',     units: 11  },
    { name: 'Powerstar Middelburg',                             region: 'Mpumalanga',        country: 'South Africa', units: 8   },
    { name: 'Powerstar Port Elizabeth',                         region: 'Eastern Cape',      country: 'South Africa', units: 5   },
    { name: 'Powerstar Bloemfontein',                           region: 'Free State',        country: 'South Africa', units: 3   },
    { name: 'Powerstar Wonderboom',                             region: 'Gauteng',           country: 'South Africa', units: 3   },
    { name: 'Powerstar Kimberly',                               region: 'Northern Cape',     country: 'South Africa', units: 3   },
    { name: 'Powerstar Botswana',                               region: 'Gaborone',          country: 'Botswana',     units: 3   },
    { name: 'Powerstar Nelspruit',                              region: 'Mpumalanga',        country: 'South Africa', units: 2   },
    { name: 'Powerstar Mozambique – Matola (Haps)',             region: 'Maputo',            country: 'Mozambique',   units: 2   },
    { name: 'Powerstar Upington',                               region: 'Northern Cape',     country: 'South Africa', units: 2   },
    { name: 'Powerstar Schweizer-Reneke',                       region: 'North West',        country: 'South Africa', units: 1   },
    { name: 'Powerstar Mozambique – Maputo (Centrocar)',        region: 'Maputo',            country: 'Mozambique',   units: 1   },
    { name: 'Powerstar George',                                 region: 'Western Cape',      country: 'South Africa', units: 1   },
    { name: 'Powerstar Swaziland – Matsapha (Swazi Bus & Truck)',region: 'Manzini',          country: 'Eswatini',     units: 0   },
];

const TOTAL_FLEET = DEALERSHIPS.reduce((s, d) => s + d.units, 0);
const MAX_UNITS = Math.max(...DEALERSHIPS.map(d => d.units));

// Medal colours for top 3
const MEDAL: Record<number, { bg: string; text: string; label: string; icon: string }> = {
    0: { bg: 'bg-amber-50',  text: 'text-amber-600',  label: 'bg-amber-400',  icon: '🥇' },
    1: { bg: 'bg-slate-50',  text: 'text-slate-500',  label: 'bg-slate-400',  icon: '🥈' },
    2: { bg: 'bg-orange-50', text: 'text-orange-600', label: 'bg-orange-400', icon: '🥉' },
};

const barColor = (rank: number) => {
    if (rank === 0) return '#f59e0b';
    if (rank === 1) return '#94a3b8';
    if (rank === 2) return '#f97316';
    return '#6366f1';
};

// Country flag emoji helper
const FLAG: Record<string, string> = {
    'South Africa': '🇿🇦',
    'Namibia':      '🇳🇦',
    'Zimbabwe':     '🇿🇼',
    'Botswana':     '🇧🇼',
    'Mozambique':   '🇲🇿',
    'Eswatini':     '🇸🇿',
};

const SalesLeaderboard: React.FC<{ embedded?: boolean }> = ({ embedded = false }) => {
    const [search, setSearch] = useState('');
    const [sortField, setSortField] = useState<'rank' | 'units' | 'name'>('rank');
    const [sortAsc, setSortAsc] = useState(false);

    const sorted = [...DEALERSHIPS]
        .filter(d =>
            d.name.toLowerCase().includes(search.toLowerCase()) ||
            d.region.toLowerCase().includes(search.toLowerCase()) ||
            d.country.toLowerCase().includes(search.toLowerCase())
        )
        .sort((a, b) => {
            const ranked = DEALERSHIPS.indexOf(a) - DEALERSHIPS.indexOf(b);
            if (sortField === 'rank')  return sortAsc ? ranked : -ranked;
            if (sortField === 'units') return sortAsc ? a.units - b.units : b.units - a.units;
            if (sortField === 'name')  return sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
            return 0;
        });

    const toggleSort = (field: typeof sortField) => {
        if (sortField === field) setSortAsc(p => !p);
        else { setSortField(field); setSortAsc(false); }
    };

    const top3 = DEALERSHIPS.slice(0, 3);

    const inner = (
        <>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    {!embedded && (
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase flex items-center gap-3">
                            <Trophy className="h-6 w-6 text-amber-500" />
                            Dealership Fleet Leaderboard
                        </h1>
                    )}
                    <p className="text-slate-500 text-sm mt-0.5">
                        Fleet distribution across <span className="font-bold text-slate-700">{DEALERSHIPS.length}</span> Powerstar dealerships —{' '}
                        <span className="font-bold text-slate-700">{TOTAL_FLEET.toLocaleString()}</span> tracked units. Source: fleet_condition.csv · 21 Feb 2026.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-white border border-border rounded-xl px-4 py-2 text-center shadow-sm">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Fleet</p>
                        <p className="text-2xl font-black text-accent">{TOTAL_FLEET.toLocaleString()}</p>
                    </div>
                    <div className="bg-white border border-border rounded-xl px-4 py-2 text-center shadow-sm">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Dealerships</p>
                        <p className="text-2xl font-black text-slate-800">{DEALERSHIPS.length}</p>
                    </div>
                    <div className="bg-white border border-border rounded-xl px-4 py-2 text-center shadow-sm">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Countries</p>
                        <p className="text-2xl font-black text-slate-800">{[...new Set(DEALERSHIPS.map(d => d.country))].length}</p>
                    </div>
                </div>
            </div>

            {/* Podium — Top 3 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {top3.map((d, i) => {
                    const m = MEDAL[i];
                    const pct = Math.round(d.units / TOTAL_FLEET * 100);
                    return (
                        <div key={d.name} className={cn(
                            'border rounded-2xl p-5 shadow-sm relative overflow-hidden',
                            i === 0 ? 'border-amber-200 bg-gradient-to-br from-amber-50 to-white' :
                            i === 1 ? 'border-slate-200 bg-gradient-to-br from-slate-50 to-white' :
                                      'border-orange-200 bg-gradient-to-br from-orange-50 to-white'
                        )}>
                            <div className="absolute top-3 right-4 text-3xl opacity-20 font-black text-slate-300">#{i + 1}</div>
                            <div className="flex items-start gap-3">
                                <div className={cn('p-2.5 rounded-xl', m.bg)}>
                                    <Trophy className={cn('h-5 w-5', m.text)} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 mb-0.5">
                                        <span className="text-lg">{m.icon}</span>
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Rank #{i + 1}</span>
                                    </div>
                                    <p className="font-black text-slate-800 text-sm leading-snug">{d.name}</p>
                                    <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                                        <MapPin className="h-2.5 w-2.5" /> {d.region}, {FLAG[d.country]} {d.country}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-4 flex items-end justify-between">
                                <div>
                                    <p className={cn('text-4xl font-black', m.text)}>{d.units}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">units tracked</p>
                                </div>
                                <div className="text-right">
                                    <p className={cn('text-xl font-black', m.text)}>{pct}%</p>
                                    <p className="text-[10px] text-slate-400">of total fleet</p>
                                </div>
                            </div>
                            <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className={cn('h-full rounded-full', m.label)} style={{ width: `${Math.min(pct * 1.2, 100)}%` }} />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Horizontal Bar Chart */}
            <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
                <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-4">Fleet Size by Dealership</h3>
                <ResponsiveContainer width="100%" height={DEALERSHIPS.length * 30 + 40}>
                    <BarChart
                        data={DEALERSHIPS}
                        layout="vertical"
                        margin={{ top: 0, right: 60, left: 8, bottom: 0 }}
                        barSize={14}
                    >
                        <XAxis type="number" domain={[0, MAX_UNITS + 10]} tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                        <YAxis
                            type="category"
                            dataKey="name"
                            width={230}
                            tick={{ fontSize: 9.5, fill: '#475569', fontWeight: 700 }}
                            tickFormatter={v => v.replace('Powerstar ', '').slice(0, 36)}
                            axisLine={false} tickLine={false}
                        />
                        <Tooltip
                            cursor={{ fill: '#f1f5f9' }}
                            formatter={(value: number) => [`${value} units`, 'Fleet Size']}
                            contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,.08)' }}
                        />
                        <Bar dataKey="units" radius={[0, 6, 6, 0]} label={{ position: 'right', fontSize: 9, fontWeight: 700, fill: '#64748b', formatter: (v: number) => v > 0 ? v : '' }}>
                            {DEALERSHIPS.map((d, i) => (
                                <Cell key={d.name} fill={barColor(i)} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Full Table */}
            <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                    <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">All Dealerships</h3>
                    <div className="relative max-w-xs w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Filter by name, region, country…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full border border-border rounded-lg py-1.5 pl-8 pr-3 text-[11px] focus:outline-none focus:ring-1 focus:ring-accent/40 bg-white"
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-[11px]">
                        <thead className="bg-slate-50 border-b border-border">
                            <tr>
                                {[
                                    { label: 'Rank',         field: 'rank'  as const },
                                    { label: 'Dealership',   field: 'name'  as const },
                                    { label: 'Region',       field: null },
                                    { label: 'Country',      field: null },
                                    { label: 'Units',        field: 'units' as const },
                                    { label: '% of Fleet',   field: null },
                                    { label: 'Distribution', field: null },
                                ].map(col => (
                                    <th
                                        key={col.label}
                                        onClick={() => col.field && toggleSort(col.field)}
                                        className={cn(
                                            'px-4 py-3 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap',
                                            col.field && 'cursor-pointer hover:text-slate-600 select-none'
                                        )}
                                    >
                                        <span className="flex items-center gap-1">
                                            {col.label}
                                            {col.field && <ArrowUpDown className="h-2.5 w-2.5 opacity-50" />}
                                        </span>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {sorted.map((d) => {
                                const globalRank = DEALERSHIPS.indexOf(d);
                                const pct = TOTAL_FLEET > 0 ? (d.units / TOTAL_FLEET * 100) : 0;
                                const m = MEDAL[globalRank];
                                return (
                                    <tr key={d.name} className={cn('hover:bg-slate-50/60 transition-colors', globalRank < 3 && 'bg-gradient-to-r from-amber-50/20 to-transparent')}>
                                        <td className="px-4 py-3">
                                            <span className={cn(
                                                'text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center',
                                                m ? `${m.bg} ${m.text}` : 'bg-slate-100 text-slate-500'
                                            )}>
                                                {globalRank < 3 ? m.icon : globalRank + 1}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 font-black text-slate-800 max-w-[250px]">
                                            <p className="truncate" title={d.name}>{d.name}</p>
                                        </td>
                                        <td className="px-4 py-3 text-slate-500">{d.region}</td>
                                        <td className="px-4 py-3 text-slate-500">{FLAG[d.country]} {d.country}</td>
                                        <td className="px-4 py-3">
                                            <span className={cn(
                                                'font-black text-base',
                                                d.units === 0 ? 'text-slate-300' :
                                                globalRank === 0 ? 'text-amber-600' :
                                                globalRank === 1 ? 'text-slate-500' :
                                                globalRank === 2 ? 'text-orange-600' : 'text-indigo-600'
                                            )}>
                                                {d.units}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-400 font-bold">{pct.toFixed(1)}%</td>
                                        <td className="px-4 py-3 w-40">
                                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden w-36">
                                                <div
                                                    className="h-full rounded-full transition-all"
                                                    style={{ width: `${(d.units / MAX_UNITS) * 100}%`, backgroundColor: barColor(globalRank) }}
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <div className="px-4 py-3 border-t border-border bg-slate-50 text-[10px] text-slate-400 flex items-center justify-between">
                    <span>{sorted.length} dealerships shown</span>
                    <span className="flex items-center gap-1.5 font-black text-slate-500">
                        <TrendingUp className="h-3 w-3" />
                        {TOTAL_FLEET.toLocaleString()} tracked units across {[...new Set(DEALERSHIPS.map(d => d.country))].length} countries
                    </span>
                </div>
            </div>
        </>
    );

    if (embedded) return <div className="space-y-8">{inner}</div>;
    return (
        <div className="p-4 lg:p-10 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-700">
            {inner}
        </div>
    );
};

export default SalesLeaderboard;
