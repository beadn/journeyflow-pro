import { useState } from 'react';
import { Block, Task, BlockRule, Period } from '@/types/journey';
import { useJourneyStore } from '@/stores/journeyStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X, Plus, Trash2, GripVertical, ChevronDown } from 'lucide-react';
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
              <div className="space-y-3">
                {block.rules.map((rule) => (
                  <div
                    key={rule.id}
                    className="p-4 rounded-lg border border-border bg-background"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium text-accent">IF</span>
                          <select className="h-8 px-2 rounded border border-border bg-background text-xs">
                            <option value="department">Department</option>
                            <option value="location">Location</option>
                            <option value="role">Role</option>
                          </select>
                          <select className="h-8 px-2 rounded border border-border bg-background text-xs">
                            <option value="equals">equals</option>
                            <option value="not_equals">not equals</option>
                            <option value="in">in</option>
                          </select>
                          <input
                            type="text"
                            placeholder="Value"
                            className="flex-1 h-8 px-2 rounded border border-border bg-background text-xs"
                          />
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium text-primary">THEN</span>
                          <select className="h-8 px-2 rounded border border-border bg-background text-xs">
                            <option value="add_task">Add Task</option>
                            <option value="remove_task">Remove Task</option>
                            <option value="skip_block">Skip Block</option>
                            <option value="override_assignee">Override Assignee</option>
                          </select>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteRule(block.id, rule.id)}
                        className="p-1 hover:bg-danger/10 rounded transition-all"
                      >
                        <Trash2 className="w-4 h-4 text-danger" />
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  onClick={handleAddRule}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-lg border border-dashed border-border text-muted-foreground hover:border-accent hover:text-accent transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Rule
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
