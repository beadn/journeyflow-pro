import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { Clock, Play, Calendar } from 'lucide-react';

interface TimeTriggerNodeProps {
  data: {
    label: string;
    daysDiff: number;
    offsetDays: number;
    isStart?: boolean;
  };
}

export const TimeTriggerNode = memo(({ data }: TimeTriggerNodeProps) => {
  const { label, offsetDays, isStart } = data;

  const formatOffset = () => {
    if (offsetDays === 0) return 'Day 0';
    if (offsetDays > 0) return `+${offsetDays} días`;
    return `${offsetDays} días`;
  };

  return (
    <>
      {!isStart && (
        <Handle 
          type="target" 
          position={Position.Top} 
          className="!w-4 !h-4 !bg-white !border-2 !border-cyan-300 !rounded-full !-top-2" 
        />
      )}
      
      <div className={cn(
        "relative flex flex-col items-center"
      )}>
        {/* Badge label */}
        <div className={cn(
          "absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap",
        )}>
          <span className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border shadow-sm",
            isStart 
              ? "bg-cyan-500 text-white border-cyan-500" 
              : "bg-white text-gray-700 border-gray-200"
          )}>
            {isStart ? <Play className="w-3 h-3" /> : <Calendar className="w-3 h-3 text-cyan-500" />}
            {isStart ? 'Inicio' : label}
          </span>
        </div>

        {/* Main card */}
        <div className={cn(
          "mt-4 px-5 py-3 rounded-xl text-sm font-medium border-2 transition-all shadow-md bg-white min-w-[160px] text-center",
          isStart 
            ? "border-cyan-400 ring-2 ring-cyan-100" 
            : "border-gray-200 hover:border-cyan-300 hover:shadow-lg"
        )}>
          <div className="flex items-center justify-center gap-2 text-gray-700">
            <Clock className="w-4 h-4 text-cyan-500" />
            <span className="font-semibold">{formatOffset()}</span>
          </div>
          {!isStart && (
            <div className="text-xs text-gray-400 mt-1">
              desde anchor
            </div>
          )}
        </div>

        {/* Animated pulse indicator */}
        {isStart && (
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
            <span className="flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>
          </div>
        )}
      </div>

      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="!w-4 !h-4 !bg-white !border-2 !border-cyan-300 !rounded-full !-bottom-2" 
      />
    </>
  );
});

TimeTriggerNode.displayName = 'TimeTriggerNode';