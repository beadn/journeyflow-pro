import { useState } from 'react';
import { Period, Block } from '@/types/journey';
import { useJourneyStore } from '@/stores/journeyStore';
import { BlockCard } from './BlockCard';
import { cn } from '@/lib/utils';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import { Plus, GripVertical, Trash2 } from 'lucide-react';

interface PeriodColumnProps {
  period: Period;
  journeyId: string;
  blocks: Block[];
  layout: 'horizontal' | 'vertical';
  onBlockEdit: (blockId: string) => void;
  onAddBlock: () => void;
}

export function PeriodColumn({
  period,
  journeyId,
  blocks,
  layout,
  onBlockEdit,
  onAddBlock,
}: PeriodColumnProps) {
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [isEditingOffset, setIsEditingOffset] = useState(false);
  const { updatePeriod, deletePeriod } = useJourneyStore();

  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: period.id });

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: period.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleLabelChange = (label: string) => {
    updatePeriod(journeyId, period.id, { label });
  };

  const handleOffsetChange = (offsetDays: number) => {
    updatePeriod(journeyId, period.id, { offsetDays });
  };

  const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order);

  return (
    <div
      ref={(node) => {
        setSortableRef(node);
        setDroppableRef(node);
      }}
      style={style}
      className={cn(
        "timeline-period bg-card rounded-xl border border-border",
        layout === 'horizontal' ? 'min-w-[300px] w-[300px]' : 'w-full',
        isDragging && 'opacity-50',
        isOver && 'ring-2 ring-accent'
      )}
    >
      {/* Period Header */}
      <div className="p-4 border-b border-border flex items-center gap-2">
        <button
          {...attributes}
          {...listeners}
          className="p-1 hover:bg-muted rounded cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </button>

        <div className="flex-1">
          {isEditingLabel ? (
            <input
              type="text"
              value={period.label}
              onChange={(e) => handleLabelChange(e.target.value)}
              onBlur={() => setIsEditingLabel(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditingLabel(false)}
              autoFocus
              className="w-full h-7 px-2 rounded border border-border bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring"
            />
          ) : (
            <button
              onClick={() => setIsEditingLabel(true)}
              className="text-sm font-semibold text-foreground hover:text-accent transition-colors"
            >
              {period.label}
            </button>
          )}

          {isEditingOffset ? (
            <div className="flex items-center gap-1 mt-1">
              <input
                type="number"
                value={period.offsetDays}
                onChange={(e) => handleOffsetChange(parseInt(e.target.value) || 0)}
                onBlur={() => setIsEditingOffset(false)}
                onKeyDown={(e) => e.key === 'Enter' && setIsEditingOffset(false)}
                autoFocus
                className="w-16 h-6 px-2 rounded border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <span className="text-xs text-muted-foreground">days</span>
            </div>
          ) : (
            <button
              onClick={() => setIsEditingOffset(true)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {period.offsetDays >= 0 ? '+' : ''}{period.offsetDays} days from anchor
            </button>
          )}
        </div>

        <button
          onClick={() => deletePeriod(journeyId, period.id)}
          className="p-1.5 hover:bg-danger/10 rounded-lg transition-colors group"
        >
          <Trash2 className="w-4 h-4 text-muted-foreground group-hover:text-danger" />
        </button>
      </div>

      {/* Blocks */}
      <div className="p-3 space-y-3 min-h-[200px]">
        {sortedBlocks.map((block) => (
          <BlockCard
            key={block.id}
            block={block}
            onEdit={() => onBlockEdit(block.id)}
          />
        ))}

        <button
          onClick={onAddBlock}
          className="w-full flex items-center justify-center gap-2 p-4 rounded-lg border border-dashed border-border text-muted-foreground hover:border-accent hover:text-accent transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm">Add Block</span>
        </button>
      </div>
    </div>
  );
}
