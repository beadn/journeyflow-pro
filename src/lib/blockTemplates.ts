import { Scale, Monitor, Users, Smile, UsersRound, MessageSquare, GraduationCap, FileText, CheckSquare, Bell, Layers } from 'lucide-react';

export interface TemplateRule {
  id: string;
  label: string;
  condition: {
    attribute: string;
    operator: string;
    value: string;
  };
  action: {
    type: 'add_task' | 'add_block';
    addedTasks?: { title: string; type: string }[];
    addedBlockTemplateId?: string;
  };
}

export interface BlockTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: typeof Scale;
  expectedDurationDays?: number;
  suggestedTasks?: {
    title: string;
    type: 'basic' | 'data_input' | 'signature' | 'review' | 'notification';
    assigneeType: string;
  }[];
  rules?: TemplateRule[];
}

export const blockTemplates: BlockTemplate[] = [
  // Legal
  {
    id: 'template-contract-signing',
    name: 'Contract & Legal Setup',
    description: 'Employment contract and legal document signing',
    category: 'Legal',
    icon: Scale,
    expectedDurationDays: 5,
    suggestedTasks: [
      { title: 'Sign employment contract', type: 'signature', assigneeType: 'employee' },
      { title: 'Complete tax forms', type: 'data_input', assigneeType: 'employee' },
      { title: 'Review employee handbook', type: 'review', assigneeType: 'employee' },
    ],
  },
  {
    id: 'template-nda',
    name: 'NDA & Confidentiality',
    description: 'Non-disclosure and confidentiality agreements',
    category: 'Legal',
    icon: Scale,
    expectedDurationDays: 2,
    suggestedTasks: [
      { title: 'Sign NDA agreement', type: 'signature', assigneeType: 'employee' },
      { title: 'Confidentiality training', type: 'review', assigneeType: 'employee' },
    ],
    rules: [
      {
        id: 'rule-nda-contractor',
        label: 'Contractor NDA extras',
        condition: { attribute: 'employeeType', operator: 'equals', value: 'Contractor' },
        action: { 
          type: 'add_block', 
          addedBlockTemplateId: 'template-compliance-training' 
        },
      },
    ],
  },
  
  // IT
  {
    id: 'template-it-setup',
    name: 'IT Equipment Setup',
    description: 'Prepare and deliver IT equipment',
    category: 'IT',
    icon: Monitor,
    expectedDurationDays: 3,
    suggestedTasks: [
      { title: 'Prepare laptop', type: 'basic', assigneeType: 'it_admin' },
      { title: 'Create email account', type: 'basic', assigneeType: 'it_admin' },
      { title: 'Setup VPN access', type: 'basic', assigneeType: 'it_admin' },
    ],
  },
  {
    id: 'template-software-access',
    name: 'Software & Access',
    description: 'Configure software licenses and system access',
    category: 'IT',
    icon: Monitor,
    expectedDurationDays: 2,
    suggestedTasks: [
      { title: 'Slack workspace access', type: 'basic', assigneeType: 'it_admin' },
      { title: 'Project management tool access', type: 'basic', assigneeType: 'it_admin' },
      { title: 'Department-specific tools', type: 'basic', assigneeType: 'it_admin' },
    ],
  },
  
  // HR
  {
    id: 'template-hr-orientation',
    name: 'HR Orientation',
    description: 'Company policies and HR onboarding',
    category: 'HR',
    icon: Users,
    expectedDurationDays: 1,
    suggestedTasks: [
      { title: 'Welcome meeting with HR', type: 'basic', assigneeType: 'hr_manager' },
      { title: 'Benefits enrollment', type: 'data_input', assigneeType: 'employee' },
      { title: 'Company policies review', type: 'review', assigneeType: 'employee' },
    ],
  },
  {
    id: 'template-payroll-setup',
    name: 'Payroll Setup',
    description: 'Configure payroll and banking details',
    category: 'HR',
    icon: Users,
    expectedDurationDays: 2,
    suggestedTasks: [
      { title: 'Enter banking details', type: 'data_input', assigneeType: 'employee' },
      { title: 'Verify payroll information', type: 'review', assigneeType: 'hr_manager' },
    ],
  },
  
  // Welcome
  {
    id: 'template-first-day',
    name: 'First Day Welcome',
    description: 'Welcome activities and office introduction',
    category: 'Welcome',
    icon: Smile,
    expectedDurationDays: 1,
    suggestedTasks: [
      { title: 'Office tour', type: 'basic', assigneeType: 'buddy' },
      { title: 'Collect equipment', type: 'basic', assigneeType: 'employee' },
      { title: 'Welcome lunch', type: 'basic', assigneeType: 'manager' },
    ],
  },
  {
    id: 'template-buddy-program',
    name: 'Buddy Program',
    description: 'Assign and connect with onboarding buddy',
    category: 'Welcome',
    icon: Smile,
    expectedDurationDays: 5,
    suggestedTasks: [
      { title: 'Buddy introduction meeting', type: 'basic', assigneeType: 'buddy' },
      { title: 'Weekly buddy check-ins', type: 'basic', assigneeType: 'buddy' },
    ],
  },
  
  // Team
  {
    id: 'template-team-intro',
    name: 'Team Introduction',
    description: 'Meet team members and key stakeholders',
    category: 'Team',
    icon: UsersRound,
    expectedDurationDays: 5,
    suggestedTasks: [
      { title: 'Team meeting introduction', type: 'basic', assigneeType: 'manager' },
      { title: '1:1 with team members', type: 'basic', assigneeType: 'employee' },
      { title: 'Stakeholder introductions', type: 'basic', assigneeType: 'manager' },
    ],
  },
  {
    id: 'template-cross-functional',
    name: 'Cross-functional Meetings',
    description: 'Meet other departments and teams',
    category: 'Team',
    icon: UsersRound,
    expectedDurationDays: 7,
    suggestedTasks: [
      { title: 'Meet Product team', type: 'basic', assigneeType: 'manager' },
      { title: 'Meet Engineering team', type: 'basic', assigneeType: 'manager' },
      { title: 'Meet Sales team', type: 'basic', assigneeType: 'manager' },
    ],
  },
  
  // Feedback
  {
    id: 'template-30-day-review',
    name: '30-day Check-in',
    description: 'First month review and feedback',
    category: 'Feedback',
    icon: MessageSquare,
    expectedDurationDays: 3,
    suggestedTasks: [
      { title: 'Complete 30-day survey', type: 'data_input', assigneeType: 'employee' },
      { title: '30-day review meeting', type: 'review', assigneeType: 'hr_manager' },
    ],
  },
  {
    id: 'template-90-day-review',
    name: '90-day Review',
    description: 'Probation period review and assessment',
    category: 'Feedback',
    icon: MessageSquare,
    expectedDurationDays: 5,
    suggestedTasks: [
      { title: 'Self-assessment', type: 'data_input', assigneeType: 'employee' },
      { title: 'Manager performance review', type: 'review', assigneeType: 'manager' },
      { title: 'Probation sign-off', type: 'signature', assigneeType: 'hr_manager' },
    ],
  },
  
  // Training
  {
    id: 'template-compliance-training',
    name: 'Compliance Training',
    description: 'Required compliance and safety training',
    category: 'Training',
    icon: GraduationCap,
    expectedDurationDays: 3,
    suggestedTasks: [
      { title: 'Security awareness training', type: 'review', assigneeType: 'employee' },
      { title: 'Data privacy training', type: 'review', assigneeType: 'employee' },
      { title: 'Compliance certification', type: 'data_input', assigneeType: 'employee' },
    ],
  },
  {
    id: 'template-role-training',
    name: 'Role-specific Training',
    description: 'Job-specific skills and tools training',
    category: 'Training',
    icon: GraduationCap,
    expectedDurationDays: 10,
    suggestedTasks: [
      { title: 'Tool-specific training', type: 'review', assigneeType: 'employee' },
      { title: 'Process documentation review', type: 'review', assigneeType: 'employee' },
      { title: 'Shadow senior team member', type: 'basic', assigneeType: 'manager' },
    ],
  },
];

export const blockCategories = [
  { id: 'Legal', label: 'Legal', icon: Scale, color: 'category-legal' },
  { id: 'IT', label: 'IT', icon: Monitor, color: 'category-it' },
  { id: 'HR', label: 'HR', icon: Users, color: 'category-hr' },
  { id: 'Welcome', label: 'Welcome', icon: Smile, color: 'category-welcome' },
  { id: 'Team', label: 'Team', icon: UsersRound, color: 'category-team' },
  { id: 'Feedback', label: 'Feedback', icon: MessageSquare, color: 'category-feedback' },
  { id: 'Training', label: 'Training', icon: GraduationCap, color: 'category-training' },
];

export const getTemplatesByCategory = (category: string) => {
  return blockTemplates.filter(t => t.category === category);
};
