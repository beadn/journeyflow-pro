import { useCallback, useEffect, useMemo } from 'react';
import { Journey } from '@/types/journey';
import { useJourneyStore } from '@/stores/journeyStore';
import { ReactFlow, Node, Edge, Controls, Background, MiniMap, useNodesState, useEdgesState, ConnectionMode, MarkerType, BackgroundVariant } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { BlockNode } from './BlockNode';
import { TimeTriggerNode } from './TimeTriggerNode';
import { ConditionBranchNode } from './ConditionBranchNode';

interface TreeViewProps {
  journey: Journey;
  onBlockEdit: (blockId: string) => void;
}

const nodeTypes: any = { 
  blockNode: BlockNode,
  timeTrigger: TimeTriggerNode,
  conditionBranch: ConditionBranchNode,
};

const NODE_WIDTH = 320;
const NODE_GAP_X = 100;
const NODE_GAP_Y = 150;

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
    let currentY = 50;

    sortedPeriods.forEach((period, periodIndex) => {
      const periodBlocks = getBlocksByPeriodId(period.id);
      
      // Add time trigger node at the start of each period
      const triggerId = periodIndex === 0 ? 'trigger-start' : `trigger-${period.id}`;
      const prevPeriod = periodIndex > 0 ? sortedPeriods[periodIndex - 1] : null;
      const daysDiff = prevPeriod ? period.offsetDays - prevPeriod.offsetDays : 0;
      
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
      
      currentY += 80;

      // Calculate positions for blocks in this period
      const totalWidth = periodBlocks.length * NODE_WIDTH + (periodBlocks.length - 1) * NODE_GAP_X;
      const startX = -totalWidth / 2 + NODE_WIDTH / 2;

      // Check if any block has rules (conditions) - show condition branch
      const blocksWithRules = periodBlocks.filter(b => b.rules.length > 0);
      
      if (blocksWithRules.length > 0 && periodBlocks.length > 1) {
        // Add condition branch node
        const conditionBlock = blocksWithRules[0];
        nodes.push({
          id: `condition-${period.id}`,
          type: 'conditionBranch',
          position: { x: 0, y: currentY },
          data: { 
            label: 'Condition',
            description: 'Define different paths based on conditions',
          },
          draggable: false,
        });
        currentY += 120;
      }

      // Add block nodes for this period
      periodBlocks.forEach((block, blockIndex) => {
        const x = startX + blockIndex * (NODE_WIDTH + NODE_GAP_X);
        const savedPosition = block.position;
        
        nodes.push({
          id: block.id,
          type: 'blockNode',
          position: savedPosition && savedPosition.x !== 0 ? savedPosition : { x, y: currentY },
          data: { 
            block, 
            onEdit: () => onBlockEdit(block.id), 
            metrics: getBlockMetrics(block.id),
            stepNumber: blockIndex + 1,
          },
        });
      });

      if (periodBlocks.length > 0) {
        currentY += NODE_GAP_Y + 100;
      }
    });

    return nodes;
  }, [sortedPeriods, getBlocksByPeriodId, onBlockEdit, getBlockMetrics]);

  // Create edges
  const initialEdges: Edge[] = useMemo(() => {
    const edges: Edge[] = [];
    let prevTriggerId: string | null = null;

    sortedPeriods.forEach((period, periodIndex) => {
      const periodBlocks = getBlocksByPeriodId(period.id);
      const triggerId = periodIndex === 0 ? 'trigger-start' : `trigger-${period.id}`;
      const hasCondition = periodBlocks.some(b => b.rules.length > 0) && periodBlocks.length > 1;
      const conditionId = `condition-${period.id}`;

      // Connect previous trigger to current trigger
      if (prevTriggerId && periodIndex > 0) {
        edges.push({
          id: `${prevTriggerId}-${triggerId}`,
          source: prevTriggerId,
          target: triggerId,
          type: 'smoothstep',
          style: { stroke: '#94a3b8', strokeWidth: 2 },
        });
      }

      if (hasCondition) {
        // Connect trigger to condition
        edges.push({
          id: `${triggerId}-${conditionId}`,
          source: triggerId,
          target: conditionId,
          type: 'smoothstep',
          style: { stroke: '#94a3b8', strokeWidth: 2 },
        });

        // Connect condition to blocks (as branches)
        periodBlocks.forEach((block, idx) => {
          const rule = block.rules[0];
          const branchLabel = rule 
            ? `${rule.condition.attribute} = ${Array.isArray(rule.condition.value) ? rule.condition.value[0] : rule.condition.value}`
            : undefined;

          edges.push({
            id: `${conditionId}-${block.id}`,
            source: conditionId,
            target: block.id,
            type: 'smoothstep',
            sourceHandle: idx === 0 ? 'left' : idx === periodBlocks.length - 1 ? 'right' : 'bottom',
            style: { stroke: '#14b8a6', strokeWidth: 2 },
            label: branchLabel,
            labelStyle: { fontSize: 11, fontWeight: 500, fill: '#64748b' },
            labelBgStyle: { fill: '#ffffff', fillOpacity: 1 },
            labelBgPadding: [8, 4] as [number, number],
            labelBgBorderRadius: 6,
          });
        });
      } else {
        // Connect trigger directly to blocks
        periodBlocks.forEach((block) => {
          const hasDependencyFromOtherPeriod = block.dependencyBlockIds.some(depId => {
            const depBlock = blocks.find(b => b.id === depId);
            return depBlock && depBlock.periodId !== period.id;
          });

          if (!hasDependencyFromOtherPeriod) {
            edges.push({
              id: `${triggerId}-${block.id}`,
              source: triggerId,
              target: block.id,
              type: 'smoothstep',
              style: { stroke: '#94a3b8', strokeWidth: 2 },
            });
          }
        });
      }

      // Set previous trigger
      if (periodBlocks.length > 0) {
        prevTriggerId = periodBlocks[periodBlocks.length - 1].id;
      } else {
        prevTriggerId = triggerId;
      }
    });

    // Add dependency edges between blocks
    blocks.forEach((block) => {
      block.dependencyBlockIds.forEach((depId) => {
        const depBlock = blocks.find(b => b.id === depId);
        if (depBlock && depBlock.periodId !== block.periodId) {
          edges.push({
            id: `dep-${depId}-${block.id}`,
            source: depId,
            target: block.id,
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#8b5cf6', strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#8b5cf6', width: 16, height: 16 },
          });
        }
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
    <div className="w-full h-full relative" style={{ height: 'calc(100vh - 4rem)' }}>
      <ReactFlow 
        nodes={nodes} 
        edges={edges} 
        onNodesChange={onNodesChange} 
        onEdgesChange={onEdgesChange} 
        onNodeDragStop={onNodeDragStop} 
        nodeTypes={nodeTypes} 
        connectionMode={ConnectionMode.Loose} 
        fitView 
        fitViewOptions={{ padding: 0.4 }} 
        className="bg-[#f8fafc]"
        defaultEdgeOptions={{ type: 'smoothstep' }}
        minZoom={0.3}
        maxZoom={1.5}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#e2e8f0" />
        <Controls className="!bg-white !border !border-gray-200 !rounded-lg !shadow-sm" />
        <MiniMap 
          nodeColor={() => '#e2e8f0'}
          maskColor="rgba(255,255,255,0.8)"
          className="!bg-white !border !border-gray-200 !rounded-lg"
        />
      </ReactFlow>
      <button 
        onClick={handleAddBlock} 
        className="absolute bottom-6 right-6 bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-sm hover:shadow-md hover:border-gray-300 transition-all font-medium text-sm z-10"
      >
        + Add Block
      </button>
    </div>
  );
}
