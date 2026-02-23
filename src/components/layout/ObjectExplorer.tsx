import React, { useState } from 'react';
import {
    Folder,
    ChevronRight,
    ChevronDown,
    Search,
    Download,
    RefreshCcw,
    FolderPlus,
    Plus,
    Printer,
    MoreHorizontal,
    Share2,
    Settings2,
    LayoutGrid,
    MapPin
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExplorerNode {
    id: string;
    label: string;
    type: 'folder' | 'item';
    count?: number;
    children?: ExplorerNode[];
}

const ObjectExplorer: React.FC = () => {
    const [expanded, setExpanded] = useState<string[]>(['root', 'factory']);

    const toggle = (id: string) => {
        setExpanded(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const tree: ExplorerNode[] = [
        {
            id: 'root',
            label: '****',
            type: 'folder',
            count: 1172,
            children: [
                { id: 'aaaa', label: 'aaaa', type: 'folder' },
                { id: 'demo', label: 'a) POWERSTAR DEMO', type: 'folder', count: 19 },
                {
                    id: 'factory',
                    label: 'a) Powerstar OEM Factory',
                    type: 'folder',
                    count: 267,
                    children: [
                        { id: 'active', label: 'Active Fleet', type: 'folder', count: 107 },
                        { id: 'qc', label: 'Quality Control Hold', type: 'folder', count: 5 },
                        { id: 'driven', label: 'TO BE DRIVEN', type: 'folder', count: 10 },
                        { id: 'virtual', label: 'Virtual Stockyard', type: 'folder', count: 145 },
                    ]
                },
                { id: 'teichman', label: 'PMB Teichman SA', type: 'folder', count: 1 },
                { id: 'balito', label: 'Powerstar Balito', type: 'folder', count: 1 },
                { id: 'bloem', label: 'Powerstar Bloemfontein', type: 'folder', count: 12 },
                { id: 'botswana', label: 'Powerstar Botswana', type: 'folder', count: 5 },
                { id: 'bracken', label: 'Powerstar Brackenfell', type: 'folder', count: 50 },
                { id: 'brakpan', label: 'Powerstar Brakpan', type: 'folder', count: 32 },
                { id: 'centurion', label: 'Powerstar Centurion', type: 'folder', count: 249 },
                { id: 'empangeni', label: 'Powerstar Empangeni', type: 'folder', count: 77 },
                { id: 'ermelo', label: 'Powerstar Ermelo', type: 'folder', count: 88 },
            ]
        }
    ];

    const renderNode = (node: ExplorerNode, level: number = 0) => {
        const isExpanded = expanded.includes(node.id);
        const hasChildren = node.children && node.children.length > 0;

        return (
            <div key={node.id} className="select-none">
                <div
                    className={cn(
                        "flex items-center gap-1.5 py-1 px-2 hover:bg-slate-100 cursor-pointer group transition-colors",
                        level === 0 && "font-bold"
                    )}
                    style={{ paddingLeft: `${level * 12 + 8}px` }}
                    onClick={() => hasChildren && toggle(node.id)}
                >
                    <div className="w-4 flex items-center justify-center">
                        {hasChildren ? (
                            isExpanded ? <ChevronDown className="h-3 w-3 text-slate-400" /> : <ChevronRight className="h-3 w-3 text-slate-400" />
                        ) : null}
                    </div>
                    {node.type === 'folder' ? (
                        <Folder className="h-3.5 w-3.5 text-slate-500 fill-slate-500 animate-in fade-in zoom-in-75 duration-300" />
                    ) : (
                        <div className="w-3.5 h-3.5" />
                    )}
                    <span className="text-[12px] text-slate-700 whitespace-nowrap overflow-hidden text-ellipsis">
                        {node.label} {node.count !== undefined && <span className="text-slate-400 font-normal">({node.count})</span>}
                    </span>

                    <div className="ml-auto opacity-0 group-hover:opacity-100 flex items-center gap-1 pr-1">
                        <Plus className="h-3 w-3 text-slate-400 hover:text-accent" />
                    </div>
                </div>
                {hasChildren && isExpanded && (
                    <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                        {node.children!.map(child => renderNode(child, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <aside className="w-[300px] flex flex-col bg-white border-r border-border h-full overflow-hidden shrink-0">
            {/* Explorer Header */}
            <div className="p-3 border-b border-border space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-accent" />
                        On...
                    </h2>
                    <div className="flex items-center gap-1">
                        <button className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"><Download className="h-3.5 w-3.5" /></button>
                        <button className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"><RefreshCcw className="h-3.5 w-3.5" /></button>
                        <button className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"><FolderPlus className="h-3.5 w-3.5" /></button>
                        <button className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"><Settings2 className="h-3.5 w-3.5" /></button>
                    </div>
                </div>

                {/* Toolbar Mockup from reference */}
                <div className="flex items-center gap-1">
                    <div className="flex items-center bg-slate-50 border border-border rounded px-2 py-1 flex-1">
                        <Search className="h-3 w-3 text-slate-400 mr-2" />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="bg-transparent text-[11px] outline-none w-full text-slate-700"
                        />
                    </div>
                    <button className="p-1.5 border border-border rounded bg-white text-slate-600 hover:bg-slate-50">
                        <LayoutGrid className="h-3.5 w-3.5" />
                    </button>
                    <button className="p-1.5 border border-border rounded bg-white text-slate-600 hover:bg-slate-50">
                        <MoreHorizontal className="h-3.5 w-3.5" />
                    </button>
                </div>

                <div className="flex items-center gap-1">
                    <select className="flex-1 bg-white border border-border rounded text-[11px] py-1 px-1 outline-none text-slate-600">
                        <option>All</option>
                    </select>
                    <button className="p-1.5 border border-border rounded bg-white text-slate-400 hover:text-slate-600">
                        <Search className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>

            {/* Tree Area */}
            <div className="flex-1 overflow-y-auto explorer-scroll py-1 bg-white">
                <div className="flex items-center justify-between px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">
                    <span>Objects (0/1172)</span>
                    <span>Status</span>
                </div>
                {tree.map(node => renderNode(node))}
            </div>

            {/* Bottom Actions Mockup */}
            <div className="border-t border-border p-2 bg-slate-50 flex items-center justify-around">
                <Printer className="h-4 w-4 text-slate-400 cursor-pointer hover:text-slate-600" />
                <Share2 className="h-4 w-4 text-slate-400 cursor-pointer hover:text-slate-600" />
                <Settings2 className="h-4 w-4 text-slate-400 cursor-pointer hover:text-slate-600" />
            </div>
        </aside>
    );
};

export default ObjectExplorer;
