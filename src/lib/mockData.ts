import {
  Journey,
  Block,
  Task,
  Employee,
  EmployeeJourneyProgress,
  Period,
} from '@/types/journey';

const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export function generateMockData() {
  // Create Onboarding Journey
  const journeyId = 'journey-onboarding-1';
  
  const periods: Period[] = [
    { id: 'period-1', label: '-7 days', offsetDays: -7, order: 0 },
    { id: 'period-2', label: 'Day 0', offsetDays: 0, order: 1 },
    { id: 'period-3', label: 'First Week', offsetDays: 7, order: 2 },
    { id: 'period-4', label: '+30 days', offsetDays: 30, order: 3 },
    { id: 'period-5', label: '+60 days', offsetDays: 60, order: 4 },
    { id: 'period-6', label: '+90 days', offsetDays: 90, order: 5 },
  ];

  const blocks: Block[] = [
    {
      id: 'block-1',
      name: 'Contract & Legal Setup',
      journeyId,
      periodId: 'period-1',
      taskIds: ['task-1', 'task-2', 'task-3'],
      rules: [
        {
          id: 'rule-1',
          label: 'Remote employee NDA',
          condition: { attribute: 'location', operator: 'equals', value: 'Remote' },
          action: { type: 'add_task', addedTask: { title: 'Remote Work NDA', type: 'signature' } },
        },
      ],
      dependencyBlockIds: [],
      expectedDurationDays: 5,
      description: 'Complete all legal paperwork before start date',
      category: 'Legal',
      order: 0,
      position: { x: 100, y: 100 },
    },
    {
      id: 'block-2',
      name: 'IT Preparation & Access',
      journeyId,
      periodId: 'period-1',
      taskIds: ['task-4', 'task-5', 'task-6'],
      rules: [
        {
          id: 'rule-2',
          label: 'Engineering access',
          condition: { attribute: 'department', operator: 'equals', value: 'Engineering' },
          action: { type: 'add_task', addedTask: { title: 'GitHub access setup', type: 'basic' } },
        },
      ],
      dependencyBlockIds: ['block-1'],
      expectedDurationDays: 3,
      description: 'Prepare all IT equipment and system access',
      category: 'IT',
      order: 1,
      position: { x: 400, y: 100 },
    },
    {
      id: 'block-3',
      name: 'Welcome Day',
      journeyId,
      periodId: 'period-2',
      taskIds: ['task-7', 'task-8', 'task-9'],
      rules: [],
      dependencyBlockIds: ['block-2'],
      expectedDurationDays: 1,
      description: 'First day orientation and welcome activities',
      category: 'Onboarding',
      order: 0,
      position: { x: 700, y: 100 },
    },
    {
      id: 'block-4',
      name: 'Meet Your Team',
      journeyId,
      periodId: 'period-3',
      taskIds: ['task-10', 'task-11'],
      rules: [],
      dependencyBlockIds: ['block-3'],
      expectedDurationDays: 5,
      description: 'Team introductions and initial meetings',
      category: 'Social',
      order: 0,
      position: { x: 1000, y: 100 },
    },
    {
      id: 'block-5',
      name: '30-day Feedback',
      journeyId,
      periodId: 'period-4',
      taskIds: ['task-12', 'task-13'],
      rules: [],
      dependencyBlockIds: ['block-4'],
      expectedDurationDays: 7,
      description: 'First month check-in and feedback collection',
      category: 'Performance',
      order: 0,
      position: { x: 1300, y: 100 },
    },
    {
      id: 'block-6',
      name: '90-day Review',
      journeyId,
      periodId: 'period-6',
      taskIds: ['task-14', 'task-15', 'task-16'],
      rules: [],
      dependencyBlockIds: ['block-5'],
      expectedDurationDays: 7,
      description: 'Probation review and performance assessment',
      category: 'Performance',
      order: 0,
      position: { x: 1600, y: 100 },
    },
  ];

  const tasks: Task[] = [
    // Block 1 tasks
    { id: 'task-1', blockId: 'block-1', title: 'Sign employment contract', type: 'signature', assigneeType: 'employee', order: 0 },
    { id: 'task-2', blockId: 'block-1', title: 'Complete tax forms', type: 'data_input', assigneeType: 'employee', order: 1 },
    { id: 'task-3', blockId: 'block-1', title: 'Review employee handbook', type: 'review', assigneeType: 'employee', order: 2 },
    
    // Block 2 tasks
    { id: 'task-4', blockId: 'block-2', title: 'Prepare laptop', type: 'basic', assigneeType: 'it_admin', order: 0 },
    { id: 'task-5', blockId: 'block-2', title: 'Create email account', type: 'basic', assigneeType: 'it_admin', order: 1 },
    { id: 'task-6', blockId: 'block-2', title: 'Setup Slack access', type: 'basic', assigneeType: 'it_admin', order: 2 },
    
    // Block 3 tasks
    { id: 'task-7', blockId: 'block-3', title: 'Welcome meeting with HR', type: 'basic', assigneeType: 'hr_manager', order: 0 },
    { id: 'task-8', blockId: 'block-3', title: 'Office tour', type: 'basic', assigneeType: 'buddy', order: 1 },
    { id: 'task-9', blockId: 'block-3', title: 'Collect equipment', type: 'basic', assigneeType: 'employee', order: 2 },
    
    // Block 4 tasks
    { id: 'task-10', blockId: 'block-4', title: 'Team lunch', type: 'basic', assigneeType: 'manager', order: 0 },
    { id: 'task-11', blockId: 'block-4', title: '1:1 with manager', type: 'basic', assigneeType: 'manager', order: 1 },
    
    // Block 5 tasks
    { id: 'task-12', blockId: 'block-5', title: 'Complete 30-day survey', type: 'data_input', assigneeType: 'employee', order: 0 },
    { id: 'task-13', blockId: 'block-5', title: '30-day check-in meeting', type: 'review', assigneeType: 'hr_manager', order: 1 },
    
    // Block 6 tasks
    { id: 'task-14', blockId: 'block-6', title: 'Self-assessment', type: 'data_input', assigneeType: 'employee', order: 0 },
    { id: 'task-15', blockId: 'block-6', title: 'Manager review', type: 'review', assigneeType: 'manager', order: 1 },
    { id: 'task-16', blockId: 'block-6', title: 'Probation completion sign-off', type: 'signature', assigneeType: 'hr_manager', order: 2 },
  ];

  const journey: Journey = {
    id: journeyId,
    name: 'Standard Onboarding',
    type: 'onboarding',
    anchorEvent: 'start_date',
    periods,
    blockIds: blocks.map((b) => b.id),
    status: 'active',
    description: 'Standard onboarding journey for all new employees',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Generate employees
  const firstNames = ['Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'William', 'Sophia', 'James', 'Isabella', 'Oliver', 'Mia', 'Benjamin', 'Charlotte', 'Elijah', 'Amelia', 'Lucas', 'Harper', 'Mason', 'Evelyn', 'Logan'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];
  const departments = ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance', 'Product', 'Design', 'Operations'];
  const locations = ['New York', 'San Francisco', 'London', 'Berlin', 'Remote'];
  const managers = ['Sarah Connor', 'John Smith', 'Emily Chen', 'Michael Brown', 'Lisa Wang'];

  const employees: Employee[] = [];
  const employeeProgress: EmployeeJourneyProgress[] = [];

  for (let i = 0; i < 150; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const employee: Employee = {
      id: `emp-${i}`,
      name: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@company.com`,
      department: departments[Math.floor(Math.random() * departments.length)],
      location: locations[Math.floor(Math.random() * locations.length)],
      manager: managers[Math.floor(Math.random() * managers.length)],
      startDate: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
      cohort: `Q${Math.floor(Math.random() * 4) + 1} 2024`,
    };
    employees.push(employee);

    // Generate progress
    const currentBlockIndex = Math.floor(Math.random() * blocks.length);
    const currentBlock = blocks[currentBlockIndex];
    const completedBlocks = blocks.slice(0, currentBlockIndex);
    
    const statuses: ('on_track' | 'at_risk' | 'delayed' | 'completed')[] = ['on_track', 'on_track', 'on_track', 'at_risk', 'delayed'];
    const status = currentBlockIndex === blocks.length ? 'completed' : statuses[Math.floor(Math.random() * statuses.length)];

    const progress: EmployeeJourneyProgress = {
      id: `progress-${i}`,
      employeeId: employee.id,
      journeyId,
      currentBlockId: currentBlock.id,
      status,
      startedAt: employee.startDate,
      completedBlockIds: completedBlocks.map((b) => b.id),
      blockProgress: blocks.map((block, idx) => {
        const isCompleted = idx < currentBlockIndex;
        const isCurrent = idx === currentBlockIndex;
        const sla = block.expectedDurationDays || 5;
        const daysSpent = isCompleted 
          ? sla + Math.floor((Math.random() - 0.3) * 3)
          : isCurrent 
            ? Math.floor(Math.random() * (sla + 5))
            : 0;

        return {
          blockId: block.id,
          status: isCompleted ? 'completed' : isCurrent ? 'in_progress' : 'pending',
          startedAt: isCompleted || isCurrent ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() : undefined,
          completedAt: isCompleted ? new Date(Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000).toISOString() : undefined,
          daysSpent,
        };
      }),
    };
    employeeProgress.push(progress);
  }

  return {
    journeys: [journey],
    blocks,
    tasks,
    employees,
    employeeProgress,
  };
}
