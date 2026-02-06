// app/components/XPBar.tsx
interface XPBarProps {
    percentual: number;
    aulas: number;
}

export default function XPBar({ percentual, aulas }: XPBarProps) {
    return (
        <div className="w-full bg-gray-200 rounded-full h-6 dark:bg-gray-700 relative overflow-hidden">
            <div
                className="bg-accent h-6 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${percentual}%` }}
            ></div>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow-md">
                {aulas} aulas assistidas ({percentual}%)
            </span>
        </div>
    );
}