
import React from 'react';

interface MacroDisplayProps {
  label: string;
  val: number;
  target?: number;
  color: 'blue' | 'yellow' | 'purple' | 'green';
  compact?: boolean;
}

const colorMap = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', bar: 'bg-blue-600', label: 'text-blue-400' },
  yellow: { bg: 'bg-yellow-50', text: 'text-yellow-600', bar: 'bg-yellow-600', label: 'text-yellow-500' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600', bar: 'bg-purple-600', label: 'text-purple-400' },
  green: { bg: 'bg-green-50', text: 'text-green-600', bar: 'bg-green-600', label: 'text-green-500' },
};

export const MacroDisplay: React.FC<MacroDisplayProps> = ({ label, val, target, color, compact }) => {
  const styles = colorMap[color];
  const percentage = target ? Math.min(100, (val / target) * 100) : 0;

  if (compact) {
    return (
      <div className={`p-3 rounded-xl text-center ${styles.bg} ${styles.text}`}>
        <div className={`text-[9px] font-bold uppercase opacity-70 mb-1`}>{label}</div>
        <div className="text-lg font-black">{val.toFixed(1)}g</div>
      </div>
    );
  }

  return (
    <div className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl text-center flex flex-col items-center justify-between h-full ${styles.bg} ${styles.text}`}>
      <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest mb-1 opacity-60 truncate w-full">{label}</span>
      <span className="text-xs sm:text-sm font-black truncate w-full">
        {val}/{target}g
      </span>
      <div className="w-full h-1 bg-white/50 rounded-full mt-2 overflow-hidden">
        <div 
          className={`h-full ${styles.bar} transition-all duration-1000`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};
