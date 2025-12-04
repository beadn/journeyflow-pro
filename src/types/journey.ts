export type JourneyType =
  | "onboarding"
  | "offboarding"
  | "promotion"
  | "role_change"
  | "performance_cycle"
  | "custom";

export type JourneyStatus = "draft" | "active" | "archived";

export type AnchorEvent = "start_date" | "last_day" | "promotion_date" | "cycle_start" | "custom";

export interface Journey {
  id: string;
  name: string;
  type: JourneyType;
  anchorEvent: AnchorEvent;
  periods: Period[];
  blockIds: string[];
  status: JourneyStatus;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Period {
  id: string;
  label: string;
  offsetDays: number;
  order: number;
}

export interface Block {
  id: string;
  name: string;
  journeyId: string;
  periodId: string;
  taskIds: string[];
  rules: BlockRule[];
  dependencyBlockIds: string[];
  expectedDurationDays?: number;
  description?: string;
  category?: string;
  order: number;
  // For react-flow positioning
  position?: { x: number; y: number };
}

export type TaskType = "basic" | "data_input" | "signature" | "review" | "notification";

export interface Task {
  id: string;
  blockId: string;
  title: string;
  description?: string;
  type: TaskType;
  assigneeType: string;
  assigneeLabel?: string;
  dueOffsetDays?: number;
  simpleCondition?: SimpleCondition;
  order: number;
}

export interface SimpleCondition {
  attribute: string;
  operator: "equals" | "not_equals" | "in" | "not_in";
  value: string | string[];
}

export interface BlockRule {
  id: string;
  label: string;
  condition: RuleCondition;
  action: RuleAction;
}

export interface RuleCondition {
  attribute: string;
  operator: "equals" | "not_equals" | "in" | "not_in";
  value: string | string[];
}

export type RuleActionType = 
  | "add_task" 
  | "remove_task" 
  | "override_assignee" 
  | "skip_block" 
  | "change_due_date" 
  | "require_approval";

export interface RuleAction {
  type: RuleActionType;
  targetTaskId?: string;
  newAssigneeType?: string;
  newDueOffsetDays?: number;
  addedTask?: Partial<Task>;
  addedTasks?: Partial<Task>[];
}

// Employee and Progress Tracking
export type EmployeeStatus = "on_track" | "at_risk" | "delayed" | "completed";

export interface Employee {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  department: string;
  location: string;
  manager: string;
  startDate: string;
  cohort?: string;
}

export interface EmployeeJourneyProgress {
  id: string;
  employeeId: string;
  journeyId: string;
  currentBlockId: string;
  status: EmployeeStatus;
  startedAt: string;
  completedBlockIds: string[];
  blockProgress: BlockProgress[];
}

export interface BlockProgress {
  blockId: string;
  status: "pending" | "in_progress" | "completed" | "skipped";
  startedAt?: string;
  completedAt?: string;
  daysSpent: number;
}

// Metrics
export interface JourneyMetrics {
  journeyId: string;
  totalEmployees: number;
  onTrack: number;
  atRisk: number;
  delayed: number;
  completed: number;
  averageDuration: number;
  completionRate: number;
}

export interface BlockMetrics {
  blockId: string;
  employeesInBlock: number;
  averageTimeSpent: number;
  atRiskCount: number;
  delayedCount: number;
  slaDeviation: number;
}
