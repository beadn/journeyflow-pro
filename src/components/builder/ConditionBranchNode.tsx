import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { GitBranch, Plus } from 'lucide-react';

interface ConditionBranchNodeProps {
  data: {
    label: string;
    description?: string;
  };
}

export const ConditionBranchNode = memo(({ data }: ConditionBranchNodeProps) => {
  const { label, description } = data;

  return (
    <>
      {/* Top handle */}
      <Handle 
        type="target" 
        position={Position.Top} 
        className="!w-3 !h-3 !bg-white !border-2 !border-gray-300 !rounded-full !-top-1.5" 
      />
      
      <div className="relative bg-white rounded-xl border border-dashed border-teal-300 min-w-[280px] max-w-[320px]">
        {/* Type badge */}
        <div className="absolute -top-3 left-4">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-700">
            <GitBranch className="w-3.5 h-3.5" />
            Condition
          </span>
        </div>

        {/* Content */}
        <div className="pt-5 px-4 pb-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">
            {label}
          </h3>
          {description && (
            <p className="text-xs text-gray-500">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Multiple bottom handles for branches */}
      <Handle 
        type="source" 
        position={Position.Bottom}
        id="left"
        className="!w-3 !h-3 !bg-white !border-2 !border-teal-400 !rounded-full !-bottom-1.5 !left-[25%]" 
      />
      <Handle 
        type="source" 
        position={Position.Bottom}
        id="bottom"
        className="!w-3 !h-3 !bg-white !border-2 !border-teal-400 !rounded-full !-bottom-1.5" 
      />
      <Handle 
        type="source" 
        position={Position.Bottom}
        id="right"
        className="!w-3 !h-3 !bg-white !border-2 !border-teal-400 !rounded-full !-bottom-1.5 !left-[75%]" 
      />

      {/* Add button */}
      <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
        <button className="w-6 h-6 rounded-full bg-white border border-gray-300 flex items-center justify-center text-gray-400 hover:text-teal-600 hover:border-teal-400 transition-colors shadow-sm">
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </>
  );
});

ConditionBranchNode.displayName = 'ConditionBranchNode';
