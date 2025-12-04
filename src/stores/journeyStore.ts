import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Journey,
  Period,
  Block,
  Task,
  Employee,
  EmployeeJourneyProgress,
  JourneyMetrics,
  BlockMetrics,
  BlockRule,
} from '@/types/journey';
import { generateMockData } from '@/lib/mockData';

interface JourneyStore {
  // Data
  journeys: Journey[];
  blocks: Block[];
  tasks: Task[];
  employees: Employee[];
  employeeProgress: EmployeeJourneyProgress[];

  // Selected state
  selectedJourneyId: string | null;
  selectedBlockId: string | null;

  // Actions - Journeys
  setSelectedJourneyId: (id: string | null) => void;
  addJourney: (journey: Journey) => void;
  updateJourney: (id: string, updates: Partial<Journey>) => void;
  deleteJourney: (id: string) => void;
  duplicateJourney: (id: string) => Journey;

  // Actions - Periods
  addPeriod: (journeyId: string, period: Period) => void;
  updatePeriod: (journeyId: string, periodId: string, updates: Partial<Period>) => void;
  deletePeriod: (journeyId: string, periodId: string) => void;
  reorderPeriods: (journeyId: string, periods: Period[]) => void;

  // Actions - Blocks
  setSelectedBlockId: (id: string | null) => void;
  addBlock: (block: Block) => void;
  updateBlock: (id: string, updates: Partial<Block>) => void;
  deleteBlock: (id: string) => void;
  moveBlockToPeriod: (blockId: string, periodId: string) => void;
  updateBlockPosition: (blockId: string, position: { x: number; y: number }) => void;

  // Actions - Tasks
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  reorderTasks: (blockId: string, tasks: Task[]) => void;

  // Actions - Rules
  addRule: (blockId: string, rule: BlockRule) => void;
  updateRule: (blockId: string, ruleId: string, updates: Partial<BlockRule>) => void;
  deleteRule: (blockId: string, ruleId: string) => void;

  // Getters
  getJourneyById: (id: string) => Journey | undefined;
  getBlocksByJourneyId: (journeyId: string) => Block[];
  getBlocksByPeriodId: (periodId: string) => Block[];
  getTasksByBlockId: (blockId: string) => Task[];
  getBlockById: (id: string) => Block | undefined;

  // Metrics
  getJourneyMetrics: (journeyId: string) => JourneyMetrics;
  getBlockMetrics: (blockId: string) => BlockMetrics;
  getEmployeesInBlock: (blockId: string) => Employee[];
  getEmployeeProgress: (employeeId: string, journeyId: string) => EmployeeJourneyProgress | undefined;
}

export const useJourneyStore = create<JourneyStore>()(
  persist(
    (set, get) => {
      const mockData = generateMockData();
      
      return {
        // Initial data
        journeys: mockData.journeys,
        blocks: mockData.blocks,
        tasks: mockData.tasks,
        employees: mockData.employees,
        employeeProgress: mockData.employeeProgress,
        selectedJourneyId: null,
        selectedBlockId: null,

        // Journey Actions
        setSelectedJourneyId: (id) => set({ selectedJourneyId: id }),
        
        addJourney: (journey) => set((state) => ({
          journeys: [...state.journeys, journey]
        })),

        updateJourney: (id, updates) => set((state) => ({
          journeys: state.journeys.map((j) =>
            j.id === id ? { ...j, ...updates, updatedAt: new Date().toISOString() } : j
          )
        })),

        deleteJourney: (id) => set((state) => ({
          journeys: state.journeys.filter((j) => j.id !== id),
          blocks: state.blocks.filter((b) => b.journeyId !== id)
        })),

        duplicateJourney: (id) => {
          const state = get();
          const original = state.journeys.find((j) => j.id === id);
          if (!original) throw new Error('Journey not found');
          
          const newId = `journey-${Date.now()}`;
          const periodIdMap = new Map<string, string>();
          
          const newPeriods = original.periods.map((p) => {
            const newPeriodId = `period-${Date.now()}-${Math.random()}`;
            periodIdMap.set(p.id, newPeriodId);
            return { ...p, id: newPeriodId };
          });

          const newJourney: Journey = {
            ...original,
            id: newId,
            name: `${original.name} (Copy)`,
            periods: newPeriods,
            blockIds: [],
            status: 'draft',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          // Duplicate blocks
          const originalBlocks = state.blocks.filter((b) => b.journeyId === id);
          const blockIdMap = new Map<string, string>();
          
          const newBlocks = originalBlocks.map((b) => {
            const newBlockId = `block-${Date.now()}-${Math.random()}`;
            blockIdMap.set(b.id, newBlockId);
            return {
              ...b,
              id: newBlockId,
              journeyId: newId,
              periodId: periodIdMap.get(b.periodId) || b.periodId,
              dependencyBlockIds: [],
              taskIds: [],
            };
          });

          // Update dependencies
          newBlocks.forEach((b) => {
            const originalBlock = originalBlocks.find((ob) => blockIdMap.get(ob.id) === b.id);
            if (originalBlock) {
              b.dependencyBlockIds = originalBlock.dependencyBlockIds
                .map((depId) => blockIdMap.get(depId))
                .filter(Boolean) as string[];
            }
          });

          newJourney.blockIds = newBlocks.map((b) => b.id);

          // Duplicate tasks
          const originalTasks = state.tasks.filter((t) => 
            originalBlocks.some((b) => b.id === t.blockId)
          );

          const newTasks = originalTasks.map((t) => {
            const newTaskId = `task-${Date.now()}-${Math.random()}`;
            const newBlockId = blockIdMap.get(t.blockId);
            return {
              ...t,
              id: newTaskId,
              blockId: newBlockId || t.blockId,
            };
          });

          // Update task IDs in blocks
          newBlocks.forEach((b) => {
            b.taskIds = newTasks
              .filter((t) => t.blockId === b.id)
              .map((t) => t.id);
          });

          set((state) => ({
            journeys: [...state.journeys, newJourney],
            blocks: [...state.blocks, ...newBlocks],
            tasks: [...state.tasks, ...newTasks],
          }));

          return newJourney;
        },

        // Period Actions
        addPeriod: (journeyId, period) => set((state) => ({
          journeys: state.journeys.map((j) =>
            j.id === journeyId
              ? { ...j, periods: [...j.periods, period], updatedAt: new Date().toISOString() }
              : j
          )
        })),

        updatePeriod: (journeyId, periodId, updates) => set((state) => ({
          journeys: state.journeys.map((j) =>
            j.id === journeyId
              ? {
                  ...j,
                  periods: j.periods.map((p) =>
                    p.id === periodId ? { ...p, ...updates } : p
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : j
          )
        })),

        deletePeriod: (journeyId, periodId) => set((state) => ({
          journeys: state.journeys.map((j) =>
            j.id === journeyId
              ? {
                  ...j,
                  periods: j.periods.filter((p) => p.id !== periodId),
                  updatedAt: new Date().toISOString(),
                }
              : j
          ),
          blocks: state.blocks.filter((b) => b.periodId !== periodId),
        })),

        reorderPeriods: (journeyId, periods) => set((state) => ({
          journeys: state.journeys.map((j) =>
            j.id === journeyId
              ? { ...j, periods, updatedAt: new Date().toISOString() }
              : j
          )
        })),

        // Block Actions
        setSelectedBlockId: (id) => set({ selectedBlockId: id }),

        addBlock: (block) => set((state) => ({
          blocks: [...state.blocks, block],
          journeys: state.journeys.map((j) =>
            j.id === block.journeyId
              ? { ...j, blockIds: [...j.blockIds, block.id], updatedAt: new Date().toISOString() }
              : j
          )
        })),

        updateBlock: (id, updates) => set((state) => ({
          blocks: state.blocks.map((b) =>
            b.id === id ? { ...b, ...updates } : b
          )
        })),

        deleteBlock: (id) => set((state) => {
          const block = state.blocks.find((b) => b.id === id);
          if (!block) return state;
          
          return {
            blocks: state.blocks.filter((b) => b.id !== id).map((b) => ({
              ...b,
              dependencyBlockIds: b.dependencyBlockIds.filter((depId) => depId !== id),
            })),
            journeys: state.journeys.map((j) =>
              j.id === block.journeyId
                ? { ...j, blockIds: j.blockIds.filter((bid) => bid !== id), updatedAt: new Date().toISOString() }
                : j
            ),
            tasks: state.tasks.filter((t) => t.blockId !== id),
          };
        }),

        moveBlockToPeriod: (blockId, periodId) => set((state) => ({
          blocks: state.blocks.map((b) =>
            b.id === blockId ? { ...b, periodId } : b
          )
        })),

        updateBlockPosition: (blockId, position) => set((state) => ({
          blocks: state.blocks.map((b) =>
            b.id === blockId ? { ...b, position } : b
          )
        })),

        // Task Actions
        addTask: (task) => set((state) => ({
          tasks: [...state.tasks, task],
          blocks: state.blocks.map((b) =>
            b.id === task.blockId
              ? { ...b, taskIds: [...b.taskIds, task.id] }
              : b
          )
        })),

        updateTask: (id, updates) => set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          )
        })),

        deleteTask: (id) => set((state) => {
          const task = state.tasks.find((t) => t.id === id);
          if (!task) return state;
          
          return {
            tasks: state.tasks.filter((t) => t.id !== id),
            blocks: state.blocks.map((b) =>
              b.id === task.blockId
                ? { ...b, taskIds: b.taskIds.filter((tid) => tid !== id) }
                : b
            ),
          };
        }),

        reorderTasks: (blockId, tasks) => set((state) => ({
          tasks: state.tasks.map((t) => {
            const updated = tasks.find((ut) => ut.id === t.id);
            return updated ? { ...t, order: updated.order } : t;
          }),
          blocks: state.blocks.map((b) =>
            b.id === blockId
              ? { ...b, taskIds: tasks.map((t) => t.id) }
              : b
          )
        })),

        // Rule Actions
        addRule: (blockId, rule) => set((state) => ({
          blocks: state.blocks.map((b) =>
            b.id === blockId
              ? { ...b, rules: [...b.rules, rule] }
              : b
          )
        })),

        updateRule: (blockId, ruleId, updates) => set((state) => ({
          blocks: state.blocks.map((b) =>
            b.id === blockId
              ? {
                  ...b,
                  rules: b.rules.map((r) =>
                    r.id === ruleId ? { ...r, ...updates } : r
                  ),
                }
              : b
          )
        })),

        deleteRule: (blockId, ruleId) => set((state) => ({
          blocks: state.blocks.map((b) =>
            b.id === blockId
              ? { ...b, rules: b.rules.filter((r) => r.id !== ruleId) }
              : b
          )
        })),

        // Getters
        getJourneyById: (id) => get().journeys.find((j) => j.id === id),
        
        getBlocksByJourneyId: (journeyId) =>
          get().blocks.filter((b) => b.journeyId === journeyId),
        
        getBlocksByPeriodId: (periodId) =>
          get().blocks.filter((b) => b.periodId === periodId),
        
        getTasksByBlockId: (blockId) =>
          get().tasks.filter((t) => t.blockId === blockId).sort((a, b) => a.order - b.order),
        
        getBlockById: (id) => get().blocks.find((b) => b.id === id),

        // Metrics
        getJourneyMetrics: (journeyId) => {
          const state = get();
          const progress = state.employeeProgress.filter((p) => p.journeyId === journeyId);
          
          const onTrack = progress.filter((p) => p.status === 'on_track').length;
          const atRisk = progress.filter((p) => p.status === 'at_risk').length;
          const delayed = progress.filter((p) => p.status === 'delayed').length;
          const completed = progress.filter((p) => p.status === 'completed').length;
          
          const totalDays = progress.reduce((sum, p) => {
            return sum + p.blockProgress.reduce((bs, bp) => bs + bp.daysSpent, 0);
          }, 0);
          
          return {
            journeyId,
            totalEmployees: progress.length,
            onTrack,
            atRisk,
            delayed,
            completed,
            averageDuration: progress.length ? Math.round(totalDays / progress.length) : 0,
            completionRate: progress.length ? Math.round((completed / progress.length) * 100) : 0,
          };
        },

        getBlockMetrics: (blockId) => {
          const state = get();
          const block = state.blocks.find((b) => b.id === blockId);
          
          const inBlockProgress = state.employeeProgress.filter(
            (p) => p.currentBlockId === blockId
          );
          
          const blockProgressData = state.employeeProgress.flatMap((p) =>
            p.blockProgress.filter((bp) => bp.blockId === blockId)
          );
          
          const avgTimeSpent = blockProgressData.length
            ? blockProgressData.reduce((sum, bp) => sum + bp.daysSpent, 0) / blockProgressData.length
            : 0;
          
          const sla = block?.expectedDurationDays || 0;
          const atRisk = blockProgressData.filter((bp) => 
            bp.status === 'in_progress' && bp.daysSpent > sla * 0.8 && bp.daysSpent <= sla
          ).length;
          const delayed = blockProgressData.filter((bp) => 
            bp.status === 'in_progress' && bp.daysSpent > sla
          ).length;
          
          return {
            blockId,
            employeesInBlock: inBlockProgress.length,
            averageTimeSpent: Math.round(avgTimeSpent),
            atRiskCount: atRisk,
            delayedCount: delayed,
            slaDeviation: sla ? Math.round(((avgTimeSpent - sla) / sla) * 100) : 0,
          };
        },

        getEmployeesInBlock: (blockId) => {
          const state = get();
          const employeeIds = state.employeeProgress
            .filter((p) => p.currentBlockId === blockId)
            .map((p) => p.employeeId);
          return state.employees.filter((e) => employeeIds.includes(e.id));
        },

        getEmployeeProgress: (employeeId, journeyId) => {
          return get().employeeProgress.find(
            (p) => p.employeeId === employeeId && p.journeyId === journeyId
          );
        },
      };
    },
    {
      name: 'journey-store',
      partialize: (state) => ({
        journeys: state.journeys,
        blocks: state.blocks,
        tasks: state.tasks,
        employees: state.employees,
        employeeProgress: state.employeeProgress,
      }),
    }
  )
);
