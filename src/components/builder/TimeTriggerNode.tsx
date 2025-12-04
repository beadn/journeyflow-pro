import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { Clock, Play } from 'lucide-react';

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
          className="!w-3 !h-3 !bg-background !border-2 !border-primary !rounded-full !-top-1.5" 
        />
      )}
      
      <div className={cn(
        "flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium border-2 transition-all shadow-md",
        isStart 
          ? "bg-primary text-primary-foreground border-primary" 
          : "bg-card text-foreground border-border hover:border-primary/50"
      )}>
        {isStart ? (
          <Play className="w-4 h-4" />
        ) : (
          <Clock className="w-4 h-4 text-muted-foreground" />
        )}
        <span>{isStart ? 'Inicio' : label}</span>
        <span className={cn(
          "text-xs px-2 py-0.5 rounded-full font-semibold",
          isStart 
            ? "bg-primary-foreground/20 text-primary-foreground" 
            : "bg-muted text-muted-foreground"
        )}>
          {formatOffset()}
        </span>
      </div>

      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="!w-3 !h-3 !bg-background !border-2 !border-primary !rounded-full !-bottom-1.5" 
      />
    </>
  );
});

TimeTriggerNode.displayName = 'TimeTriggerNode';