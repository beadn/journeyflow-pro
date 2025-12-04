import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Clock, Play, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimeTriggerNodeProps {
  data: {
    label: string;
    daysDiff: number;
    offsetDays: number;
    isStart?: boolean;
  };
}

export const TimeTriggerNode = memo(({ data }: TimeTriggerNodeProps) => {
  const { label, daysDiff, offsetDays, isStart } = data;

  const formatWaitTime = (days: number) => {
    if (days === 0) return 'Immediately';
    if (days === 1) return '1 day';
    if (days < 7) return `${days} days`;
    if (days === 7) return '1 week';
    if (days < 30) return `${Math.floor(days / 7)} weeks`;
    if (days === 30) return '1 month';
    return `${Math.floor(days / 30)} months`;
  };

  const formatOffset = (days: number) => {
    if (days === 0) return 'Day 0';
    if (days < 0) return `${days} days`;
    return `+${days} days`;
  };

  return (
    <>
      {!isStart && (
        <Handle 
          type="target" 
          position={Position.Top} 
          className="!w-3 !h-3 !bg-muted-foreground/50 !border-2 !border-card opacity-0" 
        />
      )}
      
      <div className={cn(
        "flex items-center gap-3 px-6 py-3 rounded-full border-2 border-dashed transition-all",
        isStart 
          ? "bg-success/10 border-success/50" 
          : "bg-warning/10 border-warning/50"
      )}>
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center",
          isStart ? "bg-success/20 text-success" : "bg-warning/20 text-warning"
        )}>
          {isStart ? (
            <Play className="w-5 h-5" />
          ) : (
            <Timer className="w-5 h-5" />
          )}
        </div>
        
        <div className="text-left">
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-sm font-bold",
              isStart ? "text-success" : "text-warning"
            )}>
              {isStart ? 'Journey Start' : `Wait ${formatWaitTime(daysDiff)}`}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span className="font-medium">{label}</span>
            <span className="text-muted-foreground/70">({formatOffset(offsetDays)})</span>
          </div>
        </div>
      </div>

      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="!w-3 !h-3 !bg-muted-foreground/50 !border-2 !border-card opacity-0" 
      />
    </>
  );
});

TimeTriggerNode.displayName = 'TimeTriggerNode';
