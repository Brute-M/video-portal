import {
    Activity,
    User,
    Target,
    Zap,
    Settings,
    ClipboardCheck,
    MousePointerClick,
    Footprints,
    Clock,
    Dumbbell,
    Brain,
    AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

interface AnalysisResultProps {
    data: any;
}

export const AnalysisResult = ({ data }: AnalysisResultProps) => {
    const { t } = useTranslation();

    // Icon mapping helper
    const getIconForKey = (key: string) => {
        const keyLower = key.toLowerCase();
        if (keyLower.includes("run_up") || keyLower.includes("approach")) return Activity;
        if (keyLower.includes("bowling") || keyLower.includes("action")) return User;
        if (keyLower.includes("line") || keyLower.includes("length")) return Target;
        if (keyLower.includes("pace") || keyLower.includes("variation")) return Zap;
        if (keyLower.includes("technical")) return Settings;
        if (keyLower.includes("overall") || keyLower.includes("assessment")) return ClipboardCheck;
        if (keyLower.includes("shot") || keyLower.includes("selection")) return MousePointerClick;
        if (keyLower.includes("footwork")) return Footprints;
        if (keyLower.includes("timing")) return Clock;
        if (keyLower.includes("strength")) return Dumbbell;
        if (keyLower.includes("improvement")) return AlertCircle;
        return Brain; // Default
    };

    const formatKey = (key: string) => {
        // Try to translate the key, fallback to original formatting if no translation found
        const exists = t(key, { defaultValue: '__NOT_FOUND__' }) !== '__NOT_FOUND__';
        if (exists) return t(key);

        return key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const renderAnalysisContent = (value: any) => {
        if (typeof value === 'string') {
            return <p className="text-muted-foreground leading-relaxed">{value}</p>;
        }
        if (Array.isArray(value)) {
            return (
                <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                    {value.map((item, i) => (
                        <li key={i}>{String(item)}</li>
                    ))}
                </ul>
            );
        }
        if (typeof value === 'object' && value !== null) {
            return (
                <div className="space-y-4">
                    {Object.entries(value).map(([subKey, subValue]) => {
                        if (subKey.trim().toLowerCase() === 'suitability') return null;
                        const SubIcon = getIconForKey(subKey);
                        return (
                            <div key={subKey} className="bg-secondary/20 p-3 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <SubIcon className="w-4 h-4 text-primary/70" />
                                    <h4 className="font-semibold text-sm text-foreground">{formatKey(subKey)}</h4>
                                </div>
                                {renderAnalysisContent(subValue)}
                            </div>
                        );
                    })}
                </div>
            );
        }
        return <p className="text-muted-foreground">{String(value)}</p>;
    };

    if (!data) return null;

    // Handle case where data might be nested under 'analysis' key or be the analysis object itself
    const analysisData = data.analysis || data;
    const role = data.role;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-display font-semibold">{t('analysis_report')}</h2>
                {role && (
                    <span className="bg-primary/10 text-primary px-4 py-1.5 rounded-full font-medium capitalize border border-primary/20">
                        Role: {role}
                    </span>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(analysisData).map(([key, value]) => {
                    // Skip role if it's in the analysis data
                    if (key === 'role' || key.trim().toLowerCase() === 'suitability') return null;

                    const Icon = getIconForKey(key);
                    return (
                        <Card key={key} className="glass-card border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
                            <CardHeader className="flex flex-row items-center gap-4 pb-2 space-y-0">
                                <div className="p-2.5 bg-primary/10 rounded-xl text-primary ring-1 ring-primary/20">
                                    <Icon className="w-5 h-5" />
                                </div>
                                <CardTitle className="text-lg font-semibold text-foreground">
                                    {formatKey(key)}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4">
                                {renderAnalysisContent(value)}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};
