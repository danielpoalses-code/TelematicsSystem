import React from 'react';
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getSortedRowModel,
    SortingState
} from '@tanstack/react-table';
import { Truck as TruckType } from '@/types/database';
import { cn } from '@/lib/utils';

const columnHelper = createColumnHelper<TruckType>();

const columns = [
    columnHelper.accessor('stockNumber', {
        header: 'Stock #',
        cell: info => <span className="font-bold text-white">{info.getValue()}</span>,
    }),
    columnHelper.accessor('model', {
        header: 'Model',
    }),
    columnHelper.accessor('lifecycleStage', {
        header: 'Stage',
        cell: info => (
            <span className={cn(
                "px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider",
                info.getValue() === 'qc_hold' ? "bg-status-amber/20 text-status-amber border border-status-amber/30" :
                    info.getValue() === 'virtual_stockyard' ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" :
                        "bg-white/5 text-slate-400 border border-white/10"
            )}>
                {info.getValue().replace(/_/g, ' ')}
            </span>
        )
    }),
    columnHelper.accessor('deviceStatus', {
        header: 'Status',
        cell: info => {
            const status = info.getValue();
            const config = {
                online_moving: { color: 'bg-status-green', label: 'Moving' },
                online_stationary: { color: 'bg-status-blue', label: 'Idle' },
                alert: { color: 'bg-status-amber', label: 'Alert' },
                offline: { color: 'bg-status-red', label: 'Offline' },
            }[status];
            return (
                <div className="flex items-center gap-2">
                    <div className={cn("h-2 w-2 rounded-full", config.color)} />
                    <span className="text-sm">{config.label}</span>
                </div>
            );
        }
    }),
    columnHelper.accessor('currentOdometer', {
        header: 'Odometer',
        cell: info => `${info.getValue().toLocaleString()} km`,
    }),
    columnHelper.accessor('lastCommunication', {
        header: 'Last Seen',
        cell: info => {
            const date = info.getValue().toDate();
            return date.toLocaleDateString('en-ZA');
        }
    }),
];

interface TruckTableProps {
    data: TruckType[];
}

const TruckTable: React.FC<TruckTableProps> = ({ data }) => {
    const [sorting, setSorting] = React.useState<SortingState>([]);

    const table = useReactTable({
        data,
        columns,
        state: { sorting },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    return (
        <div className="overflow-x-auto rounded-xl border border-white/5 bg-panel/30">
            <table className="w-full text-left text-sm">
                <thead className="bg-white/5 text-slate-400 font-medium uppercase text-[11px] tracking-wider">
                    {table.getHeaderGroups().map(headerGroup => (
                        <tr key={headerGroup.id}>
                            {headerGroup.headers.map(header => (
                                <th
                                    key={header.id}
                                    className="px-6 py-4 cursor-pointer hover:text-white transition-colors"
                                    onClick={header.column.getToggleSortingHandler()}
                                >
                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                </th>
                            ))}
                        </tr>
                    ))}
                </thead>
                <tbody className="divide-y divide-white/5">
                    {table.getRowModel().rows.map(row => (
                        <tr key={row.id} className="hover:bg-white/[0.02] transition-colors group">
                            {row.getVisibleCells().map(cell => (
                                <td key={cell.id} className="px-6 py-4">
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default TruckTable;
