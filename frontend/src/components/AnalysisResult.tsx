import {
    Activity, User, Target, Zap, Settings, ClipboardCheck, MousePointerClick,
    Footprints, Clock, Dumbbell, Brain, AlertCircle, AlertTriangle, Video,
    ThumbsUp, ChevronRight, BarChart
} from "lucide-react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface AnalysisResultProps {
    data: any;
    showTitle?: boolean;
}

const CircularProgress = ({ value }: { value: number }) => {
    const radius = 48;
    const stroke = 8;
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (value / 10) * circumference;

    const colorClass = value >= 7.5 ? 'text-emerald-500' : value >= 5.0 ? 'text-amber-500' : 'text-rose-500';

    return (
        <div className="relative flex items-center justify-center w-[96px] h-[96px]">
            <svg height={radius * 2} width={radius * 2} className="rotate-[-90deg]">
                <circle stroke="currentColor" fill="transparent" strokeWidth={stroke} r={normalizedRadius} cx={radius} cy={radius} className="text-slate-800" />
                <circle stroke="currentColor" fill="transparent" strokeWidth={stroke} strokeDasharray={circumference + ' ' + circumference} style={{ strokeDashoffset }} strokeLinecap="round" r={normalizedRadius} cx={radius} cy={radius} className={cn(colorClass, "transition-all duration-1000 ease-in-out")} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center mt-1">
                <span className={cn("text-2xl font-bold leading-none", colorClass)}>{value.toFixed(1)}</span>
                <span className="text-[10px] text-muted-foreground uppercase mt-0.5">/ 10</span>
            </div>
        </div>
    );
};

const CustomProgress = ({ value, colorClass }: { value: number, colorClass: string }) => (
    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
        <div className={cn("h-full transition-all duration-500", colorClass)} style={{ width: `${value * 10}%` }} />
    </div>
);

const getScoreColorClass = (score: number, isBadge = false) => {
    if (score >= 7.5) return isBadge ? 'bg-emerald-500/10 text-emerald-500' : 'text-emerald-500';
    if (score >= 5.0) return isBadge ? 'bg-amber-500/10 text-amber-500' : 'text-amber-500';
    return isBadge ? 'bg-rose-500/10 text-rose-500' : 'text-rose-500';
};
const getScoreIndicatorClass = (score: number) => {
    if (score >= 7.5) return 'bg-emerald-500';
    if (score >= 5.0) return 'bg-amber-500';
    return 'bg-rose-500';
};

const getValByRegex = (obj: any, regex: RegExp) => {
    if (typeof obj !== 'object' || obj === null) return undefined;
    const key = Object.keys(obj).find(k => regex.test(k));
    if (key) return obj[key];
    return undefined;
};

export const AnalysisResult = ({ data, showTitle = true }: AnalysisResultProps) => {
    const { t } = useTranslation();

    if (!data) return null;

    const analysisData = data.analysis ?? data;
    const role = data.role || "Player";

    if (typeof analysisData === 'string') {
        return (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{analysisData}</p>
            </div>
        );
    }

    // Extract core fields
    const videoContents = getValByRegex(analysisData, /video_?contents/i);
    const suitability = getValByRegex(analysisData, /suitability|valid_?for_?role/i);
    let rawScore = getValByRegex(analysisData, /overall.*score|overall.*average/i) || getValByRegex(analysisData, /^score$|^average$/i);
    const overallScore = typeof rawScore === 'number' ? rawScore : (parseFloat(rawScore) || 7.5);
    const summary = getValByRegex(analysisData, /summary|conclusion|overall_?assessment/i);

    let topStrengths = getValByRegex(analysisData, /top_?strengths|strengths/i) || [];
    let keyWeaknesses = getValByRegex(analysisData, /key_?weaknesses|weaknesses|areas_?for_?improvement/i) || [];
    let recommendations = getValByRegex(analysisData, /recommendations|action_?plan/i) || [];

    if (!Array.isArray(topStrengths)) {
        if (typeof topStrengths === 'string') topStrengths = topStrengths.split('\n').filter(s => s.trim().length > 0);
        else topStrengths = [];
    }
    if (!Array.isArray(keyWeaknesses)) {
        if (typeof keyWeaknesses === 'string') keyWeaknesses = keyWeaknesses.split('\n').filter(s => s.trim().length > 0);
        else keyWeaknesses = [];
    }
    if (!Array.isArray(recommendations)) {
        if (typeof recommendations === 'string') recommendations = recommendations.split('\n').filter(s => s.trim().length > 0);
        else recommendations = [];
    }

    const formatKey = (key: string) => {
        const exists = t(key, { defaultValue: '__NOT_FOUND__' }) !== '__NOT_FOUND__';
        if (exists) return t(key);
        return key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim().replace(/\b\w/g, l => l.toUpperCase());
    };

    const specialKeysPatterns = [
        /video_?contents/i, /suitability|valid_?for_?role|message/i,
        /overall.*score|overall.*average|^score$|^average$/i,
        /summary|conclusion|overall_?assessment/i,
        /top_?strengths|^strengths$/i,
        /key_?weaknesses|^weaknesses$|areas_?for_?improvement/i,
        /recommendations|action_?plan/i,
        /categories|sections|metrics|analysis_?details/i,
        /^jobId$|^id$|^_id$|^__v$|^role$|^createdAt$|^updatedAt$|^analyzedAt$|^framesAnalyzed$|^videoMetadata$/i
    ];

    const categoryEntries = Object.entries(analysisData).filter(([k]) => !specialKeysPatterns.some(p => p.test(k)));

    interface ParsedMetric {
        name: string;
        score: number;
        comment: string;
    }

    interface ParsedCategory {
        name: string;
        score: number | null;
        comment: string | null;
        metrics: ParsedMetric[];
    }

    let parsedCategories: ParsedCategory[] = [];
    const categoriesNode = getValByRegex(analysisData, /categories|sections|metrics|analysis_?details/i);

    if (categoriesNode) {
        if (Array.isArray(categoriesNode)) {
            parsedCategories = categoriesNode.map(cat => {
                let catScore = getValByRegex(cat, /^score$|^overall_?score$|^category_?average$/i);
                const catComment = getValByRegex(cat, /^comment$|^summary$|^description$|^category_?comment$/i) || '';
                const metricsArray = getValByRegex(cat, /metrics|items|details|scores/i);
                let metrics: ParsedMetric[] = [];

                if (Array.isArray(metricsArray)) {
                    metrics = metricsArray.map(m => ({
                        name: formatKey(m.name || m.label || m.title || 'Metric'),
                        score: Number(m.score || m.value || 0),
                        comment: String(m.comment || m.description || '')
                    }));
                } else if (metricsArray && typeof metricsArray === 'object') {
                    metrics = Object.entries(metricsArray).map(([k, v]: [string, any]) => ({
                        name: formatKey(v?.label || v?.name || k),
                        score: Number(v?.score || v?.value || 0),
                        comment: String(v?.comment || v?.description || '')
                    }));
                }

                return {
                    name: formatKey(cat.name || cat.label || cat.title || cat.category || 'Category'),
                    score: catScore !== undefined ? Number(catScore) : null,
                    comment: String(catComment),
                    metrics
                };
            });
        } else if (typeof categoriesNode === 'object' && categoriesNode !== null) {
            parsedCategories = Object.entries(categoriesNode).map(([catKey, catVal]: [string, any]) => {
                let catScore = getValByRegex(catVal, /^score$|^overall_?score$|^category_?average$/i);
                let catComment = getValByRegex(catVal, /^comment$|^summary$|^description$|^category_?comment$/i) || '';
                let catLabel = catVal.label || catVal.name || catVal.title || catKey;

                let metricsNode = getValByRegex(catVal, /scores|metrics|items|details/i);
                let metrics: ParsedMetric[] = [];

                if (metricsNode && typeof metricsNode === 'object') {
                    const mlist = Array.isArray(metricsNode) ? metricsNode : Object.entries(metricsNode).map(([k, v]) => {
                        if (typeof v === 'object' && v !== null) {
                            return { ...(v as Record<string, any>), id_key: k };
                        }
                        return { value: v, id_key: k };
                    });
                    metrics = mlist.map((m: any) => ({
                        name: formatKey(m.label || m.name || m.title || m.id_key || 'Metric'),
                        score: Number(m.score || m.value || 0),
                        comment: String(m.comment || m.description || '')
                    }));
                } else {
                    const mEntries = Object.entries(catVal).filter(([k]) => !/^score$|^overall_?score$|^category_?average$|^comment$|^summary$|^description$|^category_?comment$|^label$|^name$|^title$/i.test(k));
                    metrics = mEntries.map(([mName, mData]: [string, any]) => {
                        if (typeof mData === 'object' && mData !== null) {
                            return {
                                name: formatKey(mData.label || mData.name || mName),
                                score: Number(mData.score || mData.value || 0),
                                comment: String(mData.comment || mData.description || '')
                            };
                        } else {
                            return {
                                name: formatKey(mName),
                                score: 0,
                                comment: String(mData)
                            };
                        }
                    });
                }

                return {
                    name: formatKey(catLabel),
                    score: catScore !== undefined ? Number(catScore) : null,
                    comment: String(catComment),
                    metrics
                };
            });
        }
    } else {
        parsedCategories = categoryEntries.map(([catName, catData]) => {
            let catScore = null;
            let catComment = null;
            let metrics: ParsedMetric[] = [];

            if (typeof catData === 'object' && catData !== null) {
                catScore = getValByRegex(catData, /^score$|^overall_?score$|^category_?average$/i);
                catComment = getValByRegex(catData, /^comment$|^summary$|^description$|^category_?comment$/i) || '';

                const metricEntries = Object.entries(catData).filter(([k]) => !/^score$|^overall_?score$|^category_?average$|^comment$|^summary$|^description$|^category_?comment$/i.test(k));

                metrics = metricEntries.map(([mName, mData]: [string, any]) => {
                    if (typeof mData === 'object' && mData !== null) {
                        return {
                            name: formatKey(mName),
                            score: Number(getValByRegex(mData, /score|value/i) || 0),
                            comment: String(getValByRegex(mData, /comment|description|summary/i) || '')
                        };
                    } else {
                        return {
                            name: formatKey(mName),
                            score: 0,
                            comment: String(mData)
                        };
                    }
                });
            }

            return {
                name: formatKey(catName),
                score: catScore !== undefined && catScore !== null ? Number(catScore) : null,
                comment: catComment ? String(catComment) : null,
                metrics,
            };
        });
    }

    return (
        <div className="space-y-6 w-full max-w-5xl mx-auto rounded-xl">
            {showTitle && (
                <div className="flex flex-col gap-1 mb-6">
                    <div className="flex flex-wrap gap-2 items-center">
                        <span className="text-emerald-500 font-mono text-xs font-bold bg-emerald-500/10 px-2.5 py-1 rounded">04</span>
                        <h2 className="text-2xl font-bold text-slate-100">Analysis Results</h2>
                    </div>
                    <span className="text-slate-400 text-sm">Comprehensive technique breakdown</span>
                </div>
            )}

            {videoContents && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                        <Video className="w-4 h-4 text-slate-400" />
                        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">Video Contents</h3>
                    </div>
                    <p className="text-sm leading-relaxed text-slate-300">{videoContents}</p>
                </div>
            )}

            {suitability && suitability !== "true" && suitability !== true && (
                <div className="bg-[#2A2111] border border-amber-900/50 rounded-xl p-5 mb-6 flex items-start gap-4">
                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-amber-500 text-sm font-medium leading-relaxed">{String(suitability)}</p>
                </div>
            )}

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 lg:p-8 mb-6 flex flex-col md:flex-row gap-8 items-center md:items-start shadow-sm hover:border-slate-700 transition-colors">
                <div className="shrink-0 relative bg-slate-950 p-4 rounded-full border border-slate-800 shadow-inner">
                    <CircularProgress value={overallScore} />
                </div>
                <div className="flex-1 space-y-4 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-3">
                        <span className="text-xl font-bold flex items-center gap-2 text-slate-100">
                            <span className="text-orange-500 text-xl">🏏</span> {role} Analysis — {(overallScore).toFixed(1)}/10
                        </span>
                    </div>
                    <p className="text-slate-400 text-sm leading-relaxed max-w-3xl">
                        {summary || `The ${role.toLowerCase()} demonstrates a solid setup...`}
                    </p>
                    <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-2">
                        <span className="px-3 py-1 bg-slate-800 border border-slate-700 text-[10px] font-bold tracking-wider text-slate-300 rounded-full uppercase">
                            {role}
                        </span>
                        {analysisData.framesAnalyzed && (
                            <span className="px-3 py-1 bg-slate-800 border border-slate-700 text-[10px] font-bold tracking-wider text-slate-300 rounded-full uppercase">
                                {analysisData.framesAnalyzed} FRAMES
                            </span>
                        )}
                        {analysisData.videoMetadata?.duration && (
                            <span className="px-3 py-1 bg-slate-800 border border-slate-700 text-[10px] font-bold tracking-wider text-slate-300 rounded-full uppercase">
                                {analysisData.videoMetadata.duration}S
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {(topStrengths.length > 0 || keyWeaknesses.length > 0 || recommendations.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Strengths */}
                    {topStrengths.length > 0 && (
                        <div className="bg-slate-900 border-t-2 border-t-emerald-500 border-x border-b border-x-slate-800 border-b-slate-800 rounded-xl p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="p-1.5 bg-emerald-500/10 rounded-md">
                                    <ThumbsUp className="w-4 h-4 text-emerald-500" />
                                </div>
                                <h3 className="font-semibold text-slate-100 text-sm">Top Strengths</h3>
                            </div>
                            <ul className="space-y-3">
                                {topStrengths.map((str: string, i: number) => (
                                    <li key={i} className="flex gap-2.5 text-sm text-slate-300">
                                        <ChevronRight className="w-3.5 h-3.5 shrink-0 text-emerald-500/50 mt-0.5" />
                                        <span className="leading-snug">{str}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Weaknesses */}
                    {keyWeaknesses.length > 0 && (
                        <div className="bg-slate-900 border-t-2 border-t-rose-500 border-x border-b border-x-slate-800 border-b-slate-800 rounded-xl p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="p-1.5 bg-rose-500/10 rounded-md">
                                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                                </div>
                                <h3 className="font-semibold text-slate-100 text-sm">Key Weaknesses</h3>
                            </div>
                            <ul className="space-y-3">
                                {keyWeaknesses.map((str: string, i: number) => (
                                    <li key={i} className="flex gap-2.5 text-sm text-slate-300">
                                        <ChevronRight className="w-3.5 h-3.5 shrink-0 text-rose-500/50 mt-0.5" />
                                        <span className="leading-snug">{str}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Recommendations */}
                    {recommendations.length > 0 && (
                        <div className="bg-slate-900 border-t-2 border-t-blue-500 border-x border-b border-x-slate-800 border-b-slate-800 rounded-xl p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="p-1.5 bg-blue-500/10 rounded-md">
                                    <Target className="w-4 h-4 text-blue-500" />
                                </div>
                                <h3 className="font-semibold text-slate-100 text-sm">Recommendations</h3>
                            </div>
                            <ul className="space-y-3">
                                {recommendations.map((str: string, i: number) => (
                                    <li key={i} className="flex gap-2.5 text-sm text-slate-300">
                                        <ChevronRight className="w-3.5 h-3.5 shrink-0 text-blue-500/50 mt-0.5" />
                                        <span className="leading-snug">{str}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {parsedCategories.length > 0 && (
                <div className="space-y-4 mb-10 w-full">
                    <Accordion type="multiple" className="space-y-3 w-full">
                        {parsedCategories.map((cat, i) => {
                            const num = (i + 1).toString().padStart(2, '0');
                            return (
                                <AccordionItem key={i} value={`item-${i}`} className="border border-slate-800 bg-[#0f172a] rounded-xl overflow-hidden shadow-sm px-1">
                                    <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-slate-800/80 transition-colors w-full [&>svg]:text-slate-100">
                                        <div className="flex items-center justify-between w-full pr-4">
                                            <div className="flex items-center gap-4">
                                                <span className="text-slate-400 font-mono text-xs font-bold bg-slate-800 px-2 py-1 rounded">{num}</span>
                                                <span className="font-semibold text-slate-100">{cat.name}</span>
                                            </div>
                                            {cat.score !== null && (
                                                <span className={cn("px-2.5 py-0.5 rounded text-sm font-bold min-w-[40px] text-center", getScoreColorClass(cat.score, false))}>
                                                    {cat.score.toFixed(1)}
                                                </span>
                                            )}
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="px-5 pt-0 pb-6 w-full">
                                        <div className="w-full">
                                            {cat.comment && (
                                                <div className="bg-slate-800 p-4 rounded-lg mb-6 border border-slate-700">
                                                    <p className="text-slate-300 text-sm leading-relaxed">{cat.comment}</p>
                                                </div>
                                            )}
                                            <div className="space-y-7">
                                                {cat.metrics.map((metric, j) => (
                                                    <div key={j} className="space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <h4 className="font-semibold text-sm text-slate-200">{metric.name}</h4>
                                                            <span className={cn("text-sm font-bold", getScoreColorClass(metric.score, false))}>
                                                                {metric.score.toFixed(1)}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-slate-300 max-w-2xl">{metric.comment}</p>
                                                        <div className="pt-1">
                                                            <CustomProgress value={metric.score} colorClass={getScoreIndicatorClass(metric.score)} />
                                                        </div>
                                                    </div>
                                                ))}
                                                {cat.metrics.length === 0 && (
                                                    <p className="text-slate-400 text-sm italic">No specific metrics provided.</p>
                                                )}
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            );
                        })}
                    </Accordion>
                </div>
            )}

            {parsedCategories.length > 0 && (
                <div className="mb-8 w-full">
                    <div className="flex items-center gap-2 mb-4 px-2">
                        <BarChart className="w-5 h-5 text-emerald-500" />
                        <h3 className="text-lg font-bold text-black-100">Analysis scores</h3>
                    </div>
                    <div className="rounded-xl border border-slate-800 overflow-hidden bg-[#0f172a]">
                        <Table className="w-full max-w-full bg-[#0f172a]">
                            <TableHeader className="bg-[#0a0f1c]">
                                <TableRow className="border-slate-800 hover:bg-[#0a0f1c] bg-[#0a0f1c]">
                                    <TableHead className="w-12 text-slate-400 text-xs font-semibold uppercase tracking-wider">#</TableHead>
                                    <TableHead className="w-[15%] text-slate-400 text-xs font-semibold uppercase tracking-wider">Category</TableHead>
                                    <TableHead className="w-[25%] text-slate-400 text-xs font-semibold uppercase tracking-wider">Metric</TableHead>
                                    <TableHead className="w-20 text-slate-400 text-xs font-semibold uppercase tracking-wider">Score</TableHead>
                                    <TableHead className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Comment</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="bg-[#0f172a]">
                                {parsedCategories.flatMap((cat, i) =>
                                    (cat.metrics.length > 0 ? cat.metrics : [{ name: '-', score: cat.score || 0, comment: '-' }]).map((metric, j) => (
                                        <TableRow key={`${i}-${j}`} className="border-slate-800 bg-[#0f172a] hover:bg-slate-800/80">
                                            {j === 0 && (
                                                <>
                                                    <TableCell rowSpan={Math.max(1, cat.metrics.length)} className="align-top font-mono text-slate-400 pt-5 text-xs">
                                                        {i + 1}
                                                    </TableCell>
                                                    <TableCell rowSpan={Math.max(1, cat.metrics.length)} className="align-top font-medium text-slate-200 pt-4 text-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]" title={cat.name}>
                                                        {cat.name}
                                                    </TableCell>
                                                </>
                                            )}
                                            <TableCell className="text-slate-100 py-4 text-sm">
                                                {metric.name}
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full", getScoreColorClass(metric.score, true))}>
                                                    {metric.score.toFixed(1)}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-slate-400 text-sm py-4 leading-relaxed">
                                                {metric.comment}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}
        </div>
    );
};

