import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Timer, Play } from 'lucide-react';

interface WaitNodeProps {
  data: {
    label: string;
    offsetDays: number;
    isStart?: boolean;
  };
}

export const WaitNode = memo(({ data }: WaitNodeProps) => {
  const { label, offsetDays, isStart } = data;

  const formatOffset = () => {
    if (offsetDays === 0) return 'Día 0';
    if (offsetDays > 0) return `+${offsetDays} días`;
    return `${offsetDays} días`;
  };

  if (isStart) {
    return (
      <>
        <div className="flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-semibold shadow-lg border-2 border-cyan-400">
          <Play className="w-4 h-4" />
          <span>Inicio del Journey</span>
        </div>
        <Handle 
          type="source" 
          position={Position.Bottom} 
          className="!w-3 !h-3 !bg-white !border-2 !border-cyan-500 !rounded-full !-bottom-1.5" 
        />
      </>
    );
  }

  return (
    <>
      <Handle 
        type="target" 
        position={Position.Top} 
        className="!w-3 !h-3 !bg-white !border-2 !border-amber-500 !rounded-full !-top-1.5" 
      />
      
      <div className="relative">
        {/* Wait indicator */}
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-amber-50 border-2 border-amber-300 shadow-md">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
            <Timer className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <div className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Esperar hasta</div>
            <div className="text-sm font-bold text-amber-900">{label}</div>
          </div>
          <div className="px-2.5 py-1 rounded-full bg-amber-200 text-amber-800 text-xs font-bold">
            {formatOffset()}
          </div>
        </div>
        
        {/* Decorative line indicating "barrier" */}
        <div className="absolute -left-8 top-1/2 -translate-y-1/2 w-2 h-12 bg-amber-300 rounded-full opacity-50" />
        <div className="absolute -right-8 top-1/2 -translate-y-1/2 w-2 h-12 bg-amber-300 rounded-full opacity-50" />
      </div>

      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="!w-3 !h-3 !bg-white !border-2 !border-amber-500 !rounded-full !-bottom-1.5" 
      />
    </>
  );
});

WaitNode.displayName = 'WaitNode';

