import { useCallback, useEffect, useMemo } from 'react';
import { Journey, Block } from '@/types/journey';
import { useJourneyStore } from '@/stores/journeyStore';
import { ReactFlow, Node, Edge, Controls, Background, useNodesState, useEdgesState, ConnectionMode, MarkerType, BackgroundVariant } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { BlockNode } from './BlockNode';

interface TreeViewProps {
  journey: Journey;
  onBlockEdit: (blockId: string) => void;
}

const nodeTypes: any = { blockNode: BlockNode };

export function TreeView({ journey, onBlockEdit }: TreeViewProps) {
  const { getBlocksByJourneyId, updateBlockPosition, addBlock, getBlockMetrics } = useJourneyStore();
  const blocks = getBlocksByJourneyId(journey.id);
  
  const initialNodes: Node[] = useMemo(() => 
    blocks.map((block, index) => ({
      id: block.id,
      type: 'blockNode',
      position: block.position || { x: 200 * (index % 4), y: 150 * Math.floor(index / 4) },
      data: { block, onEdit: () => onBlockEdit(block.id), metrics: getBlockMetrics(block.id) },
    })), [blocks, onBlockEdit, getBlockMetrics]
  );

  const initialEdges: Edge[] = useMemo(() => 
    blocks.flatMap((block) =>
      block.dependencyBlockIds.map((depId) => ({
        id: `${depId}-${block.id}`,
        source: depId,
        target: block.id,
        type: 'smoothstep',
        animated: true,
        style: { stroke: 'hsl(var(--muted-foreground))', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: 'hsl(var(--muted-foreground))' },
      }))
    ), [blocks]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => { setNodes(initialNodes); setEdges(initialEdges); }, [blocks.length]);

  const onNodeDragStop = useCallback((_: any, node: Node) => { updateBlockPosition(node.id, node.position); }, [updateBlockPosition]);

  const handleAddBlock = useCallback(() => {
    const newBlock: Block = { id: `block-${Date.now()}`, name: 'New Block', journeyId: journey.id, periodId: journey.periods[0]?.id || '', taskIds: [], rules: [], dependencyBlockIds: [], order: blocks.length, position: { x: 100, y: 100 + blocks.length * 150 } };
    addBlock(newBlock);
    onBlockEdit(newBlock.id);
  }, [journey, blocks, addBlock, onBlockEdit]);

  return (
    <div className="w-full h-full" style={{ height: 'calc(100vh - 4rem)' }}>
      <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onNodeDragStop={onNodeDragStop} nodeTypes={nodeTypes} connectionMode={ConnectionMode.Loose} fitView fitViewOptions={{ padding: 0.2 }} className="bg-canvas-bg">
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="hsl(var(--canvas-dot))" />
        <Controls className="!bg-card !border-border !shadow-factorial" />
      </ReactFlow>
      <button onClick={handleAddBlock} className="absolute bottom-6 right-6 btn-primary flex items-center gap-2 shadow-factorial-lg z-10">+ Add Block</button>
    </div>
  );
}
