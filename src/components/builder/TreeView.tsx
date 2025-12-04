import { useCallback, useMemo, useEffect } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  ConnectionMode,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Journey } from '@/types/journey';
import { useJourneyStore } from '@/stores/journeyStore';
import { TimeTriggerNode } from './TimeTriggerNode';
import { BlockNode } from './BlockNode';
import { Button } from '@/components/ui/button';
import { Shuffle, Plus } from 'lucide-react';

interface TreeViewProps {
  journey: Journey;
  onBlockEdit: (blockId: string) => void;
}

const nodeTypes = {
  timeTrigger: TimeTriggerNode,
  block: BlockNode,
};

function TreeViewInner({ journey, onBlockEdit }: TreeViewProps) {
  const { getBlocksByJourneyId } = useJourneyStore();
  const blocks = getBlocksByJourneyId(journey.id);
  const { fitView } = useReactFlow();

  const initialNodes = useMemo(() => {
    const nodes: Node[] = [];
    
    // Add trigger node
    nodes.push({
      id: 'trigger',
      type: 'timeTrigger',
      position: { x: 300, y: 0 },
      data: { journey },
    });

    // Add block nodes organized by period
    const periodBlocks: Record<string, typeof blocks> = {};
    blocks.forEach((block) => {
      if (!periodBlocks[block.periodId]) {
        periodBlocks[block.periodId] = [];
      }
      periodBlocks[block.periodId].push(block);
    });

    let yOffset = 120;
    journey.periods.forEach((period, periodIndex) => {
      const periodBlockList = periodBlocks[period.id] || [];
      periodBlockList.forEach((block, blockIndex) => {
        const xOffset = blockIndex * 320 - ((periodBlockList.length - 1) * 320) / 2 + 300;
        nodes.push({
          id: block.id,
          type: 'block',
          position: block.position || { x: xOffset, y: yOffset },
          data: {
            block,
            onEdit: onBlockEdit,
            stepNumber: periodIndex * 10 + blockIndex + 1,
          },
        });
      });
      yOffset += 200;
    });

    return nodes;
  }, [journey, blocks, onBlockEdit]);

  const initialEdges = useMemo(() => {
    const edges: Edge[] = [];
    
    // Connect trigger to first period blocks
    const firstPeriod = journey.periods[0];
    if (firstPeriod) {
      const firstPeriodBlocks = blocks.filter((b) => b.periodId === firstPeriod.id);
      firstPeriodBlocks.forEach((block) => {
        edges.push({
          id: `trigger-${block.id}`,
          source: 'trigger',
          target: block.id,
          style: { stroke: '#06b6d4', strokeWidth: 2 },
          animated: true,
        });
      });
    }

    // Connect blocks based on dependencies or period order
    blocks.forEach((block) => {
      if (block.dependencyBlockIds.length > 0) {
        block.dependencyBlockIds.forEach((depId) => {
          edges.push({
            id: `${depId}-${block.id}`,
            source: depId,
            target: block.id,
            style: { stroke: '#d1d5db', strokeWidth: 2 },
          });
        });
      }
    });

    // Connect blocks in same period to next period
    journey.periods.forEach((period, idx) => {
      if (idx < journey.periods.length - 1) {
        const currentPeriodBlocks = blocks.filter((b) => b.periodId === period.id);
        const nextPeriod = journey.periods[idx + 1];
        const nextPeriodBlocks = blocks.filter((b) => b.periodId === nextPeriod.id);
        
        currentPeriodBlocks.forEach((currentBlock) => {
          nextPeriodBlocks.forEach((nextBlock) => {
            if (nextBlock.dependencyBlockIds.length === 0) {
              const edgeId = `${currentBlock.id}-${nextBlock.id}`;
              if (!edges.find((e) => e.id === edgeId)) {
                edges.push({
                  id: edgeId,
                  source: currentBlock.id,
                  target: nextBlock.id,
                  style: { stroke: '#d1d5db', strokeWidth: 2 },
                });
              }
            }
          });
        });
      }
    });

    return edges;
  }, [journey, blocks]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const handleAutoLayout = useCallback(() => {
    const newNodes = [...nodes];
    const triggerNode = newNodes.find((n) => n.id === 'trigger');
    if (triggerNode) {
      triggerNode.position = { x: 300, y: 0 };
    }

    let yOffset = 120;
    journey.periods.forEach((period) => {
      const periodNodes = newNodes.filter(
        (n) => n.type === 'block' && blocks.find((b) => b.id === n.id)?.periodId === period.id
      );
      periodNodes.forEach((node, idx) => {
        const xOffset = idx * 320 - ((periodNodes.length - 1) * 320) / 2 + 300;
        node.position = { x: xOffset, y: yOffset };
      });
      yOffset += 200;
    });

    setNodes(newNodes);
    setTimeout(() => fitView({ padding: 0.2 }), 100);
  }, [nodes, setNodes, journey, blocks, fitView]);

  return (
    <div className="w-full h-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.3}
        maxZoom={1.5}
        className="w-full h-full"
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
        <Controls />
      </ReactFlow>

      {/* Action buttons */}
      <div className="absolute top-4 left-4 flex gap-2 z-10">
        <Button variant="outline" size="sm" onClick={handleAutoLayout}>
          <Shuffle className="w-4 h-4 mr-2" />
          Auto-ordenar
        </Button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-card border border-border rounded-lg p-3 text-xs z-10">
        <div className="font-medium mb-2 text-foreground">Leyenda</div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-4 h-0.5 bg-cyan-500" />
          <span className="text-muted-foreground">Conexión desde trigger</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-border" />
          <span className="text-muted-foreground">Dependencia entre bloques</span>
        </div>
      </div>
    </div>
  );
}

export function TreeView(props: TreeViewProps) {
  return (
    <ReactFlowProvider>
      <TreeViewInner {...props} />
    </ReactFlowProvider>
  );
}
