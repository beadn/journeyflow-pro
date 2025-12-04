import { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Block } from '@/types/journey';
import { useJourneyStore } from '@/stores/journeyStore';
import { cn } from '@/lib/utils';
import { Plus, Scale, Monitor, Users, Smile, UsersRound, MessageSquare, GraduationCap, Layers, Trash2, GitBranch } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface BlockNodeProps {
  data: { 
    block: Block; 
    onEdit: () => void; 
    stepNumber?: number;
  };
}

const getCategoryConfig = (category?: string) => {
  switch (category?.toLowerCase()) {
    case 'legal':
      return { color: '#16a34a', bgLight: '#dcfce7', icon: Scale };
    case 'it':
      return { color: '#2563eb', bgLight: '#dbeafe', icon: Monitor };
    case 'hr':
      return { color: '#9333ea', bgLight: '#f3e8ff', icon: Users };
    case 'welcome':
      return { color: '#f59e0b', bgLight: '#fef3c7', icon: Smile };
    case 'team':
      return { color: '#06b6d4', bgLight: '#cffafe', icon: UsersRound };
    case 'feedback':
      return { color: '#ec4899', bgLight: '#fce7f3', icon: MessageSquare };
    case 'training':
      return { color: '#8b5cf6', bgLight: '#ede9fe', icon: GraduationCap };
    default:
      return { color: '#6b7280', bgLight: '#f3f4f6', icon: Layers };
  }
};

export const BlockNode = memo(({ data }: BlockNodeProps) => {
  const { block, onEdit, stepNumber } = data;
  const { getTasksByBlockId, deleteBlock } = useJourneyStore();
  const tasks = getTasksByBlockId(block.id);
  const categoryConfig = getCategoryConfig(block.category);
  const CategoryIcon = categoryConfig.icon;
  const [isHovered, setIsHovered] = useState(false);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteBlock(block.id);
  };

  return (
    <>
      {/* Top handle with animated ring */}
      <Handle 
        type="target" 
        position={Position.Top} 
        className="!w-4 !h-4 !bg-white !border-2 !border-cyan-300 !rounded-full !-top-2" 
      />
      
      <div 
        className={cn(
          "relative bg-white rounded-xl border-2 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer min-w-[280px] max-w-[320px] group",
          isHovered ? "border-cyan-400 scale-[1.02]" : "border-gray-200"
        )}
        onClick={onEdit}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Category badge */}
        <div className="absolute -top-3 left-4 z-10">
          <span 
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shadow-sm border"
            style={{ 
              backgroundColor: categoryConfig.bgLight, 
              color: categoryConfig.color,
              borderColor: `${categoryConfig.color}30`
            }}
          >
            <CategoryIcon className="w-3.5 h-3.5" />
            {block.category || 'Block'}
          </span>
        </div>

        {/* Step number */}
        {stepNumber && (
          <div className="absolute -top-3 right-4 z-10">
            <span className="text-xs text-gray-400 font-medium bg-white px-2 py-0.5 rounded-full border border-gray-200">
              Step {stepNumber}
            </span>
          </div>
        )}

        {/* Delete button */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "absolute top-3 right-3 p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all z-10",
                isHovered ? "opacity-100" : "opacity-0"
              )}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent onClick={(e) => e.stopPropagation()}>
            <AlertDialogHeader>
              <AlertDialogTitle>Eliminar bloque</AlertDialogTitle>
              <AlertDialogDescription>
                ¿Seguro que quieres eliminar "{block.name}"? Se eliminarán también las {tasks.length} tareas de este bloque.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-red-500 text-white hover:bg-red-600">
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Content */}
        <div className="pt-6 px-4 pb-4">
          <h3 className="text-sm font-bold text-gray-900 mb-1 leading-snug pr-6">
            {block.name}
          </h3>
          
          <p className="text-xs text-gray-500 mb-3">
            {block.description || 'Haz clic para configurar'}
          </p>

          {/* Tasks preview */}
          {tasks.length > 0 && (
            <div className="space-y-2 mb-3">
              {tasks.slice(0, 2).map((task) => (
                <div key={task.id} className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-700 truncate">
                      {task.title}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {task.assigneeType}
                    </p>
                  </div>
                </div>
              ))}
              {tasks.length > 2 && (
                <p className="text-[10px] text-gray-400 pl-4">
                  +{tasks.length - 2} tareas más
                </p>
              )}
            </div>
          )}

          {/* Footer stats */}
          <div className="flex items-center gap-3 pt-3 border-t border-gray-100 text-xs">
            <span className="font-semibold text-gray-600">{tasks.length} tareas</span>
            {block.rules.length > 0 && (
              <span className="flex items-center gap-1 text-cyan-600 font-medium">
                <GitBranch className="w-3 h-3" />
                {block.rules.length} reglas
              </span>
            )}
            {block.expectedDurationDays && (
              <span className="text-gray-400">{block.expectedDurationDays}d SLA</span>
            )}
          </div>
        </div>
      </div>

      {/* Bottom handle */}
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="!w-4 !h-4 !bg-white !border-2 !border-cyan-300 !rounded-full !-bottom-2" 
      />

      {/* Add button below */}
      <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
        <button className="w-7 h-7 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center text-gray-400 hover:text-cyan-500 hover:border-cyan-400 transition-all shadow-sm hover:shadow-md">
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </>
  );
});

BlockNode.displayName = 'BlockNode';