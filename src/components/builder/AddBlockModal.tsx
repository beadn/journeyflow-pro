import { useState } from 'react';
import { Block, Task } from '@/types/journey';
import { useJourneyStore } from '@/stores/journeyStore';
import { blockTemplates, blockCategories, BlockTemplate } from '@/lib/blockTemplates';
import { cn } from '@/lib/utils';
import { Plus, Layers } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface AddBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  journeyId: string;
  periodId: string;
  onBlockCreated: (blockId: string) => void;
}

export function AddBlockModal({ isOpen, onClose, journeyId, periodId, onBlockCreated }: AddBlockModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { addBlock, addTask, getBlocksByPeriodId } = useJourneyStore();

  const handleSelectTemplate = (template: BlockTemplate) => {
    const blocks = getBlocksByPeriodId(periodId);
    const blockId = `block-${Date.now()}`;
    
    const newBlock: Block = {
      id: blockId,
      name: template.name,
      journeyId,
      periodId,
      taskIds: [],
      rules: [],
      dependencyBlockIds: [],
      expectedDurationDays: template.expectedDurationDays,
      description: template.description,
      category: template.category,
      order: blocks.length,
    };
    
    addBlock(newBlock);

    // Add suggested tasks if available
    if (template.suggestedTasks) {
      template.suggestedTasks.forEach((taskTemplate, index) => {
        const task: Task = {
          id: `task-${Date.now()}-${index}`,
          blockId,
          title: taskTemplate.title,
          type: taskTemplate.type,
          assigneeType: taskTemplate.assigneeType,
          order: index,
        };
        addTask(task);
      });
    }

    onBlockCreated(blockId);
    onClose();
    setSelectedCategory(null);
  };

  const handleCreateCustom = () => {
    const blocks = getBlocksByPeriodId(periodId);
    const blockId = `block-${Date.now()}`;
    
    const newBlock: Block = {
      id: blockId,
      name: 'New Block',
      journeyId,
      periodId,
      taskIds: [],
      rules: [],
      dependencyBlockIds: [],
      order: blocks.length,
    };
    
    addBlock(newBlock);
    onBlockCreated(blockId);
    onClose();
    setSelectedCategory(null);
  };

  const filteredTemplates = selectedCategory 
    ? blockTemplates.filter(t => t.category === selectedCategory)
    : blockTemplates;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { onClose(); setSelectedCategory(null); } }}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Block</DialogTitle>
        </DialogHeader>

        <div className="flex gap-4 flex-1 overflow-hidden">
          {/* Categories sidebar */}
          <div className="w-48 flex-shrink-0 border-r border-border pr-4">
            <button
              onClick={() => setSelectedCategory(null)}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-1",
                selectedCategory === null 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              <Layers className="w-4 h-4" />
              All Templates
            </button>
            
            {blockCategories.map((category) => {
              const Icon = category.icon;
              const count = blockTemplates.filter(t => t.category === category.id).length;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={cn(
                    "w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    selectedCategory === category.id 
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    {category.label}
                  </span>
                  <span className="text-xs opacity-70">{count}</span>
                </button>
              );
            })}

            <div className="border-t border-border mt-4 pt-4">
              <button
                onClick={handleCreateCustom}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
              >
                <Plus className="w-4 h-4" />
                Custom Block
              </button>
            </div>
          </div>

          {/* Templates grid */}
          <div className="flex-1 overflow-auto">
            <div className="grid grid-cols-2 gap-3">
              {filteredTemplates.map((template) => {
                const Icon = template.icon;
                return (
                  <button
                    key={template.id}
                    onClick={() => handleSelectTemplate(template)}
                    className="text-left p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "p-2 rounded-lg transition-colors",
                        `bg-[hsl(var(--category-${template.category.toLowerCase()})/0.1)]`
                      )}>
                        <Icon className={cn(
                          "w-5 h-5",
                          `text-[hsl(var(--category-${template.category.toLowerCase()}))]`
                        )} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground text-sm group-hover:text-primary transition-colors">
                          {template.name}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {template.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={cn(
                            "text-[10px] px-2 py-0.5 rounded-full font-medium",
                            `bg-[hsl(var(--category-${template.category.toLowerCase()})/0.1)] text-[hsl(var(--category-${template.category.toLowerCase()}))]`
                          )}>
                            {template.category}
                          </span>
                          {template.suggestedTasks && (
                            <span className="text-[10px] text-muted-foreground">
                              {template.suggestedTasks.length} tasks
                            </span>
                          )}
                          {template.expectedDurationDays && (
                            <span className="text-[10px] text-muted-foreground">
                              {template.expectedDurationDays}d SLA
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
