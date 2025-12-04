import { useCallback, useEffect, useMemo } from 'react';
import { Journey } from '@/types/journey';
import { useJourneyStore } from '@/stores/journeyStore';
import { ReactFlow, ReactFlowProvider, Node, Edge, Controls, Background, useNodesState, useEdgesState, MarkerType, BackgroundVariant } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { BlockNode } from './BlockNode';
import { TimeTriggerNode } from './TimeTriggerNode';
import { LayoutGrid } from 'lucide-react';

interface TreeViewProps {
  journey: Journey;
  onBlockEdit: (blockId: string) => void;
}

const nodeTypes: any = { 
  blockNode: BlockNode,
  timeTrigger: TimeTriggerNode,
};

const NODE_WIDTH = 280;
const NODE_HEIGHT = 120;
const HORIZONTAL_GAP = 60;
const VERTICAL_GAP = 100;
const TRIGGER_HEIGHT = 50;

export function TreeView({ journey, onBlockEdit }: TreeViewProps) {
  const { getBlocksByJourneyId, getBlocksByPeriodId, updateBlockPosition, addBlock } = useJourneyStore();
  const blocks = getBlocksByJourneyId(journey.id);
  
  const sortedPeriods = useMemo(() => 
    [...journey.periods].sort((a, b) => a.offsetDays - b.offsetDays),
    [journey.periods]
  );

  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    
    let currentY = 0;
    let prevTriggerId: string | null = null;

    sortedPeriods.forEach((period, periodIndex) => {
      const periodBlocks = getBlocksByPeriodId(period.id);
      const triggerId = `trigger-${period.id}`;
      
      // Calculate days from previous period
      const prevPeriod = periodIndex > 0 ? sortedPeriods[periodIndex - 1] : null;
      const daysDiff = prevPeriod ? period.offsetDays - prevPeriod.offsetDays : period.offsetDays;
      
      // Add time trigger node - centered at x=0
      nodes.push({
        id: triggerId,
        type: 'timeTrigger',
        position: { x: 0, y: currentY },
        data: { 
          label: period.label,
          daysDiff,
          offsetDays: period.offsetDays,
          isStart: periodIndex === 0,
        },
        draggable: false,
      });

      // Connect to previous trigger
      if (prevTriggerId) {
        edges.push({
          id: `edge-${prevTriggerId}-${triggerId}`,
          source: prevTriggerId,
          target: triggerId,
          type: 'smoothstep',
          style: { stroke: 'hsl(var(--muted-foreground))', strokeWidth: 2, strokeDasharray: '5,5' },
        });
      }

      currentY += TRIGGER_HEIGHT + 40;

      // Position blocks horizontally centered under their trigger
      if (periodBlocks.length > 0) {
        const totalWidth = periodBlocks.length * NODE_WIDTH + (periodBlocks.length - 1) * HORIZONTAL_GAP;
        const startX = -totalWidth / 2;

        periodBlocks.forEach((block, blockIndex) => {
          const x = startX + blockIndex * (NODE_WIDTH + HORIZONTAL_GAP);
          
          nodes.push({
            id: block.id,
            type: 'blockNode',
            position: { x, y: currentY },
            data: { 
              block, 
              onEdit: () => onBlockEdit(block.id), 
              stepNumber: blockIndex + 1,
            },
            draggable: true,
          });

          // Connect trigger to each block
          edges.push({
            id: `edge-${triggerId}-${block.id}`,
            source: triggerId,
            target: block.id,
            type: 'smoothstep',
            style: { stroke: 'hsl(var(--primary))', strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: 'hsl(var(--primary))', width: 12, height: 12 },
          });
        });

        currentY += NODE_HEIGHT + VERTICAL_GAP;
      }

      // Last element to connect to next trigger
      prevTriggerId = periodBlocks.length > 0 ? periodBlocks[periodBlocks.length - 1].id : triggerId;
    });

    // Add dependency edges between blocks (cross-period dependencies)
    blocks.forEach((block) => {
      block.dependencyBlockIds.forEach((depId) => {
        edges.push({
          id: `dep-${depId}-${block.id}`,
          source: depId,
          target: block.id,
          type: 'smoothstep',
          animated: true,
          style: { stroke: 'hsl(var(--destructive))', strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: 'hsl(var(--destructive))', width: 12, height: 12 },
          label: 'depends on',
          labelStyle: { fontSize: 10, fill: 'hsl(var(--muted-foreground))' },
          labelBgStyle: { fill: 'hsl(var(--background))' },
          labelBgPadding: [4, 2] as [number, number],
          labelBgBorderRadius: 4,
        });
      });
    });

    return { nodes, edges };
  }, [sortedPeriods, blocks, getBlocksByPeriodId, onBlockEdit]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => { 
    setNodes(initialNodes); 
    setEdges(initialEdges); 
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const onNodeDragStop = useCallback((_: any, node: Node) => { 
    if (node.type === 'blockNode') {
      updateBlockPosition(node.id, node.position); 
    }
  }, [updateBlockPosition]);

  const handleAutoLayout = useCallback(() => {
    // Reset all block positions to force recalculation
    blocks.forEach(block => {
      updateBlockPosition(block.id, { x: 0, y: 0 });
    });
    // Re-apply initial layout
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [blocks, initialNodes, initialEdges, setNodes, setEdges, updateBlockPosition]);

  const handleAddBlock = useCallback(() => {
    const newBlock = {
      id: `block-${Date.now()}`, 
      name: 'New Block', 
      journeyId: journey.id, 
      periodId: journey.periods[0]?.id || '', 
      taskIds: [], 
      rules: [], 
      dependencyBlockIds: [], 
      order: blocks.length, 
      position: { x: 0, y: 100 + blocks.length * 150 } 
    };
    addBlock(newBlock);
    onBlockEdit(newBlock.id);
  }, [journey, blocks, addBlock, onBlockEdit]);

  return (
    <ReactFlowProvider>
      <div className="w-full h-full relative">
        <ReactFlow 
          nodes={nodes} 
          edges={edges} 
          onNodesChange={onNodesChange} 
          onEdgesChange={onEdgesChange} 
          onNodeDragStop={onNodeDragStop} 
          nodeTypes={nodeTypes}
          fitView 
          fitViewOptions={{ padding: 0.3 }} 
          className="bg-muted/30"
          defaultEdgeOptions={{ type: 'smoothstep' }}
          minZoom={0.4}
          maxZoom={1.5}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} className="opacity-50" />
          <Controls className="!bg-background !border !border-border !rounded-lg !shadow-sm" />
        </ReactFlow>
        <div className="absolute bottom-6 right-6 flex gap-2 z-10">
          <button 
            onClick={handleAutoLayout} 
            className="bg-background border border-border text-foreground px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-sm hover:bg-muted transition-all font-medium text-sm"
          >
            <LayoutGrid className="w-4 h-4" />
            Auto-ordenar
          </button>
          <button 
            onClick={handleAddBlock} 
            className="bg-primary text-primary-foreground px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-md hover:bg-primary/90 transition-all font-medium text-sm"
          >
            + Add Block
          </button>
        </div>
      </div>
    </ReactFlowProvider>
  );
}
