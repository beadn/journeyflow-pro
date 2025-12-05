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
          action: { type: 'add_block', addedBlockTemplateId: 'template-nda' },
        },
        {
          id: 'rule-1b',
          label: 'Contractor extras',
          condition: { attribute: 'employeeType', operator: 'equals', value: 'Contractor' },
          action: { type: 'add_task', addedTask: { title: 'Contractor Agreement', type: 'signature' } },
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
  const employeeTypes: ('Full-time' | 'Part-time' | 'Contractor' | 'Intern')[] = ['Full-time', 'Full-time', 'Full-time', 'Part-time', 'Contractor', 'Intern'];
  const contractTypes: ('Permanent' | 'Temporary' | 'Freelance')[] = ['Permanent', 'Permanent', 'Permanent', 'Temporary', 'Freelance'];
  const levels: ('Junior' | 'Mid' | 'Senior' | 'Lead' | 'Manager' | 'Director')[] = ['Junior', 'Junior', 'Mid', 'Mid', 'Senior', 'Lead', 'Manager', 'Director'];

  const employees: Employee[] = [];
  const employeeProgress: EmployeeJourneyProgress[] = [];

  // Helper to generate a date within a specific month (0-5, where 5 is current month)
  const getDateInMonth = (monthsAgo: number) => {
    const date = new Date();
    date.setMonth(date.getMonth() - monthsAgo);
    date.setDate(Math.floor(Math.random() * 28) + 1); // Random day 1-28
    return date;
  };

  for (let i = 0; i < 150; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    
    // Start dates spread over the last 6 months with increasing trend
    const monthsAgo = Math.floor(Math.random() * 6);
    const startDate = getDateInMonth(monthsAgo + 1); // Started 1-7 months ago
    
    const employee: Employee = {
      id: `emp-${i}`,
      name: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@company.com`,
      department: departments[Math.floor(Math.random() * departments.length)],
      location: locations[Math.floor(Math.random() * locations.length)],
      manager: managers[Math.floor(Math.random() * managers.length)],
      startDate: startDate.toISOString(),
      cohort: `Q${Math.floor(Math.random() * 4) + 1} 2025`,
      employeeType: employeeTypes[Math.floor(Math.random() * employeeTypes.length)],
      contractType: contractTypes[Math.floor(Math.random() * contractTypes.length)],
      level: levels[Math.floor(Math.random() * levels.length)],
    };
    employees.push(employee);

    // Determine if this employee has completed the journey
    // Employees who started earlier are more likely to have completed
    const daysSinceStart = Math.floor((Date.now() - startDate.getTime()) / (24 * 60 * 60 * 1000));
    const journeyDuration = 90; // ~90 days to complete
    const completionProbability = Math.min(daysSinceStart / journeyDuration, 1) * 0.7; // 70% max completion rate
    const hasCompleted = Math.random() < completionProbability;
    
    // Generate progress based on completion status
    let currentBlockIndex: number;
    let status: 'on_track' | 'at_risk' | 'delayed' | 'completed';
    let completedAt: Date | undefined;
    
    if (hasCompleted) {
      currentBlockIndex = blocks.length; // All blocks done
      status = 'completed';
      // Completed date is start date + journey duration (with some variation)
      const daysToComplete = journeyDuration + Math.floor((Math.random() - 0.5) * 30);
      completedAt = new Date(startDate.getTime() + daysToComplete * 24 * 60 * 60 * 1000);
      // Make sure completion date is not in the future
      if (completedAt > new Date()) {
        completedAt = new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000);
      }
    } else {
      // Calculate which block they should be on based on time elapsed
      const expectedBlock = Math.floor((daysSinceStart / journeyDuration) * blocks.length);
      currentBlockIndex = Math.min(Math.max(expectedBlock, 0), blocks.length - 1);
      
      const statuses: ('on_track' | 'at_risk' | 'delayed')[] = ['on_track', 'on_track', 'on_track', 'at_risk', 'delayed'];
      status = statuses[Math.floor(Math.random() * statuses.length)];
    }
    
    const currentBlock = blocks[Math.min(currentBlockIndex, blocks.length - 1)];
    const completedBlocks = blocks.slice(0, currentBlockIndex);

    const progress: EmployeeJourneyProgress = {
      id: `progress-${i}`,
      employeeId: employee.id,
      journeyId,
      currentBlockId: currentBlock.id,
      status,
      startedAt: employee.startDate,
      completedAt: completedAt?.toISOString(),
      completedBlockIds: completedBlocks.map((b) => b.id),
      blockProgress: blocks.map((block, idx) => {
        const isCompleted = idx < currentBlockIndex;
        const isCurrent = idx === currentBlockIndex && !hasCompleted;
        const sla = block.expectedDurationDays || 5;
        const daysSpent = isCompleted 
          ? sla + Math.floor((Math.random() - 0.3) * 3)
          : isCurrent 
            ? Math.floor(Math.random() * (sla + 5))
            : 0;

        // Calculate block dates based on progress
        const blockStartDate = new Date(startDate.getTime() + (idx * 15) * 24 * 60 * 60 * 1000);
        const blockEndDate = new Date(blockStartDate.getTime() + daysSpent * 24 * 60 * 60 * 1000);

        return {
          blockId: block.id,
          status: isCompleted || (hasCompleted && idx < blocks.length) ? 'completed' : isCurrent ? 'in_progress' : 'pending',
          startedAt: isCompleted || isCurrent || hasCompleted ? blockStartDate.toISOString() : undefined,
          completedAt: isCompleted || hasCompleted ? blockEndDate.toISOString() : undefined,
          daysSpent,
        };
      }),
    };
    employeeProgress.push(progress);
  }

  // ========== PERFORMANCE REVIEW JOURNEY (Active Stage) ==========
  const perfReviewJourneyId = 'journey-perf-review-1';
  
  const perfReviewPeriods: Period[] = [
    { id: 'perf-period-1', label: 'Preparation', offsetDays: -14, order: 0 },
    { id: 'perf-period-2', label: 'Self Review', offsetDays: 0, order: 1 },
    { id: 'perf-period-3', label: 'Manager Review', offsetDays: 7, order: 2 },
    { id: 'perf-period-4', label: 'Calibration', offsetDays: 14, order: 3 },
    { id: 'perf-period-5', label: 'Feedback', offsetDays: 21, order: 4 },
  ];

  const perfReviewBlocks: Block[] = [
    {
      id: 'perf-block-1',
      name: 'Goal Setting Review',
      journeyId: perfReviewJourneyId,
      periodId: 'perf-period-1',
      taskIds: ['perf-task-1', 'perf-task-2'],
      rules: [],
      dependencyBlockIds: [],
      expectedDurationDays: 7,
      description: 'Review and update goals before the performance cycle',
      category: 'Performance',
      order: 0,
    },
    {
      id: 'perf-block-2',
      name: 'Self Assessment',
      journeyId: perfReviewJourneyId,
      periodId: 'perf-period-2',
      taskIds: ['perf-task-3', 'perf-task-4'],
      rules: [],
      dependencyBlockIds: ['perf-block-1'],
      expectedDurationDays: 5,
      description: 'Complete self-evaluation form',
      category: 'Performance',
      order: 0,
    },
    {
      id: 'perf-block-3',
      name: 'Manager Evaluation',
      journeyId: perfReviewJourneyId,
      periodId: 'perf-period-3',
      taskIds: ['perf-task-5', 'perf-task-6'],
      rules: [
        {
          id: 'perf-rule-1',
          label: 'Skip level review for Seniors',
          condition: { attribute: 'level', operator: 'equals', value: 'Senior' },
          action: { type: 'add_task', addedTask: { title: 'Skip-level manager review', type: 'review' } },
        },
      ],
      dependencyBlockIds: ['perf-block-2'],
      expectedDurationDays: 7,
      description: 'Manager completes evaluation',
      category: 'Performance',
      order: 0,
    },
    {
      id: 'perf-block-4',
      name: 'Feedback Meeting',
      journeyId: perfReviewJourneyId,
      periodId: 'perf-period-5',
      taskIds: ['perf-task-7', 'perf-task-8'],
      rules: [],
      dependencyBlockIds: ['perf-block-3'],
      expectedDurationDays: 3,
      description: 'Deliver performance feedback to employee',
      category: 'Performance',
      order: 0,
    },
  ];

  const perfReviewTasks: Task[] = [
    { id: 'perf-task-1', blockId: 'perf-block-1', title: 'Review current goals', type: 'review', assigneeType: 'employee', order: 0 },
    { id: 'perf-task-2', blockId: 'perf-block-1', title: 'Update goal progress', type: 'data_input', assigneeType: 'employee', order: 1 },
    { id: 'perf-task-3', blockId: 'perf-block-2', title: 'Complete self-assessment form', type: 'data_input', assigneeType: 'employee', order: 0 },
    { id: 'perf-task-4', blockId: 'perf-block-2', title: 'Request peer feedback', type: 'basic', assigneeType: 'employee', order: 1 },
    { id: 'perf-task-5', blockId: 'perf-block-3', title: 'Review self-assessment', type: 'review', assigneeType: 'manager', order: 0 },
    { id: 'perf-task-6', blockId: 'perf-block-3', title: 'Complete manager evaluation', type: 'data_input', assigneeType: 'manager', order: 1 },
    { id: 'perf-task-7', blockId: 'perf-block-4', title: 'Schedule feedback meeting', type: 'basic', assigneeType: 'manager', order: 0 },
    { id: 'perf-task-8', blockId: 'perf-block-4', title: 'Acknowledge feedback receipt', type: 'signature', assigneeType: 'employee', order: 1 },
  ];

  const perfReviewJourney: Journey = {
    id: perfReviewJourneyId,
    name: 'Q1 Performance Review',
    type: 'training', // Using training as closest type for active employee processes
    anchorEvent: 'custom',
    periods: perfReviewPeriods,
    blockIds: perfReviewBlocks.map((b) => b.id),
    status: 'active',
    description: 'Quarterly performance review cycle for all active employees',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // ========== eNPS SURVEY JOURNEY (Active Stage) ==========
  const enpsJourneyId = 'journey-enps-1';
  
  const enpsPeriods: Period[] = [
    { id: 'enps-period-1', label: 'Survey Launch', offsetDays: 0, order: 0 },
    { id: 'enps-period-2', label: 'Reminder', offsetDays: 3, order: 1 },
    { id: 'enps-period-3', label: 'Close & Analyze', offsetDays: 7, order: 2 },
  ];

  const enpsBlocks: Block[] = [
    {
      id: 'enps-block-1',
      name: 'Complete Survey',
      journeyId: enpsJourneyId,
      periodId: 'enps-period-1',
      taskIds: ['enps-task-1'],
      rules: [],
      dependencyBlockIds: [],
      expectedDurationDays: 3,
      description: 'Employee completes the eNPS survey',
      category: 'Feedback',
      order: 0,
    },
    {
      id: 'enps-block-2',
      name: 'Manager Review Results',
      journeyId: enpsJourneyId,
      periodId: 'enps-period-3',
      taskIds: ['enps-task-2', 'enps-task-3'],
      rules: [],
      dependencyBlockIds: ['enps-block-1'],
      expectedDurationDays: 5,
      description: 'Managers review team results and plan actions',
      category: 'Feedback',
      order: 0,
    },
  ];

  const enpsTasks: Task[] = [
    { id: 'enps-task-1', blockId: 'enps-block-1', title: 'Complete eNPS survey', type: 'data_input', assigneeType: 'employee', order: 0 },
    { id: 'enps-task-2', blockId: 'enps-block-2', title: 'Review team results', type: 'review', assigneeType: 'manager', order: 0 },
    { id: 'enps-task-3', blockId: 'enps-block-2', title: 'Create action plan', type: 'data_input', assigneeType: 'manager', order: 1 },
  ];

  const enpsJourney: Journey = {
    id: enpsJourneyId,
    name: 'Monthly eNPS Survey',
    type: 'training',
    anchorEvent: 'custom',
    periods: enpsPeriods,
    blockIds: enpsBlocks.map((b) => b.id),
    status: 'active',
    description: 'Monthly employee satisfaction survey',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // ========== OFFBOARDING JOURNEY ==========
  const offboardingJourneyId = 'journey-offboarding-1';
  
  const offboardingPeriods: Period[] = [
    { id: 'off-period-1', label: 'Notice Period', offsetDays: -14, order: 0 },
    { id: 'off-period-2', label: 'Last Week', offsetDays: -7, order: 1 },
    { id: 'off-period-3', label: 'Last Day', offsetDays: 0, order: 2 },
    { id: 'off-period-4', label: 'Post-departure', offsetDays: 7, order: 3 },
  ];

  const offboardingBlocks: Block[] = [
    {
      id: 'off-block-1',
      name: 'Knowledge Transfer',
      journeyId: offboardingJourneyId,
      periodId: 'off-period-1',
      taskIds: ['off-task-1', 'off-task-2'],
      rules: [
        {
          id: 'off-rule-1',
          label: 'Manager handover for leads',
          condition: { attribute: 'level', operator: 'equals', value: 'Lead' },
          action: { type: 'add_task', addedTask: { title: 'Complete leadership handover document', type: 'data_input' } },
        },
      ],
      dependencyBlockIds: [],
      expectedDurationDays: 10,
      description: 'Document and transfer knowledge to team',
      category: 'Operations',
      order: 0,
    },
    {
      id: 'off-block-2',
      name: 'Exit Interview',
      journeyId: offboardingJourneyId,
      periodId: 'off-period-2',
      taskIds: ['off-task-3', 'off-task-4'],
      rules: [],
      dependencyBlockIds: ['off-block-1'],
      expectedDurationDays: 3,
      description: 'Conduct exit interview and collect feedback',
      category: 'HR',
      order: 0,
    },
    {
      id: 'off-block-3',
      name: 'IT Offboarding',
      journeyId: offboardingJourneyId,
      periodId: 'off-period-3',
      taskIds: ['off-task-5', 'off-task-6', 'off-task-7'],
      rules: [],
      dependencyBlockIds: ['off-block-2'],
      expectedDurationDays: 1,
      description: 'Revoke access and collect equipment',
      category: 'IT',
      order: 0,
    },
    {
      id: 'off-block-4',
      name: 'Final Settlement',
      journeyId: offboardingJourneyId,
      periodId: 'off-period-4',
      taskIds: ['off-task-8', 'off-task-9'],
      rules: [],
      dependencyBlockIds: ['off-block-3'],
      expectedDurationDays: 5,
      description: 'Process final payments and documentation',
      category: 'Finance',
      order: 0,
    },
  ];

  const offboardingTasks: Task[] = [
    { id: 'off-task-1', blockId: 'off-block-1', title: 'Document ongoing projects', type: 'data_input', assigneeType: 'employee', order: 0 },
    { id: 'off-task-2', blockId: 'off-block-1', title: 'Train replacement', type: 'basic', assigneeType: 'employee', order: 1 },
    { id: 'off-task-3', blockId: 'off-block-2', title: 'Schedule exit interview', type: 'basic', assigneeType: 'hr_manager', order: 0 },
    { id: 'off-task-4', blockId: 'off-block-2', title: 'Complete exit survey', type: 'data_input', assigneeType: 'employee', order: 1 },
    { id: 'off-task-5', blockId: 'off-block-3', title: 'Return laptop', type: 'basic', assigneeType: 'employee', order: 0 },
    { id: 'off-task-6', blockId: 'off-block-3', title: 'Revoke all access', type: 'basic', assigneeType: 'it_admin', order: 1 },
    { id: 'off-task-7', blockId: 'off-block-3', title: 'Backup employee data', type: 'basic', assigneeType: 'it_admin', order: 2 },
    { id: 'off-task-8', blockId: 'off-block-4', title: 'Process final paycheck', type: 'basic', assigneeType: 'hr_manager', order: 0 },
    { id: 'off-task-9', blockId: 'off-block-4', title: 'Send separation letter', type: 'basic', assigneeType: 'hr_manager', order: 1 },
  ];

  const offboardingJourney: Journey = {
    id: offboardingJourneyId,
    name: 'Standard Offboarding',
    type: 'offboarding',
    anchorEvent: 'end_date',
    periods: offboardingPeriods,
    blockIds: offboardingBlocks.map((b) => b.id),
    status: 'active',
    description: 'Standard offboarding process for departing employees',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Generate some progress for performance review (active employees)
  const perfReviewProgress: EmployeeJourneyProgress[] = [];
  const activeEmployeeCount = Math.floor(employees.length * 0.3); // 30% in perf review
  for (let i = 0; i < activeEmployeeCount; i++) {
    const employee = employees[i];
    const blockIndex = Math.floor(Math.random() * perfReviewBlocks.length);
    const statuses: ('on_track' | 'at_risk' | 'delayed')[] = ['on_track', 'on_track', 'on_track', 'at_risk', 'delayed'];
    
    perfReviewProgress.push({
      id: `perf-progress-${i}`,
      employeeId: employee.id,
      journeyId: perfReviewJourneyId,
      currentBlockId: perfReviewBlocks[blockIndex].id,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      startedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      completedBlockIds: perfReviewBlocks.slice(0, blockIndex).map(b => b.id),
      blockProgress: perfReviewBlocks.map((block, idx) => ({
        blockId: block.id,
        status: idx < blockIndex ? 'completed' : idx === blockIndex ? 'in_progress' : 'pending',
        daysSpent: idx <= blockIndex ? Math.floor(Math.random() * 5) + 1 : 0,
      })),
    });
  }

  // Generate some progress for offboarding
  const offboardingProgress: EmployeeJourneyProgress[] = [];
  const offboardingCount = Math.floor(employees.length * 0.02); // 2% offboarding
  for (let i = 0; i < offboardingCount; i++) {
    const employee = employees[employees.length - 1 - i]; // Last employees
    const blockIndex = Math.floor(Math.random() * offboardingBlocks.length);
    const statuses: ('on_track' | 'at_risk' | 'delayed')[] = ['on_track', 'on_track', 'at_risk'];
    
    offboardingProgress.push({
      id: `off-progress-${i}`,
      employeeId: employee.id,
      journeyId: offboardingJourneyId,
      currentBlockId: offboardingBlocks[blockIndex].id,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      startedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      completedBlockIds: offboardingBlocks.slice(0, blockIndex).map(b => b.id),
      blockProgress: offboardingBlocks.map((block, idx) => ({
        blockId: block.id,
        status: idx < blockIndex ? 'completed' : idx === blockIndex ? 'in_progress' : 'pending',
        daysSpent: idx <= blockIndex ? Math.floor(Math.random() * 3) + 1 : 0,
      })),
    });
  }

  return {
    journeys: [journey, perfReviewJourney, enpsJourney, offboardingJourney],
    blocks: [...blocks, ...perfReviewBlocks, ...enpsBlocks, ...offboardingBlocks],
    tasks: [...tasks, ...perfReviewTasks, ...enpsTasks, ...offboardingTasks],
    employees,
    employeeProgress: [...employeeProgress, ...perfReviewProgress, ...offboardingProgress],
  };
}
