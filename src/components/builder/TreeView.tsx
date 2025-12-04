import { useCallback, useEffect, useMemo } from 'react';
import { Journey } from '@/types/journey';
import { useJourneyStore } from '@/stores/journeyStore';
import { ReactFlow, Node, Edge, Controls, Background, useNodesState, useEdgesState, ConnectionMode, MarkerType, BackgroundVariant } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { BlockNode } from './BlockNode';
import { TimeTriggerNode } from './TimeTriggerNode';

interface TreeViewProps {
  journey: Journey;
  onBlockEdit: (blockId: string) => void;
}

const nodeTypes: any = { 
  blockNode: BlockNode,
  timeTrigger: TimeTriggerNode,
};

const NODE_WIDTH = 300;
const NODE_HEIGHT = 200;
const HORIZONTAL_GAP = 80;
const VERTICAL_GAP = 120;
const TRIGGER_HEIGHT = 60;

export function TreeView({ journey, onBlockEdit }: TreeViewProps) {
  const { getBlocksByJourneyId, getBlocksByPeriodId, updateBlockPosition, addBlock, getBlockMetrics } = useJourneyStore();
  const blocks = getBlocksByJourneyId(journey.id);
  
  // Sort periods by offsetDays
  const sortedPeriods = useMemo(() => 
    [...journey.periods].sort((a, b) => a.offsetDays - b.offsetDays),
    [journey.periods]
  );

  // Calculate node positions - vertical layout with periods as rows
  const initialNodes: Node[] = useMemo(() => {
    const nodes: Node[] = [];
    let currentY = 0;

    sortedPeriods.forEach((period, periodIndex) => {
      const periodBlocks = getBlocksByPeriodId(period.id);
      
      // Add time trigger node at the start of each period (except first)
      if (periodIndex > 0) {
        const prevPeriod = sortedPeriods[periodIndex - 1];
        const daysDiff = period.offsetDays - prevPeriod.offsetDays;
        
        nodes.push({
          id: `trigger-${period.id}`,
          type: 'timeTrigger',
          position: { x: 0, y: currentY },
          data: { 
            label: period.label,
            daysDiff,
            offsetDays: period.offsetDays,
          },
          draggable: false,
        });
        currentY += TRIGGER_HEIGHT + 40;
      } else {
        // First period - add start trigger
        nodes.push({
          id: `trigger-start`,
          type: 'timeTrigger',
          position: { x: 0, y: currentY },
          data: { 
            label: period.label,
            daysDiff: 0,
            offsetDays: period.offsetDays,
            isStart: true,
          },
          draggable: false,
        });
        currentY += TRIGGER_HEIGHT + 40;
      }

      // Calculate total width needed for this period's blocks
      const totalBlocksWidth = periodBlocks.length * NODE_WIDTH + (periodBlocks.length - 1) * HORIZONTAL_GAP;
      const startX = -totalBlocksWidth / 2;

      // Add block nodes for this period - all at the same Y level
      periodBlocks.forEach((block, blockIndex) => {
        const x = startX + blockIndex * (NODE_WIDTH + HORIZONTAL_GAP);
        
        nodes.push({
          id: block.id,
          type: 'blockNode',
          position: block.position || { x, y: currentY },
          data: { 
            block, 
            onEdit: () => onBlockEdit(block.id), 
            metrics: getBlockMetrics(block.id) 
          },
        });
      });

      // Move Y for next period
      if (periodBlocks.length > 0) {
        currentY += NODE_HEIGHT + VERTICAL_GAP;
      }
    });

    return nodes;
  }, [sortedPeriods, getBlocksByPeriodId, onBlockEdit, getBlockMetrics]);

  // Create edges for dependencies and time triggers
  const initialEdges: Edge[] = useMemo(() => {
    const edges: Edge[] = [];

    // Add edges from time triggers to blocks in that period
    sortedPeriods.forEach((period, periodIndex) => {
      const periodBlocks = getBlocksByPeriodId(period.id);
      const triggerId = periodIndex === 0 ? 'trigger-start' : `trigger-${period.id}`;

      // Connect trigger to all blocks in this period that have no dependencies in same period
      periodBlocks.forEach((block) => {
        const hasDependencyInSamePeriod = block.dependencyBlockIds.some(depId => {
          const depBlock = blocks.find(b => b.id === depId);
          return depBlock?.periodId === period.id;
        });

        if (!hasDependencyInSamePeriod) {
          edges.push({
            id: `${triggerId}-${block.id}`,
            source: triggerId,
            target: block.id,
            type: 'smoothstep',
            animated: false,
            style: { stroke: 'hsl(var(--muted-foreground))', strokeWidth: 2, strokeDasharray: '5,5' },
          });
        }
      });
    });

    // Add dependency edges between blocks
    blocks.forEach((block) => {
      block.dependencyBlockIds.forEach((depId) => {
        edges.push({
          id: `dep-${depId}-${block.id}`,
          source: depId,
          target: block.id,
          type: 'smoothstep',
          animated: true,
          style: { stroke: 'hsl(var(--accent))', strokeWidth: 3 },
          markerEnd: { type: MarkerType.ArrowClosed, color: 'hsl(var(--accent))', width: 20, height: 20 },
          label: 'requires',
          labelStyle: { fontSize: 10, fontWeight: 600, fill: 'hsl(var(--muted-foreground))' },
          labelBgStyle: { fill: 'hsl(var(--card))', fillOpacity: 0.9 },
          labelBgPadding: [6, 4] as [number, number],
          labelBgBorderRadius: 4,
        });
      });
    });

    return edges;
  }, [sortedPeriods, blocks, getBlocksByPeriodId]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => { setNodes(initialNodes); setEdges(initialEdges); }, [blocks.length, journey.periods.length]);

  const onNodeDragStop = useCallback((_: any, node: Node) => { 
    if (node.type === 'blockNode') {
      updateBlockPosition(node.id, node.position); 
    }
  }, [updateBlockPosition]);

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
    <div className="w-full h-full" style={{ height: 'calc(100vh - 4rem)' }}>
      <ReactFlow 
        nodes={nodes} 
        edges={edges} 
        onNodesChange={onNodesChange} 
        onEdgesChange={onEdgesChange} 
        onNodeDragStop={onNodeDragStop} 
        nodeTypes={nodeTypes} 
        connectionMode={ConnectionMode.Loose} 
        fitView 
        fitViewOptions={{ padding: 0.3 }} 
        className="bg-canvas-bg"
        defaultEdgeOptions={{
          type: 'smoothstep',
        }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="hsl(var(--canvas-dot))" />
        <Controls className="!bg-card !border-border !shadow-factorial" />
      </ReactFlow>
      <button onClick={handleAddBlock} className="absolute bottom-6 right-6 btn-primary flex items-center gap-2 shadow-factorial-lg z-10">+ Add Block</button>
    </div>
  );
}
