import { useState } from 'react';
import { Block, Task, BlockRule, Period } from '@/types/journey';
import { useJourneyStore } from '@/stores/journeyStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X, Plus, Trash2, GripVertical, List, GitBranch, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BlockEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  blockId: string | null;
}

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
    getJourneyById,
    blocks,
  } = useJourneyStore();

  const block = blockId ? getBlockById(blockId) : null;
  const tasks = blockId ? getTasksByBlockId(blockId) : [];
  const journey = block ? getJourneyById(block.journeyId) : null;
  const otherBlocks = blocks.filter((b) => b.id !== blockId && b.journeyId === block?.journeyId);

  const [activeTab, setActiveTab] = useState<'tasks' | 'rules' | 'deps' | 'notifications'>('tasks');
  const [blockViewMode, setBlockViewMode] = useState<'inline' | 'tree'>('inline');

  if (!block || !journey) return null;

  const handleNameChange = (name: string) => {
    updateBlock(block.id, { name });
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
      title: 'New Task',
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
      label: 'New Rule',
      condition: { attribute: 'department', operator: 'equals', value: '' },
      action: { type: 'add_task' },
    };
    addRule(block.id, newRule);
  };

  const tabs = [
    { id: 'tasks' as const, label: 'Steps / Tasks', count: tasks.length },
    { id: 'rules' as const, label: 'Audience Rules', count: block.rules.length },
    { id: 'deps' as const, label: 'Dependencies', count: block.dependencyBlockIds.length },
    { id: 'notifications' as const, label: 'Notifications', count: 0 },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">Edit Block</DialogTitle>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Basic Info */}
          <div className="p-6 space-y-4 border-b border-border">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Block Name
              </label>
              <input
                type="text"
                value={block.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Period
                </label>
                <select
                  value={block.periodId}
                  onChange={(e) => handlePeriodChange(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {journey.periods.map((p) => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Expected Duration (SLA)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={block.expectedDurationDays || ''}
                    onChange={(e) => handleSlaChange(parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full h-10 px-3 pr-12 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    days
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Category
              </label>
              <input
                type="text"
                value={block.category || ''}
                onChange={(e) => updateBlock(block.id, { category: e.target.value })}
                placeholder="e.g., Legal, IT, Onboarding"
                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="px-6 py-3 border-b border-border flex items-center justify-between bg-muted/30">
            <span className="text-sm font-medium text-muted-foreground">Vista del bloque</span>
            <div className="flex items-center gap-1 p-1 bg-background rounded-lg border border-border">
              <button
                onClick={() => setBlockViewMode('inline')}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all",
                  blockViewMode === 'inline'
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <List className="w-3.5 h-3.5" />
                Lista
              </button>
              <button
                onClick={() => setBlockViewMode('tree')}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all",
                  blockViewMode === 'tree'
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <GitBranch className="w-3.5 h-3.5" />
                Árbol
              </button>
            </div>
          </div>

          {/* Tree View */}
          {blockViewMode === 'tree' && (
            <div className="p-6 border-b border-border">
              <div className="relative">
                {/* Main Block Node */}
                <div className="flex flex-col items-center">
                  <div className="px-4 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium shadow-md min-w-[200px] text-center">
                    {block.name}
                    <div className="text-xs opacity-80 mt-1">{tasks.length} tareas base</div>
                  </div>
                  
                  {/* Connection Line */}
                  {block.rules.length > 0 && (
                    <div className="w-0.5 h-6 bg-border" />
                  )}
                  
                  {/* Audience Rules Branches */}
                  {block.rules.length > 0 && (
                    <div className="flex gap-4 mt-0">
                      {/* All employees branch */}
                      <div className="flex flex-col items-center">
                        <div className="w-0.5 h-4 bg-border" />
                        <div className="px-3 py-2 rounded-lg border-2 border-border bg-background text-xs min-w-[140px]">
                          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                            <Users className="w-3 h-3" />
                            <span className="font-medium">Todos</span>
                          </div>
                          <div className="text-foreground">{tasks.length} tareas</div>
                        </div>
                      </div>
                      
                      {/* Conditional branches */}
                      {block.rules.map((rule, index) => (
                        <div key={rule.id} className="flex flex-col items-center">
                          <div className="w-0.5 h-4 bg-accent" />
                          <div className="px-3 py-2 rounded-lg border-2 border-accent bg-accent/5 text-xs min-w-[140px]">
                            <div className="flex items-center gap-1.5 text-accent mb-1">
                              <GitBranch className="w-3 h-3" />
                              <span className="font-medium capitalize">{rule.condition.attribute}</span>
                            </div>
                            <div className="text-muted-foreground text-[10px] mb-1">
                              = {typeof rule.condition.value === 'string' ? rule.condition.value || '...' : '...'}
                            </div>
                            <div className="text-foreground">
                              +{rule.action.addedTask ? '1 tarea' : '0 tareas'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {block.rules.length === 0 && (
                    <p className="text-xs text-muted-foreground mt-4">
                      Añade reglas de audiencia para ver las ramificaciones
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="border-b border-border">
            <div className="flex px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                    activeTab === tab.id
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 text-xs bg-muted rounded">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'tasks' && (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background group"
                  >
                    <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                    <input
                      type="text"
                      value={task.title}
                      onChange={(e) => updateTask(task.id, { title: e.target.value })}
                      className="flex-1 bg-transparent text-sm focus:outline-none"
                    />
                    <select
                      value={task.type}
                      onChange={(e) => updateTask(task.id, { type: e.target.value as Task['type'] })}
                      className="h-8 px-2 rounded border border-border bg-background text-xs"
                    >
                      <option value="basic">Basic</option>
                      <option value="data_input">Data Input</option>
                      <option value="signature">Signature</option>
                      <option value="review">Review</option>
                      <option value="notification">Notification</option>
                    </select>
                    <select
                      value={task.assigneeType}
                      onChange={(e) => updateTask(task.id, { assigneeType: e.target.value })}
                      className="h-8 px-2 rounded border border-border bg-background text-xs"
                    >
                      <option value="employee">Employee</option>
                      <option value="manager">Manager</option>
                      <option value="hr_manager">HR Manager</option>
                      <option value="it_admin">IT Admin</option>
                      <option value="buddy">Buddy</option>
                    </select>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="p-1 opacity-0 group-hover:opacity-100 hover:bg-danger/10 rounded transition-all"
                    >
                      <Trash2 className="w-4 h-4 text-danger" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={handleAddTask}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-lg border border-dashed border-border text-muted-foreground hover:border-accent hover:text-accent transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Step
                </button>
              </div>
            )}

            {activeTab === 'rules' && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Añade tareas adicionales según las características del empleado.
                </p>
                {block.rules.map((rule) => (
                  <div
                    key={rule.id}
                    className="rounded-lg border border-border bg-muted/30 overflow-hidden"
                  >
                    {/* Condition Header */}
                    <div className="p-3 bg-background border-b border-border flex items-center gap-2">
                      <span className="text-xs font-semibold text-accent uppercase tracking-wide">Si</span>
                      <select 
                        defaultValue={rule.condition.attribute}
                        className="h-7 px-2 rounded border border-border bg-background text-xs font-medium"
                      >
                        <option value="department">Departamento</option>
                        <option value="location">Ubicación</option>
                        <option value="role">Rol</option>
                        <option value="contract_type">Tipo de contrato</option>
                        <option value="seniority">Seniority</option>
                      </select>
                      <span className="text-xs text-muted-foreground">=</span>
                      <input
                        type="text"
                        defaultValue={typeof rule.condition.value === 'string' ? rule.condition.value : ''}
                        placeholder="Valor..."
                        className="flex-1 h-7 px-2 rounded border border-border bg-background text-xs"
                      />
                      <button
                        onClick={() => deleteRule(block.id, rule.id)}
                        className="p-1 hover:bg-destructive/10 rounded transition-all ml-auto"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </button>
                    </div>
                    
                    {/* Additional Tasks */}
                    <div className="p-3 space-y-2">
                      <div className="text-xs font-medium text-muted-foreground mb-2">
                        Tareas adicionales:
                      </div>
                      {rule.action.addedTask && (
                        <div className="flex items-center gap-2 p-2 rounded bg-background border border-border">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                          <span className="text-sm">{rule.action.addedTask.title || 'Nueva tarea'}</span>
                        </div>
                      )}
                      <button className="w-full flex items-center justify-center gap-1.5 p-2 rounded border border-dashed border-border text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                        <Plus className="w-3 h-3" />
                        Añadir tarea condicional
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  onClick={handleAddRule}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-lg border-2 border-dashed border-border text-muted-foreground hover:border-accent hover:text-accent hover:bg-accent/5 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Nueva regla de audiencia
                </button>
              </div>
            )}

            {activeTab === 'deps' && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground mb-4">
                  Select blocks that must be completed before this block can start.
                </p>
                {otherBlocks.map((b) => (
                  <label
                    key={b.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={block.dependencyBlockIds.includes(b.id)}
                      onChange={() => handleDependencyToggle(b.id)}
                      className="w-4 h-4 rounded border-border"
                    />
                    <span className="text-sm font-medium">{b.name}</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {journey.periods.find((p) => p.id === b.periodId)?.label}
                    </span>
                  </label>
                ))}
                {otherBlocks.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No other blocks available
                  </p>
                )}
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground mb-4">
                  Configure notifications to be sent at various stages.
                </p>
                <button className="btn-secondary">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Notification
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3">
          <button onClick={onClose} className="btn-ghost">
            Cancel
          </button>
          <button onClick={onClose} className="btn-primary">
            Save Changes
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
