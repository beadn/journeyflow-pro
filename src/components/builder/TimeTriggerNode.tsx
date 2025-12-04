import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
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
  const { label, isStart } = data;

  return (
    <>
      {!isStart && (
        <Handle 
          type="target" 
          position={Position.Top} 
          className="!w-3 !h-3 !bg-white !border-2 !border-gray-300 !rounded-full opacity-0" 
        />
      )}
      
      <div className={cn(
        "px-6 py-2.5 rounded-full text-sm font-medium border-2 transition-all",
        isStart 
          ? "bg-blue-500 text-white border-blue-500" 
          : "bg-white text-gray-700 border-gray-300"
      )}>
        {isStart ? '+ New action' : label}
      </div>

      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="!w-3 !h-3 !bg-white !border-2 !border-gray-300 !rounded-full !-bottom-1.5" 
      />
    </>
  );
});

TimeTriggerNode.displayName = 'TimeTriggerNode';
