import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Trash2, Mail, MessageSquare, MonitorSmartphone, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDemo } from '../context/DemoContext';
import { METRIC_META, type AlertMetric, type AlertSeverity, type NotificationRule, type RuleOperator } from '../data/alerts';
import { PageFade, DemoButton, Field, inputCls, Card, SEVERITY_STYLE } from '../components/ui';

const Toggle: React.FC<{ on: boolean; onChange: (v: boolean) => void }> = ({ on, onChange }) => (
    <button
        onClick={() => onChange(!on)}
        className={cn('relative w-10 h-[22px] rounded-full transition-colors', on ? 'bg-green-500' : 'bg-slate-200')}
    >
        <motion.span
            layout
            transition={{ type: 'spring', stiffness: 600, damping: 32 }}
            className="absolute top-[3px] w-4 h-4 rounded-full bg-white shadow"
            style={{ left: on ? 22 : 3 }}
        />
    </button>
);

const ChannelPill: React.FC<{ icon: React.ReactNode; label: string; on: boolean; onClick: () => void }> = ({ icon, label, on, onClick }) => (
    <button onClick={onClick}
        className={cn('flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors',
            on ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200')}>
        {icon}{label}
    </button>
);

const Notifications: React.FC = () => {
    const { rules, addRule, updateRule, removeRule } = useDemo();
    const [showForm, setShowForm] = useState(false);
    const [draft, setDraft] = useState<{ name: string; metric: AlertMetric; operator: RuleOperator; threshold: string; severity: AlertSeverity }>({
        name: '', metric: 'speed', operator: 'gt', threshold: '90', severity: 'warning',
    });

    const save = () => {
        const meta = METRIC_META[draft.metric];
        const rule: NotificationRule = {
            id: `rule_${Date.now()}`,
            name: draft.name.trim() || `${meta.label} ${draft.operator === 'gt' ? 'above' : 'below'} ${draft.threshold} ${meta.unit}`,
            metric: draft.metric,
            operator: draft.operator,
            threshold: Number(draft.threshold) || 0,
            severity: draft.severity,
            enabled: true,
            channels: { popup: true, email: false, sms: false },
        };
        addRule(rule);
        setShowForm(false);
        setDraft({ name: '', metric: 'speed', operator: 'gt', threshold: '90', severity: 'warning' });
    };

    return (
        <PageFade className="h-full overflow-y-auto bg-slate-50">
            <div className="max-w-3xl mx-auto px-6 py-6">
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">Notification rules</h2>
                        <p className="text-sm text-slate-400">Define thresholds on any live sensor — breaches raise alerts instantly across popup, email and SMS channels.</p>
                    </div>
                    <DemoButton onClick={() => setShowForm(s => !s)}><Plus size={15} /> New rule</DemoButton>
                </div>

                <AnimatePresence>
                    {showForm && (
                        <motion.div
                            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                            animate={{ opacity: 1, height: 'auto', marginBottom: 20 }}
                            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                            className="overflow-hidden"
                        >
                            <Card className="p-5 border-accent/30 ring-1 ring-accent/10">
                                <div className="flex items-center gap-2 mb-4 text-accent">
                                    <Zap size={16} />
                                    <h3 className="font-bold text-slate-800">Create rule</h3>
                                </div>
                                <div className="grid sm:grid-cols-2 gap-3">
                                    <Field label="Rule name (optional)" className="sm:col-span-2">
                                        <input className={inputCls} placeholder="e.g. Speeding in urban areas" value={draft.name}
                                            onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} />
                                    </Field>
                                    <Field label="Sensor / metric">
                                        <select className={inputCls} value={draft.metric} onChange={e => setDraft(d => ({ ...d, metric: e.target.value as AlertMetric }))}>
                                            {(Object.keys(METRIC_META) as AlertMetric[]).map(m => (
                                                <option key={m} value={m}>{METRIC_META[m].label} ({METRIC_META[m].unit})</option>
                                            ))}
                                        </select>
                                    </Field>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Field label="Condition">
                                            <select className={inputCls} value={draft.operator} onChange={e => setDraft(d => ({ ...d, operator: e.target.value as RuleOperator }))}>
                                                <option value="gt">Above</option>
                                                <option value="lt">Below</option>
                                            </select>
                                        </Field>
                                        <Field label={`Threshold (${METRIC_META[draft.metric].unit})`}>
                                            <input type="number" className={inputCls} value={draft.threshold}
                                                onChange={e => setDraft(d => ({ ...d, threshold: e.target.value }))} />
                                        </Field>
                                    </div>
                                    <Field label="Severity" className="sm:col-span-2">
                                        <div className="flex gap-2">
                                            {(['info', 'warning', 'critical'] as AlertSeverity[]).map(s => (
                                                <button key={s} onClick={() => setDraft(d => ({ ...d, severity: s }))}
                                                    className={cn('flex-1 rounded-lg px-3 py-2 text-sm font-bold capitalize border transition-all',
                                                        draft.severity === s
                                                            ? `${SEVERITY_STYLE[s].bg} ${SEVERITY_STYLE[s].text} border-current`
                                                            : 'border-slate-200 text-slate-400 hover:border-slate-300')}>
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    </Field>
                                </div>
                                <div className="flex gap-2 mt-5">
                                    <DemoButton variant="ghost" onClick={() => setShowForm(false)}>Cancel</DemoButton>
                                    <DemoButton onClick={save}>Save rule — goes live immediately</DemoButton>
                                </div>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="space-y-2.5">
                    <AnimatePresence initial={false}>
                        {rules.map(rule => {
                            const meta = METRIC_META[rule.metric];
                            const sev = SEVERITY_STYLE[rule.severity];
                            return (
                                <motion.div key={rule.id} layout initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -30 }}>
                                    <Card className={cn('p-4 flex items-center gap-4 transition-opacity', !rule.enabled && 'opacity-50')}>
                                        <Toggle on={rule.enabled} onChange={v => updateRule({ ...rule, enabled: v })} />
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-sm font-bold text-slate-800">{rule.name}</span>
                                                <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold uppercase', sev.bg, sev.text)}>{rule.severity}</span>
                                                {rule.builtIn && <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase bg-slate-100 text-slate-400">Built-in</span>}
                                            </div>
                                            <p className="text-xs text-slate-400 mt-0.5">
                                                Trigger when <span className="font-semibold text-slate-500">{meta.label.toLowerCase()}</span> is {rule.operator === 'gt' ? 'above' : 'below'} <span className="font-semibold text-slate-500">{rule.threshold} {meta.unit}</span>
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <ChannelPill icon={<MonitorSmartphone size={11} />} label="Popup" on={rule.channels.popup}
                                                onClick={() => updateRule({ ...rule, channels: { ...rule.channels, popup: !rule.channels.popup } })} />
                                            <ChannelPill icon={<Mail size={11} />} label="Email" on={rule.channels.email}
                                                onClick={() => updateRule({ ...rule, channels: { ...rule.channels, email: !rule.channels.email } })} />
                                            <ChannelPill icon={<MessageSquare size={11} />} label="SMS" on={rule.channels.sms}
                                                onClick={() => updateRule({ ...rule, channels: { ...rule.channels, sms: !rule.channels.sms } })} />
                                        </div>
                                        {!rule.builtIn && (
                                            <button onClick={() => removeRule(rule.id)} className="p-1.5 rounded-md text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0">
                                                <Trash2 size={15} />
                                            </button>
                                        )}
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>
        </PageFade>
    );
};

export default Notifications;
