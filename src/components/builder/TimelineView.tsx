import { useState, useCallback } from 'react';
import { Journey, Block, Period } from '@/types/journey';
import { useJourneyStore } from '@/stores/journeyStore';
import { BlockCard } from './BlockCard';
import { PeriodColumn } from './PeriodColumn';
import { AddBlockModal } from './AddBlockModal';
import { cn } from '@/lib/utils';
import { ArrowRightLeft, ArrowUpDown } from 'lucide-react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';

interface TimelineViewProps {
  journey: Journey;
  onBlockEdit: (blockId: string) => void;
}

export function TimelineView({ journey, onBlockEdit }: TimelineViewProps) {
  const [layout, setLayout] = useState<'horizontal' | 'vertical'>('horizontal');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [addBlockModal, setAddBlockModal] = useState<{ isOpen: boolean; periodId: string | null }>({
    isOpen: false,
    periodId: null,
  });
  
  const { 
    getBlocksByPeriodId, 
    moveBlockToPeriod, 
    reorderPeriods,
    addPeriod,
  } = useJourneyStore();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Check if dragging a block to a period
    if (activeId.startsWith('block-') && overId.startsWith('period-')) {
      moveBlockToPeriod(activeId, overId);
    }

    // Check if reordering periods
    if (activeId.startsWith('period-') && overId.startsWith('period-')) {
      const oldIndex = journey.periods.findIndex((p) => p.id === activeId);
      const newIndex = journey.periods.findIndex((p) => p.id === overId);
      
      if (oldIndex !== newIndex) {
        const newPeriods = [...journey.periods];
        const [removed] = newPeriods.splice(oldIndex, 1);
        newPeriods.splice(newIndex, 0, removed);
        newPeriods.forEach((p, i) => (p.order = i));
        reorderPeriods(journey.id, newPeriods);
      }
    }
  };

  const handleAddBlock = useCallback((periodId: string) => {
    setAddBlockModal({ isOpen: true, periodId });
  }, []);

  const handleBlockCreated = useCallback((blockId: string) => {
    onBlockEdit(blockId);
  }, [onBlockEdit]);

  const handleAddPeriod = useCallback(() => {
    const newPeriod: Period = {
      id: `period-${Date.now()}`,
      label: 'New Period',
      offsetDays: journey.periods.length > 0 
        ? Math.max(...journey.periods.map((p) => p.offsetDays)) + 7 
        : 0,
      order: journey.periods.length,
    };
    addPeriod(journey.id, newPeriod);
  }, [journey, addPeriod]);

  const sortedPeriods = [...journey.periods].sort((a, b) => a.order - b.order);

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="px-6 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Layout toggle - compact icon-only design */}
          <div className="flex items-center gap-1.5 bg-card rounded-lg p-1 border border-border shadow-sm">
            <button
              onClick={() => setLayout('horizontal')}
              title="Disposición horizontal"
              className={cn(
                "p-1.5 rounded-md transition-all",
                layout === 'horizontal' 
                  ? "bg-gray-900 text-white shadow-sm" 
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              )}
            >
              <ArrowRightLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setLayout('vertical')}
              title="Disposición vertical"
              className={cn(
                "p-1.5 rounded-md transition-all",
                layout === 'vertical' 
                  ? "bg-gray-900 text-white shadow-sm" 
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              )}
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>
          
          <span className="text-xs text-muted-foreground">
            {layout === 'horizontal' ? 'Horizontal' : 'Vertical'}
          </span>
        </div>
        
        <button
          onClick={handleAddPeriod}
          className="btn-secondary text-sm"
        >
          + Add Period
        </button>
      </div>

      {/* Timeline */}
      <div className={cn(
        "flex-1 overflow-auto p-6 custom-scrollbar",
        layout === 'horizontal' ? "overflow-x-auto" : "overflow-y-auto"
      )}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sortedPeriods.map((p) => p.id)}
            strategy={horizontalListSortingStrategy}
          >
            <div className={cn(
              "flex gap-4",
              layout === 'vertical' && "flex-col"
            )}>
              {sortedPeriods.map((period) => {
                const blocks = getBlocksByPeriodId(period.id);
                return (
                  <PeriodColumn
                    key={period.id}
                    period={period}
                    journeyId={journey.id}
                    blocks={blocks}
                    layout={layout}
                    onBlockEdit={onBlockEdit}
                    onAddBlock={() => handleAddBlock(period.id)}
                  />
                );
              })}
            </div>
          </SortableContext>

          <DragOverlay>
            {activeId && activeId.startsWith('block-') && (
              <div className="opacity-80">
                <BlockCard
                  block={useJourneyStore.getState().blocks.find((b) => b.id === activeId)!}
                  onEdit={() => {}}
                />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Add Block Modal */}
      {addBlockModal.periodId && (
        <AddBlockModal
          isOpen={addBlockModal.isOpen}
          onClose={() => setAddBlockModal({ isOpen: false, periodId: null })}
          journeyId={journey.id}
          periodId={addBlockModal.periodId}
          onBlockCreated={handleBlockCreated}
        />
      )}
    </div>
  );
}
