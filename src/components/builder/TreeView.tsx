import { useCallback, useEffect, useMemo, useState } from 'react';
import { Journey } from '@/types/journey';
import { useJourneyStore } from '@/stores/journeyStore';
import { ReactFlow, ReactFlowProvider, Node, Edge, Controls, Background, useNodesState, useEdgesState, MarkerType, BackgroundVariant } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { BlockNode } from './BlockNode';
import { TimeTriggerNode } from './TimeTriggerNode';
import { AddBlockModal } from './AddBlockModal';
import { LayoutGrid, Plus } from 'lucide-react';

interface TreeViewProps {
  journey: Journey;
  onBlockEdit: (blockId: string) => void;
}

const nodeTypes: any = { 
  blockNode: BlockNode,
  timeTrigger: TimeTriggerNode,
};

const NODE_WIDTH = 300;
const NODE_HEIGHT = 160;
const HORIZONTAL_GAP = 80;
const VERTICAL_GAP = 140;
const TRIGGER_HEIGHT = 80;

// Custom edge style - using direct colors for ReactFlow compatibility
const cyanEdgeStyle = {
  stroke: '#06b6d4',
  strokeWidth: 2,
};

const grayEdgeStyle = {
  stroke: '#d1d5db',
  strokeWidth: 2,
  strokeDasharray: '6,6',
};

export function TreeView({ journey, onBlockEdit }: TreeViewProps) {
  const { getBlocksByJourneyId, getBlocksByPeriodId, updateBlockPosition } = useJourneyStore();
  const blocks = getBlocksByJourneyId(journey.id);
  const [addBlockModal, setAddBlockModal] = useState(false);
  
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

      // Connect to previous trigger with dashed gray line
      if (prevTriggerId) {
        edges.push({
          id: `edge-${prevTriggerId}-${triggerId}`,
          source: prevTriggerId,
          target: triggerId,
          type: 'smoothstep',
          style: grayEdgeStyle,
          animated: false,
        });
      }

      currentY += TRIGGER_HEIGHT + 60;

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

          // Connect trigger to each block with cyan line
          edges.push({
            id: `edge-${triggerId}-${block.id}`,
            source: triggerId,
            target: block.id,
            type: 'smoothstep',
            style: cyanEdgeStyle,
            markerEnd: { 
              type: MarkerType.ArrowClosed, 
              color: '#22d3ee', 
              width: 14, 
              height: 14 
            },
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
          style: { stroke: '#f97316', strokeWidth: 2 },
          markerEnd: { 
            type: MarkerType.ArrowClosed, 
            color: '#f97316', 
            width: 12, 
            height: 12 
          },
          label: 'depende de',
          labelStyle: { fontSize: 10, fill: '#9ca3af', fontWeight: 500 },
          labelBgStyle: { fill: 'white', fillOpacity: 0.9 },
          labelBgPadding: [6, 4] as [number, number],
          labelBgBorderRadius: 6,
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

  const handleBlockCreated = useCallback((blockId: string) => {
    onBlockEdit(blockId);
  }, [onBlockEdit]);

  return (
    <div className="w-full h-full relative bg-slate-50" style={{ minHeight: '500px' }}>
      <ReactFlowProvider>
        <ReactFlow 
          nodes={nodes} 
          edges={edges} 
          onNodesChange={onNodesChange} 
          onEdgesChange={onEdgesChange} 
          onNodeDragStop={onNodeDragStop} 
          nodeTypes={nodeTypes}
          fitView 
          fitViewOptions={{ padding: 0.4 }} 
          defaultEdgeOptions={{ 
            type: 'smoothstep',
            style: cyanEdgeStyle,
          }}
          minZoom={0.3}
          maxZoom={1.5}
          proOptions={{ hideAttribution: true }}
          className="w-full h-full"
        >
          <Background 
            variant={BackgroundVariant.Dots} 
            gap={24} 
            size={1} 
            color="#cbd5e1"
          />
          <Controls className="!bg-white !border !border-gray-200 !rounded-lg !shadow-sm" />
        </ReactFlow>
      </ReactFlowProvider>
      
      {/* Action buttons */}
      <div className="absolute bottom-6 right-6 flex gap-3 z-10">
        <button 
          onClick={handleAutoLayout} 
          className="bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-md hover:shadow-lg hover:bg-gray-50 transition-all font-medium text-sm"
        >
          <LayoutGrid className="w-4 h-4" />
          Auto-ordenar
        </button>
        <button 
          onClick={() => setAddBlockModal(true)} 
          className="bg-primary text-primary-foreground px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-lg hover:bg-primary/90 transition-all font-semibold text-sm"
        >
          <Plus className="w-4 h-4" />
          Añadir bloque
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-6 left-6 bg-white border border-gray-200 rounded-lg shadow-md p-3 z-10">
        <div className="text-xs font-semibold text-gray-700 mb-2">Leyenda</div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 bg-cyan-500 rounded"></div>
            <span className="text-xs text-gray-500">Flujo principal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 bg-gray-300 rounded"></div>
            <span className="text-xs text-gray-500">Conexión temporal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 bg-orange-500 rounded"></div>
            <span className="text-xs text-gray-500">Dependencia</span>
          </div>
        </div>
      </div>

      {/* Add Block Modal */}
      <AddBlockModal
        isOpen={addBlockModal}
        onClose={() => setAddBlockModal(false)}
        journeyId={journey.id}
        periodId={journey.periods[0]?.id || ''}
        onBlockCreated={handleBlockCreated}
      />
    </div>
  );
}