import { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Block, BlockMetrics } from '@/types/journey';
import { useJourneyStore } from '@/stores/journeyStore';
import { cn } from '@/lib/utils';
import { CheckCircle2, Users, Plus } from 'lucide-react';

interface BlockNodeProps {
  data: { 
    block: Block; 
    onEdit: () => void; 
    metrics: BlockMetrics;
    stepNumber?: number;
  };
}

export const BlockNode = memo(({ data }: BlockNodeProps) => {
  const { block, onEdit, metrics, stepNumber } = data;
  const { getTasksByBlockId } = useJourneyStore();
  const tasks = getTasksByBlockId(block.id);

  // Get category badge color
  const getCategoryColor = () => {
    switch (block.category?.toLowerCase()) {
      case 'legal': return 'bg-emerald-100 text-emerald-700';
      case 'it': return 'bg-blue-100 text-blue-700';
      case 'hr': return 'bg-purple-100 text-purple-700';
      case 'welcome': return 'bg-amber-100 text-amber-700';
      case 'team': return 'bg-pink-100 text-pink-700';
      case 'feedback': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <>
      {/* Top handle */}
      <Handle 
        type="target" 
        position={Position.Top} 
        className="!w-3 !h-3 !bg-white !border-2 !border-gray-300 !rounded-full !-top-1.5" 
      />
      
      <div 
        className="relative bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer min-w-[280px] max-w-[320px]"
        onClick={onEdit}
      >
        {/* Type badge */}
        <div className="absolute -top-3 left-4">
          <span className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
            tasks.length > 0 ? "bg-emerald-100 text-emerald-700" : getCategoryColor()
          )}>
            <CheckCircle2 className="w-3.5 h-3.5" />
            {tasks.length > 0 ? 'Task' : (block.category || 'Block')}
          </span>
        </div>

        {/* Step number badge */}
        {stepNumber && (
          <div className="absolute -top-3 right-4">
            <span className="text-xs text-gray-400 font-medium">
              Step {stepNumber}
            </span>
          </div>
        )}

        {/* Content */}
        <div className="pt-5 px-4 pb-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-1 leading-snug">
            {block.name}
          </h3>
          
          {block.description ? (
            <p className="text-xs text-gray-500 mb-3 line-clamp-2">
              {block.description}
            </p>
          ) : (
            <p className="text-xs text-gray-400 mb-3">
              Click to configure this block
            </p>
          )}

          {/* Tasks preview */}
          {tasks.length > 0 && (
            <div className="space-y-2 mb-3">
              {tasks.slice(0, 2).map((task) => (
                <div key={task.id} className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-700 truncate">
                      {task.title}
                      {task.simpleCondition && <span className="text-red-500 ml-0.5">*</span>}
                    </p>
                    {task.assigneeLabel && (
                      <p className="text-[10px] text-gray-400">
                        Assignee: <span className="text-gray-600">{task.assigneeLabel}</span>
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {tasks.length > 2 && (
                <p className="text-[10px] text-gray-400 pl-4">
                  +{tasks.length - 2} more tasks
                </p>
              )}
            </div>
          )}

          {/* Footer stats */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="flex items-center gap-3 text-xs text-gray-500">
              {tasks.length > 0 && (
                <span className="font-medium">{tasks.length} tasks</span>
              )}
              {block.rules.length > 0 && (
                <span className="text-teal-600 font-medium">{block.rules.length} rules</span>
              )}
            </div>
            {metrics.employeesInBlock > 0 && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Users className="w-3.5 h-3.5" />
                <span>{metrics.employeesInBlock}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom handle */}
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="!w-3 !h-3 !bg-white !border-2 !border-gray-300 !rounded-full !-bottom-1.5" 
      />

      {/* Add button */}
      <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
        <button className="w-6 h-6 rounded-full bg-white border border-gray-300 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:border-gray-400 transition-colors shadow-sm">
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </>
  );
});

BlockNode.displayName = 'BlockNode';
