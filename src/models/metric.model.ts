
export interface Metric {
    title: string;
    value: string;
    // FIX: Made 'change' property optional to resolve type errors in extending interfaces and reflect its usage.
    change?: string;
    changeType: 'positive' | 'negative' | 'neutral';
    icon: string;
    description: string;
}