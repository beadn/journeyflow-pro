import { useState, useMemo, useCallback } from 'react';
import { Block, Task, BlockRule } from '@/types/journey';
import { useJourneyStore } from '@/stores/journeyStore';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Plus, Trash2, GripVertical, List, GitBranch, Users, Bell, Link2, Settings, Diamond, FileText, Layers, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { blockTemplates } from '@/lib/blockTemplates';
import {
  ReactFlow,
  ReactFlowProvider,
  Node,
  Edge,
  Handle,
  Position,
  Background,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

interface BlockEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  blockId: string | null;
}

type TreeNodeSelection = 'block' | 'decision' | `rule-${string}`;

// Custom node components for ReactFlow
const TasksNode = ({ data }: { data: { tasks: Task[]; selected: boolean; onClick: () => void } }) => (
  <div 
    onClick={data.onClick}
    className={cn(
      "bg-white rounded-xl shadow-sm border text-left transition-all min-w-[260px] max-w-[300px] cursor-pointer hover:scale-[1.02]",
      data.selected
        ? "border-cyan-400 ring-2 ring-cyan-200 shadow-lg"
        : "border-gray-200 hover:shadow-md hover:border-gray-300"
    )}
  >
    <Handle type="source" position={Position.Bottom} className="!bg-cyan-400 !w-3 !h-3 !border-2 !border-white" />
    <div className="p-4">
      <div className="flex items-center gap-2 mb-1">
        <FileText className="w-4 h-4 text-cyan-500" />
        <div className="text-sm font-semibold text-gray-900">{data.tasks.length} tasks</div>
      </div>
      <div className="text-xs text-gray-500 mb-3">Base tasks of the block</div>
      <div className="space-y-2">
        {data.tasks.slice(0, 3).map((task) => (
          <div key={task.id} className="flex items-start gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0" />
            <div className="text-xs text-gray-700 truncate">{task.title}</div>
          </div>
        ))}
        {data.tasks.length > 3 && (
          <div className="text-xs text-gray-400 pl-4">+{data.tasks.length - 3} more...</div>
        )}
      </div>
    </div>
  </div>
);

const ConditionNode = ({ data }: { data: { selected: boolean; onClick: () => void; rulesCount: number } }) => (
  <div 
    onClick={data.onClick}
    className={cn(
      "bg-white rounded-xl shadow-sm border text-left transition-all min-w-[240px] cursor-pointer relative",
      data.selected
        ? "border-cyan-400 ring-2 ring-cyan-200 shadow-md"
        : "border-gray-200 hover:shadow-md hover:border-gray-300"
    )}
  >
    <Handle type="target" position={Position.Top} className="!bg-cyan-400 !w-3 !h-3 !border-2 !border-white" />
    <Handle type="source" position={Position.Bottom} className="!bg-cyan-400 !w-3 !h-3 !border-2 !border-white" />
    <div className="absolute -top-3 left-4">
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-700 text-xs font-medium">
        <Diamond className="w-3 h-3" />
        Condition
      </span>
    </div>
    <div className="p-4 pt-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-gray-900">Audience Rules</div>
          <div className="text-xs text-gray-500">{data.rulesCount} rule{data.rulesCount !== 1 ? 's' : ''} defined</div>
        </div>
        <Users className="w-5 h-5 text-cyan-400" />
      </div>
    </div>
  </div>
);

const RuleNode = ({ data }: { data: { rule: BlockRule; selected: boolean; onClick: () => void } }) => (
  <div 
    onClick={data.onClick}
    className={cn(
      "bg-white rounded-xl shadow-sm border text-left transition-all min-w-[220px] max-w-[260px] cursor-pointer",
      data.selected
        ? "border-cyan-400 ring-2 ring-cyan-200 shadow-md"
        : "border-gray-200 hover:shadow-md hover:border-gray-300"
    )}
  >
    <Handle type="target" position={Position.Top} className="!bg-cyan-400 !w-3 !h-3 !border-2 !border-white" />
    <Handle type="source" position={Position.Bottom} className="!bg-cyan-400 !w-3 !h-3 !border-2 !border-white" />
    <div className="p-3">
      <div className="text-xs text-gray-600 mb-2">
        <span className="font-medium text-cyan-600">IF</span>
        <span className="capitalize"> {data.rule.condition.attribute}</span>
        <span className="text-gray-400"> = </span>
        <span className="text-cyan-600 font-medium">
          {typeof data.rule.condition.value === 'string' ? data.rule.condition.value || '...' : '...'}
        </span>
      </div>
      <div className="text-xs text-gray-500 font-medium">
        → {data.rule.action.type === 'add_task' ? 'Add tasks' : 'Add block'}
      </div>
    </div>
  </div>
);

// Node to show added tasks from a rule
const AddedTasksNode = ({ data }: { data: { tasks: Partial<Task>[]; blockTemplateName?: string; actionType: string } }) => (
  <div className="bg-emerald-50 rounded-xl shadow-sm border border-emerald-200 min-w-[200px] max-w-[240px]">
    <Handle type="target" position={Position.Top} className="!bg-emerald-400 !w-3 !h-3 !border-2 !border-white" />
    <div className="p-3">
      {data.actionType === 'add_task' ? (
        <>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 rounded bg-emerald-100 flex items-center justify-center">
              <FileText className="w-3 h-3 text-emerald-600" />
            </div>
            <span className="text-xs font-semibold text-emerald-700">
              {data.tasks.length} task{data.tasks.length !== 1 ? 's' : ''} added
            </span>
          </div>
          <div className="space-y-1">
            {data.tasks.slice(0, 3).map((task, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs text-emerald-600">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="truncate">{task.title || 'Untitled'}</span>
              </div>
            ))}
            {data.tasks.length > 3 && (
              <div className="text-xs text-emerald-500 pl-3">+{data.tasks.length - 3} more</div>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-5 h-5 rounded bg-emerald-100 flex items-center justify-center">
              <Layers className="w-3 h-3 text-emerald-600" />
            </div>
            <span className="text-xs font-semibold text-emerald-700">Added block</span>
          </div>
          <div className="text-xs text-emerald-600 truncate">
            {data.blockTemplateName || 'Not selected'}
          </div>
        </>
      )}
    </div>
  </div>
);

const AddRuleNode = ({ data }: { data: { onClick: () => void } }) => {
  return (
    <div className="relative nopan nodrag nowheel" style={{ pointerEvents: 'all' }}>
      <Handle type="target" position={Position.Top} className="!bg-cyan-400 !w-2 !h-2 !border-2 !border-white !-top-1" />
      <Handle type="source" position={Position.Bottom} className="!bg-cyan-400 !w-2 !h-2 !border-2 !border-white !-bottom-1" />
      <button 
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          data.onClick();
        }}
        className="w-10 h-10 rounded-full bg-white border-2 border-dashed border-cyan-300 flex items-center justify-center text-cyan-400 hover:border-cyan-500 hover:text-cyan-600 hover:bg-cyan-50 hover:scale-110 transition-all shadow-lg cursor-pointer"
        style={{ pointerEvents: 'all' }}
      >
        <Plus className="w-5 h-5" />
      </button>
    </div>
  );
};

const nodeTypes = {
  tasksNode: TasksNode,
  conditionNode: ConditionNode,
  ruleNode: RuleNode,
  addRuleNode: AddRuleNode,
  addedTasksNode: AddedTasksNode,
};

export function BlockEditorModal({ isOpen, onClose, blockId }: BlockEditorModalProps) {
  const { 
    getBlockById, 
    getTasksByBlockId, 
    updateBlock, 
    addTask, 
    updateTask, 
    deleteTask,
    addRule,
    deleteRule,
    updateRule,
    getJourneyById,
    blocks,
  } = useJourneyStore();

  const block = blockId ? getBlockById(blockId) : null;
  const tasks = blockId ? getTasksByBlockId(blockId) : [];
  const journey = block ? getJourneyById(block.journeyId) : null;
  const otherBlocks = blocks.filter((b) => b.id !== blockId && b.journeyId === block?.journeyId);

  const [blockViewMode, setBlockViewMode] = useState<'list' | 'tree'>('list');
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedNode, setSelectedNode] = useState<TreeNodeSelection>('block');
  const [activeTab, setActiveTab] = useState<'tasks' | 'rules' | 'deps' | 'notifications'>('tasks');

  // Handler for adding rules (needs to be before useMemo that uses it)
  const handleAddRuleFromTree = useCallback(() => {
    if (!block) return;
    const newRule: BlockRule = {
      id: `rule-${Date.now()}`,
      label: 'New rule',
      condition: { attribute: 'department', operator: 'equals', value: '' },
      action: { type: 'add_task', addedTasks: [{ title: 'New task', type: 'basic', assigneeType: 'employee' }] },
    };
    addRule(block.id, newRule);
    setSelectedNode('decision');
  }, [block, addRule]);

  // TREE VIEW - Using ReactFlow (hooks must be before early return)
  const treeNodes = useMemo((): Node[] => {
    if (!block) return [];
    const nodes: Node[] = [];
    const centerX = 300;
    const ruleSpacing = 280;
    
    // Tasks node (top)
    nodes.push({
      id: 'tasks-node',
      type: 'tasksNode',
      position: { x: centerX - 130, y: 0 },
      data: { 
        tasks, 
        selected: selectedNode === 'block',
        onClick: () => setSelectedNode('block')
      },
      draggable: false,
    });
    
    // Condition node (middle)
    nodes.push({
      id: 'condition-node',
      type: 'conditionNode',
      position: { x: centerX - 120, y: 200 },
      data: { 
        selected: selectedNode === 'decision',
        onClick: () => setSelectedNode('decision'),
        rulesCount: block.rules.length
      },
      draggable: false,
    });
    
    // Rule nodes (bottom branches) and their added tasks/blocks
    const totalRules = block.rules.length;
    
    // Only show add button if there are rules, position it in the flow
    if (totalRules > 0) {
      // Add rule button node - positioned to the side
      nodes.push({
        id: 'add-rule-node',
        type: 'addRuleNode',
        position: { x: centerX - 16, y: 320 },
        data: { 
          onClick: handleAddRuleFromTree
        },
        draggable: false,
      });
    }
    
    block.rules.forEach((rule, index) => {
      const xOffset = (index - (totalRules - 1) / 2) * ruleSpacing;
      const ruleX = centerX - 110 + xOffset;
      
      // Rule node
      nodes.push({
        id: `rule-${rule.id}`,
        type: 'ruleNode',
        position: { x: ruleX, y: 420 },
        data: { 
          rule,
          selected: selectedNode === `rule-${rule.id}`,
          onClick: () => setSelectedNode(`rule-${rule.id}`)
        },
        draggable: false,
      });
      
      // Added tasks/block node below each rule
      const addedTasks = rule.action.addedTasks || (rule.action.addedTask ? [rule.action.addedTask] : []);
      const blockTemplate = rule.action.addedBlockTemplateId 
        ? blockTemplates.find(t => t.id === rule.action.addedBlockTemplateId)
        : null;
      
      if (addedTasks.length > 0 || blockTemplate) {
        nodes.push({
          id: `added-${rule.id}`,
          type: 'addedTasksNode',
          position: { x: ruleX, y: 540 },
          data: { 
            tasks: addedTasks,
            blockTemplateName: blockTemplate?.name,
            actionType: rule.action.type
          },
          draggable: false,
        });
      }
    });
    
    // If no rules, show add button below condition
    if (totalRules === 0) {
      nodes.push({
        id: 'add-rule-node',
        type: 'addRuleNode',
        position: { x: centerX - 16, y: 320 },
        data: { 
          onClick: handleAddRuleFromTree
        },
        draggable: false,
      });
    }
    
    return nodes;
  }, [tasks, block, selectedNode, handleAddRuleFromTree]);

  const treeEdges = useMemo((): Edge[] => {
    if (!block) return [];
    const edges: Edge[] = [];
    
    // Tasks to condition
    edges.push({
      id: 'tasks-to-condition',
      source: 'tasks-node',
      target: 'condition-node',
      type: 'smoothstep',
      style: { stroke: '#22d3ee', strokeWidth: 2 },
      animated: true,
    });
    
    const totalRules = block.rules.length;
    
    if (totalRules === 0) {
      // If no rules, connect condition to add button
      edges.push({
        id: 'condition-to-add',
        source: 'condition-node',
        target: 'add-rule-node',
        type: 'smoothstep',
        style: { stroke: '#d1d5db', strokeWidth: 2, strokeDasharray: '5,5' },
      });
    } else {
      // Connect condition to add button
      edges.push({
        id: 'condition-to-add',
        source: 'condition-node',
        target: 'add-rule-node',
        type: 'smoothstep',
        style: { stroke: '#d1d5db', strokeWidth: 2, strokeDasharray: '5,5' },
      });
      
      // Connect add button to each rule
      block.rules.forEach((rule) => {
        edges.push({
          id: `add-to-rule-${rule.id}`,
          source: 'add-rule-node',
          target: `rule-${rule.id}`,
          type: 'smoothstep',
          style: { stroke: '#22d3ee', strokeWidth: 2 },
          animated: true,
        });
        
        // Rule to added tasks/block (if exists)
        const addedTasks = rule.action.addedTasks || (rule.action.addedTask ? [rule.action.addedTask] : []);
        const hasBlockTemplate = !!rule.action.addedBlockTemplateId;
        
        if (addedTasks.length > 0 || hasBlockTemplate) {
          edges.push({
            id: `rule-to-added-${rule.id}`,
            source: `rule-${rule.id}`,
            target: `added-${rule.id}`,
            type: 'smoothstep',
            style: { stroke: '#10b981', strokeWidth: 2 },
            animated: true,
          });
        }
      });
    }
    
    return edges;
  }, [block]);

  if (!block || !journey) return null;

  const handleNameChange = (name: string) => {
    updateBlock(block.id, { name });
  };

  const handleCategoryChange = (category: string) => {
    updateBlock(block.id, { category });
  };

  const handlePeriodChange = (periodId: string) => {
    updateBlock(block.id, { periodId });
  };

  const handleSlaChange = (days: number) => {
    updateBlock(block.id, { expectedDurationDays: days });
  };

  const handleAddTask = () => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      blockId: block.id,
      title: 'New task',
      type: 'basic',
      assigneeType: 'employee',
      order: tasks.length,
    };
    addTask(newTask);
  };

  const handleDependencyToggle = (depBlockId: string) => {
    const deps = block.dependencyBlockIds.includes(depBlockId)
      ? block.dependencyBlockIds.filter((id) => id !== depBlockId)
      : [...block.dependencyBlockIds, depBlockId];
    updateBlock(block.id, { dependencyBlockIds: deps });
  };

  const handleAddRule = () => {
    const newRule: BlockRule = {
      id: `rule-${Date.now()}`,
      label: 'New rule',
      condition: { attribute: 'department', operator: 'equals', value: '' },
      action: { type: 'add_task' },
    };
    addRule(block.id, newRule);
  };

  // Shared editor components
  const renderTasksEditor = () => (
    <div className="space-y-2">
      {tasks.map((task) => (
        <div key={task.id} className="flex items-center gap-2 p-3 rounded-lg border border-border bg-background group hover:border-muted-foreground/30 transition-colors">
          <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab flex-shrink-0" />
          <input
            type="text"
            value={task.title}
            onChange={(e) => updateTask(task.id, { title: e.target.value })}
            className="flex-1 bg-transparent text-sm focus:outline-none"
          />
          <select
            value={task.assigneeType}
            onChange={(e) => updateTask(task.id, { assigneeType: e.target.value })}
            className="h-8 px-2 rounded border border-border bg-background text-xs"
          >
            <option value="employee">Employee</option>
            <option value="manager">Manager</option>
            <option value="hr_manager">HR</option>
            <option value="it_admin">IT</option>
          </select>
          <button
            onClick={() => deleteTask(task.id)}
            className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 rounded transition-all"
          >
            <Trash2 className="w-4 h-4 text-destructive" />
          </button>
        </div>
      ))}
      <button
        onClick={handleAddTask}
        className="w-full flex items-center justify-center gap-2 p-3 rounded-lg border border-dashed border-border text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add task
      </button>
    </div>
  );

  const renderDependenciesEditor = () => (
    <div className="space-y-2">
      {otherBlocks.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">No other blocks available</p>
      ) : (
        otherBlocks.map((b) => (
          <label key={b.id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={block.dependencyBlockIds.includes(b.id)}
              onChange={() => handleDependencyToggle(b.id)}
              className="w-4 h-4 rounded border-border"
            />
            <span className="text-sm truncate">{b.name}</span>
          </label>
        ))
      )}
    </div>
  );

  const renderNotificationsEditor = () => (
    <div className="text-center py-8">
      <Bell className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
      <p className="text-sm text-muted-foreground mb-4">Configure notifications for this block</p>
      <button className="text-sm text-primary hover:underline">
        <Plus className="w-4 h-4 inline mr-1" />
        Add notification
      </button>
    </div>
  );

  const renderAudienceRulesEditor = () => {
    const getTasksForRule = (rule: BlockRule) => {
      if (rule.action.addedTasks && rule.action.addedTasks.length > 0) {
        return rule.action.addedTasks;
      }
      if (rule.action.addedTask) {
        return [rule.action.addedTask];
      }
      return [];
    };

    const handleAddTaskToRule = (ruleId: string) => {
      const rule = block.rules.find(r => r.id === ruleId);
      if (!rule) return;
      
      const currentTasks = getTasksForRule(rule);
      const newTask = { 
        id: `rule-task-${Date.now()}`,
        title: 'New task', 
        type: 'basic' as const, 
        assigneeType: 'employee' 
      };
      
      updateRule(block.id, ruleId, { 
        action: { 
          ...rule.action, 
          addedTasks: [...currentTasks, newTask],
          addedTask: undefined
        } 
      });
    };

    const handleUpdateTaskInRule = (ruleId: string, taskIndex: number, updates: Partial<Task>) => {
      const rule = block.rules.find(r => r.id === ruleId);
      if (!rule) return;
      
      const currentTasks = [...getTasksForRule(rule)];
      currentTasks[taskIndex] = { ...currentTasks[taskIndex], ...updates };
      
      updateRule(block.id, ruleId, { 
        action: { 
          ...rule.action, 
          addedTasks: currentTasks,
          addedTask: undefined
        } 
      });
    };

    const handleDeleteTaskFromRule = (ruleId: string, taskIndex: number) => {
      const rule = block.rules.find(r => r.id === ruleId);
      if (!rule) return;
      
      const currentTasks = getTasksForRule(rule).filter((_, i) => i !== taskIndex);
      
      updateRule(block.id, ruleId, { 
        action: { 
          ...rule.action, 
          addedTasks: currentTasks,
          addedTask: undefined
        } 
      });
    };

    const blockTemplate = (rule: BlockRule) => rule.action.addedBlockTemplateId 
      ? blockTemplates.find(t => t.id === rule.action.addedBlockTemplateId)
      : null;

    return (
      <div className="space-y-3">
        {block.rules.length === 0 && (
          <div className="text-center py-6 text-sm text-muted-foreground bg-muted/30 rounded-lg">
            No audience rules defined.
            <br />
            <span className="text-xs">Rules allow adding tasks or blocks based on employee characteristics.</span>
          </div>
        )}
        {block.rules.map((rule) => {
          const ruleTasks = getTasksForRule(rule);
          const template = blockTemplate(rule);
          
          return (
            <div 
              key={rule.id} 
              className={cn(
                "p-4 rounded-lg border space-y-3 cursor-pointer transition-all",
                selectedNode === `rule-${rule.id}` 
                  ? "border-cyan-400 bg-cyan-50/50 ring-1 ring-cyan-200" 
                  : "border-border bg-muted/30 hover:border-cyan-200"
              )}
              onClick={() => setSelectedNode(`rule-${rule.id}`)}
            >
              {/* Condition row */}
              <div className="flex items-center gap-2 text-sm flex-wrap">
                <span className="text-xs font-semibold text-cyan-600 px-2 py-0.5 bg-cyan-100 rounded">IF</span>
                <select
                  value={rule.condition.attribute}
                  onChange={(e) => {
                    e.stopPropagation();
                    updateRule(block.id, rule.id, { 
                      condition: { ...rule.condition, attribute: e.target.value } 
                    });
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="h-8 px-2 rounded border border-border bg-background text-sm"
                >
                  <option value="department">Department</option>
                  <option value="location">Location</option>
                  <option value="role">Role</option>
                  <option value="manager">Manager</option>
                  <option value="employeeType">Employee Type</option>
                </select>
                <span className="text-muted-foreground">=</span>
                <input
                  type="text"
                  value={typeof rule.condition.value === 'string' ? rule.condition.value : ''}
                  onChange={(e) => updateRule(block.id, rule.id, { 
                    condition: { ...rule.condition, value: e.target.value } 
                  })}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="Value..."
                  className="flex-1 min-w-[120px] h-8 px-3 rounded border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteRule(block.id, rule.id);
                  }}
                  className="p-1.5 hover:bg-destructive/10 rounded transition-all"
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </button>
              </div>

              {/* Visual summary of what this rule adds */}
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-emerald-700">→</span>
                  {rule.action.type === 'add_task' ? (
                    <div className="flex items-center gap-2 flex-1 flex-wrap">
                      <FileText className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700 font-medium">
                        {ruleTasks.length} task{ruleTasks.length !== 1 ? 's' : ''}
                      </span>
                      {ruleTasks.length > 0 && (
                        <span className="text-emerald-600 truncate text-sm">
                          ({ruleTasks.map(t => t.title).join(', ')})
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 flex-1">
                      <Layers className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700 font-medium">Block:</span>
                      <span className="text-emerald-600 truncate">
                        {template?.name || 'Not selected'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Expanded editing when selected */}
              {selectedNode === `rule-${rule.id}` && (
                <div className="pl-4 border-l-2 border-cyan-300 space-y-3 mt-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="font-medium text-cyan-600 px-2 py-0.5 bg-cyan-100 rounded text-xs">THEN</span>
                    <select
                      value={rule.action.type}
                      onChange={(e) => {
                        const newType = e.target.value as any;
                        updateRule(block.id, rule.id, { 
                          action: { 
                            ...rule.action, 
                            type: newType,
                            addedTasks: newType === 'add_task' ? (ruleTasks.length > 0 ? ruleTasks : [{ title: 'New task', type: 'basic', assigneeType: 'employee' }]) : undefined,
                            addedTask: undefined
                          } 
                        });
                      }}
                      className="h-8 px-2 rounded border border-border bg-background text-sm"
                    >
                      <option value="add_task">Add tasks</option>
                      <option value="add_block">Add block</option>
                    </select>
                  </div>
                  
                  {rule.action.type === 'add_task' && (
                    <div className="space-y-2">
                      {ruleTasks.map((task, taskIndex) => (
                        <div key={task.id || taskIndex} className="flex items-center gap-2 p-2 rounded-lg border border-border bg-background group">
                          <GripVertical className="w-4 h-4 text-muted-foreground" />
                          <input
                            type="text"
                            value={task.title || ''}
                            onChange={(e) => handleUpdateTaskInRule(rule.id, taskIndex, { title: e.target.value })}
                            placeholder="Task title..."
                            className="flex-1 bg-transparent text-sm focus:outline-none"
                          />
                          <select
                            value={task.assigneeType || 'employee'}
                            onChange={(e) => handleUpdateTaskInRule(rule.id, taskIndex, { assigneeType: e.target.value })}
                            className="h-7 px-2 rounded border border-border bg-background text-xs"
                          >
                            <option value="employee">Employee</option>
                            <option value="manager">Manager</option>
                            <option value="hr_manager">HR</option>
                            <option value="it_admin">IT</option>
                          </select>
                          <button
                            onClick={() => handleDeleteTaskFromRule(rule.id, taskIndex)}
                            className="p-1 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 rounded transition-all"
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => handleAddTaskToRule(rule.id)}
                        className="w-full flex items-center justify-center gap-2 p-2 rounded-lg border border-dashed border-emerald-300 text-sm text-emerald-600 hover:bg-emerald-50 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Add task
                      </button>
                    </div>
                  )}

                  {rule.action.type === 'add_block' && (
                    <div className="space-y-2">
                      <select
                        value={rule.action.addedBlockTemplateId || ''}
                        onChange={(e) => updateRule(block.id, rule.id, { 
                          action: { 
                            ...rule.action, 
                            addedBlockTemplateId: e.target.value 
                          } 
                        })}
                        className="w-full h-9 px-3 rounded border border-border bg-background text-sm"
                      >
                        <option value="">Select block...</option>
                        {blockTemplates.map((template) => (
                          <option key={template.id} value={template.id}>
                            {template.name} ({template.category})
                          </option>
                        ))}
                      </select>
                      {rule.action.addedBlockTemplateId && (
                        <p className="text-xs text-muted-foreground pl-1">
                          {blockTemplates.find(t => t.id === rule.action.addedBlockTemplateId)?.description}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        <button
          onClick={handleAddRule}
          className="w-full flex items-center justify-center gap-2 p-3 rounded-lg border-2 border-dashed border-cyan-300 text-sm text-cyan-600 hover:bg-cyan-50 hover:border-cyan-400 transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          New audience rule
        </button>
      </div>
    );
  };

  // LIST VIEW
  const renderListView = () => (
    <div className="flex flex-col h-full">
      {/* Basic Info */}
      <div className="p-6 space-y-4 border-b border-border">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Block Name</label>
          <input
            type="text"
            value={block.name}
            onChange={(e) => handleNameChange(e.target.value)}
            className="w-full h-11 px-4 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Category</label>
            <select
              value={block.category || ''}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full h-11 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">None</option>
              <option value="legal">Legal</option>
              <option value="it">IT</option>
              <option value="hr">HR</option>
              <option value="welcome">Welcome</option>
              <option value="team">Team</option>
              <option value="feedback">Feedback</option>
              <option value="training">Training</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Period</label>
            <select
              value={block.periodId}
              onChange={(e) => handlePeriodChange(e.target.value)}
              className="w-full h-11 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {journey.periods.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">SLA</label>
            <div className="relative">
              <input
                type="number"
                value={block.expectedDurationDays || ''}
                onChange={(e) => handleSlaChange(parseInt(e.target.value) || 0)}
                placeholder="0"
                className="w-full h-11 px-4 pr-14 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">days</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex px-6">
          {[
            { id: 'tasks' as const, label: 'Tasks', icon: FileText, count: tasks.length },
            { id: 'rules' as const, label: 'Audience Rules', icon: GitBranch, count: block.rules.length },
            { id: 'deps' as const, label: 'Dependencies', icon: Link2, count: block.dependencyBlockIds.length },
            { id: 'notifications' as const, label: 'Notifications', icon: Bell, count: 0 },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.count > 0 && <span className="px-1.5 py-0.5 text-xs bg-muted rounded">{tab.count}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'tasks' && renderTasksEditor()}
        {activeTab === 'rules' && renderAudienceRulesEditor()}
        {activeTab === 'deps' && renderDependenciesEditor()}
        {activeTab === 'notifications' && renderNotificationsEditor()}
      </div>
    </div>
  );
  
  // TREE VIEW
  const renderTreeView = () => (
    <div className="flex h-full">
      {/* Tree Visualization with ReactFlow */}
      <div className="flex-1 h-full" style={{ background: '#f8fafb' }}>
        <ReactFlowProvider>
          <div style={{ width: '100%', height: '100%' }}>
            <ReactFlow
              nodes={treeNodes}
              edges={treeEdges}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.2 }}
              minZoom={0.3}
              maxZoom={1.5}
              panOnDrag={true}
              zoomOnScroll={true}
              proOptions={{ hideAttribution: true }}
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable={false}
            >
              <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#cbd5e1" />
            </ReactFlow>
          </div>
        </ReactFlowProvider>
      </div>

      {/* Editor Panel */}
      <div className="w-[380px] border-l border-border p-6 overflow-auto bg-background">
        <div className="space-y-5">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Block Configuration
          </h3>
          
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Name</label>
            <input
              type="text"
              value={block.name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Period</label>
              <select
                value={block.periodId}
                onChange={(e) => handlePeriodChange(e.target.value)}
                className="w-full h-10 px-2 rounded-lg border border-border bg-background text-sm"
              >
                {journey.periods.map((p) => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">SLA (days)</label>
              <input
                type="number"
                value={block.expectedDurationDays || ''}
                onChange={(e) => handleSlaChange(parseInt(e.target.value) || 0)}
                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            <h4 className="text-xs font-semibold text-muted-foreground mb-3">Base Tasks</h4>
            {renderTasksEditor()}
          </div>

          <div className="pt-4 border-t border-border">
            <h4 className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1">
              <Link2 className="w-3.5 h-3.5" /> Dependencies
            </h4>
            {renderDependenciesEditor()}
          </div>

          <div className="pt-4 border-t border-border">
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Diamond className="w-4 h-4 text-cyan-500" />
              Audience Rules
            </h4>
            <p className="text-xs text-muted-foreground mb-3">
              Define conditions that add tasks or blocks based on employee characteristics.
            </p>
            {renderAudienceRulesEditor()}
          </div>
        </div>
      </div>
    </div>
  );

  // Determine panel width based on view mode and expansion
  const getPanelWidth = () => {
    if (blockViewMode === 'tree') {
      return isExpanded ? '80vw' : '900px';
    }
    return '520px';
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent 
        side="right" 
        className="p-0 flex flex-col overflow-hidden"
        style={{ 
          width: getPanelWidth(),
          maxWidth: '95vw',
          transition: 'width 0.3s ease-in-out'
        }}
      >
        <SheetHeader className="px-6 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-semibold">Edit Block</SheetTitle>
            <div className="flex items-center gap-3">
              {/* Expand/Collapse button (only in tree view) */}
              {blockViewMode === 'tree' && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                  title={isExpanded ? 'Collapse' : 'Expand'}
                >
                  {isExpanded ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </button>
              )}
              
              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
                <button
                  onClick={() => setBlockViewMode('list')}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all",
                    blockViewMode === 'list'
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <List className="w-3.5 h-3.5" />
                  List
                </button>
                <button
                  onClick={() => setBlockViewMode('tree')}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all",
                    blockViewMode === 'tree'
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <GitBranch className="w-3.5 h-3.5" />
                  Tree
                </button>
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-hidden">
          {blockViewMode === 'list' ? renderListView() : renderTreeView()}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3 flex-shrink-0 bg-background">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Cancel
          </button>
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
            Save
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
