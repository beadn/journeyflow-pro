import { useState, useRef, useEffect, useCallback } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useJourneyStore } from '@/stores/journeyStore';
import { Journey, Block, Task, Period } from '@/types/journey';
import { cn } from '@/lib/utils';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Loader2,
  CheckCircle2,
  Layers,
  Clock,
  RefreshCw,
  Plus,
  FileText,
  Users,
  Building,
  Briefcase,
  GraduationCap,
  Settings,
  UserCheck,
  Calendar,
  ArrowRight,
  Zap,
  Target
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  journeyPreview?: GeneratedJourney;
  editPreview?: EditPreview;
  options?: QuickOption[];
}

interface QuickOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
  action: string;
}

interface GeneratedJourney {
  name: string;
  description: string;
  anchorEvent: string;
  periods: Array<{
    label: string;
    offsetDays: number;
    blocks: Array<{
      name: string;
      category: string;
      tasks: Array<{
        title: string;
        assigneeType: string;
      }>;
    }>;
  }>;
}

interface EditPreview {
  type: 'add_block' | 'add_period' | 'add_tasks' | 'suggestion';
  periodId?: string;
  blockName?: string;
  category?: string;
  tasks?: Array<{ title: string; assigneeType: string }>;
  periodLabel?: string;
  offsetDays?: number;
}

interface AIJourneyChatProps {
  isOpen: boolean;
  onClose: () => void;
  onJourneyCreated: (journeyId: string) => void;
  existingJourneyId?: string;
}

// Journey generation templates
const journeyTemplates: Record<string, GeneratedJourney> = {
  engineering_onboarding: {
    name: 'Engineering Onboarding',
    description: 'Complete onboarding journey for software engineers',
    anchorEvent: 'hire_date',
    periods: [
      {
        label: 'Pre-boarding',
        offsetDays: -7,
        blocks: [
          {
            name: 'Contract & Legal',
            category: 'legal',
            tasks: [
              { title: 'Sign employment contract', assigneeType: 'employee' },
              { title: 'Complete tax documentation', assigneeType: 'employee' },
              { title: 'NDA signature', assigneeType: 'employee' },
              { title: 'Review employee handbook', assigneeType: 'employee' },
            ]
          },
          {
            name: 'IT Preparation',
            category: 'it',
            tasks: [
              { title: 'Order laptop and peripherals', assigneeType: 'it_admin' },
              { title: 'Create email account', assigneeType: 'it_admin' },
              { title: 'Set up Slack and communication tools', assigneeType: 'it_admin' },
              { title: 'Provision GitHub access', assigneeType: 'it_admin' },
            ]
          }
        ]
      },
      {
        label: 'Day 1',
        offsetDays: 0,
        blocks: [
          {
            name: 'Welcome & Orientation',
            category: 'welcome',
            tasks: [
              { title: 'Welcome meeting with HR', assigneeType: 'hr_manager' },
              { title: 'Office tour and workspace setup', assigneeType: 'manager' },
              { title: 'Meet the team introduction', assigneeType: 'manager' },
              { title: 'Company mission and values overview', assigneeType: 'hr_manager' },
            ]
          },
          {
            name: 'Dev Environment Setup',
            category: 'it',
            tasks: [
              { title: 'Clone main repositories', assigneeType: 'employee' },
              { title: 'Install development tools and IDE', assigneeType: 'employee' },
              { title: 'Configure local environment', assigneeType: 'employee' },
              { title: 'Access to staging environment', assigneeType: 'it_admin' },
              { title: 'Run first local build', assigneeType: 'employee' },
            ]
          }
        ]
      },
      {
        label: 'First Week',
        offsetDays: 7,
        blocks: [
          {
            name: 'Technical Training',
            category: 'training',
            tasks: [
              { title: 'Architecture deep-dive session', assigneeType: 'manager' },
              { title: 'Code standards and review guidelines', assigneeType: 'employee' },
              { title: 'CI/CD pipeline walkthrough', assigneeType: 'manager' },
              { title: 'Testing framework introduction', assigneeType: 'employee' },
            ]
          },
          {
            name: 'Team Integration',
            category: 'team',
            tasks: [
              { title: '1:1 with engineering manager', assigneeType: 'manager' },
              { title: 'Buddy system pairing', assigneeType: 'employee' },
              { title: 'Cross-team introductions', assigneeType: 'employee' },
              { title: 'First sprint planning participation', assigneeType: 'employee' },
            ]
          }
        ]
      },
      {
        label: 'First Month',
        offsetDays: 30,
        blocks: [
          {
            name: '30-Day Review',
            category: 'feedback',
            tasks: [
              { title: 'Self-assessment completion', assigneeType: 'employee' },
              { title: '30-day check-in with manager', assigneeType: 'manager' },
              { title: 'Initial goals review', assigneeType: 'manager' },
              { title: 'Feedback collection from team', assigneeType: 'hr_manager' },
            ]
          },
          {
            name: 'First Contribution',
            category: 'training',
            tasks: [
              { title: 'First PR submitted and reviewed', assigneeType: 'employee' },
              { title: 'Documentation contribution', assigneeType: 'employee' },
              { title: 'On-call shadowing session', assigneeType: 'manager' },
            ]
          }
        ]
      },
      {
        label: '90 Days',
        offsetDays: 90,
        blocks: [
          {
            name: 'Probation Review',
            category: 'feedback',
            tasks: [
              { title: 'Comprehensive performance review', assigneeType: 'manager' },
              { title: 'Career path discussion', assigneeType: 'manager' },
              { title: 'Probation period assessment', assigneeType: 'hr_manager' },
              { title: 'Long-term goals setting', assigneeType: 'employee' },
            ]
          }
        ]
      }
    ]
  },
  sales_onboarding: {
    name: 'Sales Onboarding',
    description: 'Complete onboarding journey for sales representatives',
    anchorEvent: 'hire_date',
    periods: [
      {
        label: 'Pre-boarding',
        offsetDays: -7,
        blocks: [
          {
            name: 'Contract & Legal',
            category: 'legal',
            tasks: [
              { title: 'Sign employment contract', assigneeType: 'employee' },
              { title: 'Commission structure review', assigneeType: 'hr_manager' },
              { title: 'NDA and non-compete agreement', assigneeType: 'employee' },
            ]
          }
        ]
      },
      {
        label: 'Day 1',
        offsetDays: 0,
        blocks: [
          {
            name: 'Welcome & Orientation',
            category: 'welcome',
            tasks: [
              { title: 'Welcome meeting with HR', assigneeType: 'hr_manager' },
              { title: 'Meet the sales team', assigneeType: 'manager' },
              { title: 'Company overview and culture', assigneeType: 'hr_manager' },
            ]
          },
          {
            name: 'Sales Tools Setup',
            category: 'it',
            tasks: [
              { title: 'CRM access and setup (Salesforce)', assigneeType: 'it_admin' },
              { title: 'Sales enablement platform access', assigneeType: 'it_admin' },
              { title: 'Communication tools setup', assigneeType: 'employee' },
              { title: 'Calendar and meeting tools', assigneeType: 'employee' },
            ]
          }
        ]
      },
      {
        label: 'First Week',
        offsetDays: 7,
        blocks: [
          {
            name: 'Product Training',
            category: 'training',
            tasks: [
              { title: 'Product deep-dive sessions', assigneeType: 'manager' },
              { title: 'Competitive landscape analysis', assigneeType: 'employee' },
              { title: 'Value proposition workshop', assigneeType: 'manager' },
              { title: 'Demo certification', assigneeType: 'employee' },
            ]
          },
          {
            name: 'Sales Methodology',
            category: 'training',
            tasks: [
              { title: 'Sales playbook review', assigneeType: 'employee' },
              { title: 'Objection handling training', assigneeType: 'manager' },
              { title: 'Pipeline management training', assigneeType: 'manager' },
            ]
          }
        ]
      },
      {
        label: 'First Month',
        offsetDays: 30,
        blocks: [
          {
            name: 'Sales Activation',
            category: 'training',
            tasks: [
              { title: 'First customer calls (shadowing)', assigneeType: 'manager' },
              { title: 'First solo demo', assigneeType: 'employee' },
              { title: 'First qualified lead', assigneeType: 'employee' },
            ]
          },
          {
            name: '30-Day Review',
            category: 'feedback',
            tasks: [
              { title: 'Performance review with manager', assigneeType: 'manager' },
              { title: 'Sales targets alignment', assigneeType: 'manager' },
              { title: 'Coaching session', assigneeType: 'manager' },
            ]
          }
        ]
      }
    ]
  },
  offboarding: {
    name: 'Employee Offboarding',
    description: 'Structured offboarding process for departing employees',
    anchorEvent: 'termination_date',
    periods: [
      {
        label: '2 Weeks Before',
        offsetDays: -14,
        blocks: [
          {
            name: 'Knowledge Transfer',
            category: 'training',
            tasks: [
              { title: 'Document current projects', assigneeType: 'employee' },
              { title: 'Create handover documentation', assigneeType: 'employee' },
              { title: 'Identify successors for responsibilities', assigneeType: 'manager' },
              { title: 'Schedule knowledge transfer sessions', assigneeType: 'manager' },
            ]
          }
        ]
      },
      {
        label: 'Last Week',
        offsetDays: -7,
        blocks: [
          {
            name: 'Transition',
            category: 'hr',
            tasks: [
              { title: 'Complete project handovers', assigneeType: 'employee' },
              { title: 'Transfer account ownership', assigneeType: 'it_admin' },
              { title: 'Update team documentation', assigneeType: 'employee' },
              { title: 'Farewell team meeting', assigneeType: 'manager' },
            ]
          }
        ]
      },
      {
        label: 'Last Day',
        offsetDays: 0,
        blocks: [
          {
            name: 'Exit Process',
            category: 'hr',
            tasks: [
              { title: 'Exit interview', assigneeType: 'hr_manager' },
              { title: 'Return equipment (laptop, badge, keys)', assigneeType: 'employee' },
              { title: 'Revoke all system access', assigneeType: 'it_admin' },
              { title: 'Final paycheck and benefits info', assigneeType: 'hr_manager' },
              { title: 'Alumni network invitation', assigneeType: 'hr_manager' },
            ]
          }
        ]
      }
    ]
  }
};

// Block templates for editing
const blockTemplates: Record<string, { name: string; category: string; tasks: Array<{ title: string; assigneeType: string }> }> = {
  training: {
    name: 'Training Session',
    category: 'training',
    tasks: [
      { title: 'Complete training module', assigneeType: 'employee' },
      { title: 'Knowledge assessment quiz', assigneeType: 'employee' },
      { title: 'Training feedback survey', assigneeType: 'employee' },
    ]
  },
  it_setup: {
    name: 'IT Setup',
    category: 'it',
    tasks: [
      { title: 'System access configuration', assigneeType: 'it_admin' },
      { title: 'Tools installation and setup', assigneeType: 'employee' },
      { title: 'Security training completion', assigneeType: 'employee' },
    ]
  },
  feedback: {
    name: 'Feedback & Review',
    category: 'feedback',
    tasks: [
      { title: 'Self-assessment completion', assigneeType: 'employee' },
      { title: 'Manager review meeting', assigneeType: 'manager' },
      { title: 'Goals alignment discussion', assigneeType: 'manager' },
    ]
  },
  team_building: {
    name: 'Team Integration',
    category: 'team',
    tasks: [
      { title: 'Team introduction session', assigneeType: 'manager' },
      { title: 'Buddy assignment and pairing', assigneeType: 'hr_manager' },
      { title: 'Team lunch or coffee chat', assigneeType: 'employee' },
    ]
  },
  compliance: {
    name: 'Compliance Training',
    category: 'legal',
    tasks: [
      { title: 'Data privacy training', assigneeType: 'employee' },
      { title: 'Code of conduct review', assigneeType: 'employee' },
      { title: 'Security awareness training', assigneeType: 'employee' },
    ]
  }
};

export function AIJourneyChat({ isOpen, onClose, onJourneyCreated, existingJourneyId }: AIJourneyChatProps) {
  const { addJourney, addBlock, addTask, addPeriod, getJourneyById, getBlocksByJourneyId, getTasksByBlockId } = useJourneyStore();
  
  const existingJourney = existingJourneyId ? getJourneyById(existingJourneyId) : null;
  const journeyBlocks = existingJourneyId ? getBlocksByJourneyId(existingJourneyId) : [];
  
  const getWelcomeMessage = (): Message => {
    if (existingJourney) {
      const taskCount = journeyBlocks.reduce((acc, b) => acc + getTasksByBlockId(b.id).length, 0);
      return {
        id: 'welcome',
        role: 'assistant',
        content: `Hi! 👋 I'm your AI assistant for **${existingJourney.name}**.\n\n📊 **Current journey:**\n• ${existingJourney.periods.length} time periods\n• ${journeyBlocks.length} blocks\n• ${taskCount} total tasks\n\nHow can I help you improve this journey?`,
        timestamp: new Date(),
        options: [
          { id: 'add_block', label: 'Add a new block', icon: <Plus className="w-3 h-3" />, action: 'I want to add a new block' },
          { id: 'add_period', label: 'Add a time period', icon: <Calendar className="w-3 h-3" />, action: 'I want to add a new time period' },
          { id: 'suggestions', label: 'Suggest improvements', icon: <Zap className="w-3 h-3" />, action: 'Suggest improvements for this journey' },
        ]
      };
    }
    return {
      id: 'welcome',
      role: 'assistant',
      content: "Hi! 👋 I'm your AI assistant for creating employee journeys. Let's build something great together!\n\n**What type of journey would you like to create?**",
      timestamp: new Date(),
      options: [
        { id: 'eng', label: 'Engineering Onboarding', icon: <Settings className="w-3 h-3" />, action: 'Create an engineering onboarding journey' },
        { id: 'sales', label: 'Sales Onboarding', icon: <Briefcase className="w-3 h-3" />, action: 'Create a sales onboarding journey' },
        { id: 'offboard', label: 'Offboarding', icon: <UserCheck className="w-3 h-3" />, action: 'Create an offboarding journey' },
        { id: 'custom', label: 'Custom Journey', icon: <Target className="w-3 h-3" />, action: 'I want to create a custom journey' },
      ]
    };
  };

  const [messages, setMessages] = useState<Message[]>([getWelcomeMessage()]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [pendingJourney, setPendingJourney] = useState<GeneratedJourney | null>(null);
  const [pendingEdit, setPendingEdit] = useState<EditPreview | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setMessages([getWelcomeMessage()]);
      setPendingJourney(null);
      setPendingEdit(null);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, existingJourneyId]);

  const processMessage = useCallback((userText: string): { content: string; journey?: GeneratedJourney; edit?: EditPreview; options?: QuickOption[] } => {
    const lower = userText.toLowerCase();
    
    // EDIT MODE
    if (existingJourney) {
      // Add block
      if (lower.includes('add') && (lower.includes('block') || lower.includes('section'))) {
        let template = blockTemplates.training;
        let periodId = existingJourney.periods[0]?.id;
        
        if (lower.includes('it') || lower.includes('tech') || lower.includes('setup')) {
          template = blockTemplates.it_setup;
        } else if (lower.includes('feedback') || lower.includes('review')) {
          template = blockTemplates.feedback;
        } else if (lower.includes('team') || lower.includes('integration')) {
          template = blockTemplates.team_building;
        } else if (lower.includes('compliance') || lower.includes('security')) {
          template = blockTemplates.compliance;
        }
        
        // Find the right period
        if (lower.includes('day 1') || lower.includes('first day') || lower.includes('day 0')) {
          const p = existingJourney.periods.find(p => p.offsetDays === 0);
          if (p) periodId = p.id;
        } else if (lower.includes('week') || lower.includes('7')) {
          const p = existingJourney.periods.find(p => p.offsetDays === 7 || p.label.toLowerCase().includes('week'));
          if (p) periodId = p.id;
        } else if (lower.includes('month') || lower.includes('30')) {
          const p = existingJourney.periods.find(p => p.offsetDays >= 30);
          if (p) periodId = p.id;
        }
        
        const targetPeriod = existingJourney.periods.find(p => p.id === periodId);
        
        return {
          content: `Great! I've prepared a **"${template.name}"** block for **${targetPeriod?.label || 'the journey'}**:\n\n📦 **Block:** ${template.name}\n📁 **Category:** ${template.category}\n\n**Tasks included:**\n${template.tasks.map(t => `• ${t.title}`).join('\n')}\n\nShould I add this to the journey?`,
          edit: {
            type: 'add_block',
            periodId,
            blockName: template.name,
            category: template.category,
            tasks: template.tasks,
          },
          options: [
            { id: 'confirm', label: 'Yes, add it!', icon: <CheckCircle2 className="w-3 h-3" />, action: 'confirm_add_block' },
            { id: 'modify', label: 'Modify first', icon: <Settings className="w-3 h-3" />, action: 'I want to modify this block before adding' },
          ]
        };
      }
      
      // Add period
      if (lower.includes('add') && (lower.includes('period') || lower.includes('phase') || lower.includes('milestone'))) {
        let offsetDays = 60;
        let periodLabel = '60 Days';
        
        if (lower.includes('90') || lower.includes('three month')) {
          offsetDays = 90;
          periodLabel = '90 Days';
        } else if (lower.includes('6 month') || lower.includes('180')) {
          offsetDays = 180;
          periodLabel = '6 Months';
        } else if (lower.includes('year') || lower.includes('365')) {
          offsetDays = 365;
          periodLabel = '1 Year';
        }
        
        return {
          content: `I'll create a new time period: **"${periodLabel}"** (Day ${offsetDays}).\n\nThis will be added to your journey timeline. Should I proceed?`,
          edit: {
            type: 'add_period',
            periodLabel,
            offsetDays,
          },
          options: [
            { id: 'confirm', label: 'Yes, add it!', icon: <CheckCircle2 className="w-3 h-3" />, action: 'confirm_add_period' },
            { id: 'change', label: 'Different timing', icon: <Clock className="w-3 h-3" />, action: 'I want a different time period' },
          ]
        };
      }
      
      // Suggestions
      if (lower.includes('suggest') || lower.includes('improve') || lower.includes('recommendation')) {
        const suggestions: string[] = [];
        
        const has90Day = existingJourney.periods.some(p => p.offsetDays >= 90);
        const hasFeedback = journeyBlocks.some(b => b.category === 'feedback');
        const hasCompliance = journeyBlocks.some(b => b.name.toLowerCase().includes('compliance'));
        
        if (!has90Day) {
          suggestions.push("• **Add a 90-day review period** - Critical for probation assessment");
        }
        if (!hasFeedback) {
          suggestions.push("• **Add feedback blocks** - Regular check-ins improve retention");
        }
        if (!hasCompliance) {
          suggestions.push("• **Add compliance training** - Essential for risk management");
        }
        if (journeyBlocks.length < 6) {
          suggestions.push("• **Add more training content** - Deeper onboarding improves productivity");
        }
        
        if (suggestions.length === 0) {
          return {
            content: "Your journey looks comprehensive! 🎉 It has good coverage across different periods and includes essential blocks.\n\nIf you'd like, I can help you:\n• Add more specialized training\n• Create conditional blocks for different employee types\n• Refine existing tasks",
            options: [
              { id: 'training', label: 'Add training block', action: 'Add a training block' },
              { id: 'period', label: 'Add time period', action: 'Add a new period' },
            ]
          };
        }
        
        return {
          content: `Here are my recommendations for **${existingJourney.name}**:\n\n${suggestions.join('\n')}\n\nWould you like me to implement any of these?`,
          options: suggestions.map((s, i) => ({
            id: `sug_${i}`,
            label: s.split('**')[1] || `Suggestion ${i + 1}`,
            action: s.includes('90-day') ? 'Add a 90 day review period' : 
                   s.includes('feedback') ? 'Add a feedback block' :
                   s.includes('compliance') ? 'Add a compliance training block' : 'Add a training block'
          }))
        };
      }
      
      // Confirm actions
      if (lower.includes('confirm_add_block') || (lower.includes('yes') && pendingEdit?.type === 'add_block')) {
        return {
          content: "Done! ✅ I've added the block to your journey. You can see it in the timeline view.\n\nWhat else would you like to do?",
          options: [
            { id: 'more', label: 'Add another block', action: 'I want to add another block' },
            { id: 'done', label: 'I\'m done', action: 'close' },
          ]
        };
      }
      
      if (lower.includes('confirm_add_period') || (lower.includes('yes') && pendingEdit?.type === 'add_period')) {
        return {
          content: "Done! ✅ The new period has been added to your journey.\n\nWould you like to add blocks to this period?",
          options: [
            { id: 'add_blocks', label: 'Add blocks to it', action: 'Add a block to the new period' },
            { id: 'done', label: 'I\'m done', action: 'close' },
          ]
        };
      }
      
      // Default for edit mode
      return {
        content: `I can help you modify **${existingJourney.name}**. What would you like to do?`,
        options: [
          { id: 'add_block', label: 'Add a block', action: 'Add a new block' },
          { id: 'add_period', label: 'Add a period', action: 'Add a new time period' },
          { id: 'suggest', label: 'Get suggestions', action: 'Suggest improvements' },
        ]
      };
    }
    
    // CREATE MODE
    
    // Engineering onboarding
    if (lower.includes('engineer') || lower.includes('developer') || lower.includes('tech') || lower.includes('software')) {
      return {
        content: `Excellent choice! I've designed an **Engineering Onboarding** journey:\n\n📋 **Overview:**\n• 5 time periods (Pre-boarding to 90 days)\n• 9 blocks covering all aspects\n• 40+ tasks for a complete experience\n\n⏱️ **Timeline:**\n• **Pre-boarding** (-7 days): Contract & IT setup\n• **Day 1**: Welcome & Dev environment\n• **First Week**: Technical training & team integration\n• **First Month**: First contribution & review\n• **90 Days**: Probation assessment\n\nThis includes everything from setting up their dev environment to their first PR!`,
        journey: journeyTemplates.engineering_onboarding,
        options: [
          { id: 'create', label: 'Create this journey', icon: <CheckCircle2 className="w-3 h-3" />, action: 'create_engineering' },
          { id: 'customize', label: 'Customize first', icon: <Settings className="w-3 h-3" />, action: 'I want to customize it first' },
        ]
      };
    }
    
    // Sales onboarding
    if (lower.includes('sales') || lower.includes('commercial') || lower.includes('business development')) {
      return {
        content: `Great! I've prepared a **Sales Onboarding** journey:\n\n📋 **Overview:**\n• 4 time periods\n• 7 blocks focused on sales excellence\n• Product knowledge to first qualified lead\n\n⏱️ **Timeline:**\n• **Pre-boarding**: Contracts & commission structure\n• **Day 1**: Welcome & CRM setup\n• **First Week**: Product & methodology training\n• **First Month**: Sales activation & review\n\nDesigned to get reps productive and hitting quota faster!`,
        journey: journeyTemplates.sales_onboarding,
        options: [
          { id: 'create', label: 'Create this journey', icon: <CheckCircle2 className="w-3 h-3" />, action: 'create_sales' },
          { id: 'customize', label: 'Customize first', icon: <Settings className="w-3 h-3" />, action: 'I want to customize it first' },
        ]
      };
    }
    
    // Offboarding
    if (lower.includes('offboard') || lower.includes('exit') || lower.includes('leaving') || lower.includes('departure')) {
      return {
        content: `I've created an **Offboarding** journey:\n\n📋 **Overview:**\n• 3 time periods\n• 3 blocks for smooth transitions\n• Knowledge transfer to final day\n\n⏱️ **Timeline:**\n• **2 Weeks Before**: Knowledge transfer\n• **Last Week**: Transition & handover\n• **Last Day**: Exit process & alumni\n\nEnsures proper handoffs and a positive last impression!`,
        journey: journeyTemplates.offboarding,
        options: [
          { id: 'create', label: 'Create this journey', icon: <CheckCircle2 className="w-3 h-3" />, action: 'create_offboarding' },
          { id: 'customize', label: 'Customize first', icon: <Settings className="w-3 h-3" />, action: 'I want to customize it first' },
        ]
      };
    }
    
    // Custom journey
    if (lower.includes('custom') || lower.includes('different') || lower.includes('other')) {
      return {
        content: "Let's create a custom journey! Tell me more about:\n\n• **What type of journey** is this? (onboarding, promotion, transfer...)\n• **Who is it for?** (department, role, level...)\n• **Any special requirements?** (remote, international, compliance...)\n\nThe more details you provide, the better I can tailor it!",
      };
    }
    
    // Create journey commands
    if (lower.includes('create_engineering') || (lower.includes('create') && lower.includes('engineer'))) {
      return {
        content: "🎉 **Engineering Onboarding** has been created!\n\nYou can now:\n• View it in the timeline\n• Add more blocks or tasks\n• Customize any section\n\nWould you like me to help you customize it further?",
        journey: journeyTemplates.engineering_onboarding,
        options: [
          { id: 'customize', label: 'Yes, customize it', action: 'I want to add more blocks' },
          { id: 'done', label: 'No, I\'ll explore it', action: 'close' },
        ]
      };
    }
    
    if (lower.includes('create_sales') || (lower.includes('create') && lower.includes('sales'))) {
      return {
        content: "🎉 **Sales Onboarding** has been created!\n\nYou can now view and customize it in the builder.\n\nWould you like me to help you add more content?",
        journey: journeyTemplates.sales_onboarding,
        options: [
          { id: 'customize', label: 'Yes, add more', action: 'I want to add more blocks' },
          { id: 'done', label: 'No, looks good', action: 'close' },
        ]
      };
    }
    
    if (lower.includes('create_offboarding') || (lower.includes('create') && lower.includes('offboard'))) {
      return {
        content: "🎉 **Offboarding** journey has been created!\n\nReady for you to customize in the builder.\n\nNeed any modifications?",
        journey: journeyTemplates.offboarding,
        options: [
          { id: 'customize', label: 'Yes, modify it', action: 'I want to modify it' },
          { id: 'done', label: 'No, perfect', action: 'close' },
        ]
      };
    }
    
    // General help
    if (lower.includes('help') || lower.includes('what can')) {
      return {
        content: "I can help you with:\n\n🚀 **Create journeys:**\n• Engineering/Sales/General onboarding\n• Offboarding processes\n• Custom journeys\n\n✏️ **Modify journeys:**\n• Add blocks and tasks\n• Add time periods\n• Get AI suggestions\n\nJust tell me what you need!",
        options: [
          { id: 'eng', label: 'Engineering Onboarding', action: 'Create an engineering onboarding' },
          { id: 'sales', label: 'Sales Onboarding', action: 'Create a sales onboarding' },
          { id: 'off', label: 'Offboarding', action: 'Create an offboarding journey' },
        ]
      };
    }
    
    // Default
    return {
      content: "I'd be happy to help! What type of employee journey would you like to create?\n\nYou can say things like:\n• *\"Create an engineering onboarding\"*\n• *\"Build a sales onboarding journey\"*\n• *\"I need an offboarding process\"*",
      options: [
        { id: 'eng', label: 'Engineering Onboarding', action: 'Create an engineering onboarding' },
        { id: 'sales', label: 'Sales Onboarding', action: 'Create a sales onboarding' },
        { id: 'off', label: 'Offboarding', action: 'Create an offboarding journey' },
      ]
    };
  }, [existingJourney, journeyBlocks, pendingEdit]);

  const executeEdit = useCallback((edit: EditPreview) => {
    if (!existingJourneyId || !existingJourney) return;
    
    if (edit.type === 'add_block' && edit.periodId && edit.blockName && edit.category) {
      const blockId = `block-ai-${Date.now()}`;
      const newBlock: Block = {
        id: blockId,
        journeyId: existingJourneyId,
        periodId: edit.periodId,
        name: edit.blockName,
        category: edit.category,
        order: journeyBlocks.filter(b => b.periodId === edit.periodId).length,
        dependencyBlockIds: [],
        rules: [],
        expectedDurationDays: 3
      };
      addBlock(newBlock);
      
      edit.tasks?.forEach((taskData, index) => {
        const task: Task = {
          id: `task-ai-${Date.now()}-${index}`,
          blockId,
          title: taskData.title,
          type: 'basic',
          assigneeType: taskData.assigneeType,
          order: index
        };
        addTask(task);
      });
    }
    
    if (edit.type === 'add_period' && edit.periodLabel && edit.offsetDays !== undefined) {
      const newPeriod: Period = {
        id: `period-ai-${Date.now()}`,
        label: edit.periodLabel,
        offsetDays: edit.offsetDays,
        order: existingJourney.periods.length
      };
      addPeriod(existingJourneyId, newPeriod);
    }
  }, [existingJourneyId, existingJourney, journeyBlocks, addBlock, addTask, addPeriod]);

  const createJourneyFromTemplate = useCallback((template: GeneratedJourney) => {
    const journeyId = `journey-ai-${Date.now()}`;
    const periods: Period[] = template.periods.map((p, index) => ({
      id: `period-${Date.now()}-${index}`,
      label: p.label,
      offsetDays: p.offsetDays,
      order: index
    }));

    const newJourney: Journey = {
      id: journeyId,
      name: template.name,
      description: template.description,
      anchorEvent: template.anchorEvent as any,
      status: 'draft',
      type: 'onboarding',
      periods,
      blockIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    addJourney(newJourney);

    template.periods.forEach((period, periodIndex) => {
      period.blocks.forEach((blockData, blockIndex) => {
        const blockId = `block-${Date.now()}-${periodIndex}-${blockIndex}`;
        
        const block: Block = {
          id: blockId,
          journeyId,
          periodId: periods[periodIndex].id,
          name: blockData.name,
          category: blockData.category,
          order: blockIndex,
          dependencyBlockIds: [],
          rules: [],
          expectedDurationDays: 3
        };
        
        addBlock(block);

        blockData.tasks.forEach((taskData, taskIndex) => {
          const task: Task = {
            id: `task-${Date.now()}-${periodIndex}-${blockIndex}-${taskIndex}`,
            blockId,
            title: taskData.title,
            type: 'basic',
            assigneeType: taskData.assigneeType,
            order: taskIndex
          };
          addTask(task);
        });
      });
    });

    return journeyId;
  }, [addJourney, addBlock, addTask]);

  const handleSend = useCallback(async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isTyping) return;

    // Handle close action
    if (messageText === 'close') {
      onClose();
      return;
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700));

    const response = processMessage(messageText);
    
    // Handle journey creation
    if (response.journey && (messageText.toLowerCase().includes('create') || messageText.toLowerCase().includes('yes'))) {
      const journeyId = createJourneyFromTemplate(response.journey);
      setPendingJourney(null);
      onJourneyCreated(journeyId);
    } else if (response.journey) {
      setPendingJourney(response.journey);
    }
    
    // Handle edit confirmation
    if (pendingEdit && (messageText.toLowerCase().includes('yes') || messageText.toLowerCase().includes('confirm'))) {
      executeEdit(pendingEdit);
      setPendingEdit(null);
    } else if (response.edit) {
      setPendingEdit(response.edit);
    }

    const assistantMessage: Message = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: response.content,
      timestamp: new Date(),
      journeyPreview: response.journey,
      editPreview: response.edit,
      options: response.options
    };

    setMessages(prev => [...prev, assistantMessage]);
    setIsTyping(false);
  }, [input, isTyping, processMessage, pendingEdit, executeEdit, createJourneyFromTemplate, onJourneyCreated, onClose]);

  const handleOptionClick = (action: string) => {
    handleSend(action);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-[520px] sm:max-w-[520px] p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="p-0">
          <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 px-6 py-4 text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <SheetTitle className="text-lg font-semibold text-white">
                  {existingJourney ? 'AI Journey Assistant' : 'AI Journey Creator'}
                </SheetTitle>
                <p className="text-white/70 text-sm">
                  {existingJourney ? `Editing: ${existingJourney.name}` : 'Create journeys with natural language'}
                </p>
              </div>
              <button
                onClick={() => {
                  setMessages([getWelcomeMessage()]);
                  setPendingJourney(null);
                  setPendingEdit(null);
                }}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                title="Start over"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </SheetHeader>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.role === 'user' ? "flex-row-reverse" : ""
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                message.role === 'user' 
                  ? "bg-indigo-500 text-white" 
                  : "bg-gradient-to-br from-violet-500 to-purple-600 text-white"
              )}>
                {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className={cn(
                "max-w-[85%] rounded-2xl px-4 py-3",
                message.role === 'user'
                  ? "bg-indigo-500 text-white rounded-tr-sm"
                  : "bg-white shadow-sm border border-gray-100 rounded-tl-sm"
              )}>
                <div className={cn(
                  "text-sm whitespace-pre-wrap",
                  message.role === 'user' ? "text-white" : "text-gray-700"
                )}>
                  {message.content.split('\n').map((line, i) => {
                    const parts = line.split(/(\*\*[^*]+\*\*)/g);
                    return (
                      <p key={i} className={i > 0 ? "mt-2" : ""}>
                        {parts.map((part, j) => {
                          if (part.startsWith('**') && part.endsWith('**')) {
                            return <strong key={j} className="font-semibold">{part.slice(2, -2)}</strong>;
                          }
                          if (part.startsWith('*') && part.endsWith('*')) {
                            return <em key={j} className="italic text-gray-500">{part.slice(1, -1)}</em>;
                          }
                          return part;
                        })}
                      </p>
                    );
                  })}
                </div>

                {/* Journey Preview */}
                {message.journeyPreview && (
                  <div className="mt-3 p-3 bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl border border-violet-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Layers className="w-4 h-4 text-violet-600" />
                      <span className="font-semibold text-violet-900 text-sm">{message.journeyPreview.name}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="bg-white/60 rounded-lg px-2 py-1.5 text-center">
                        <div className="font-semibold text-violet-700">{message.journeyPreview.periods.length}</div>
                        <div className="text-violet-500">periods</div>
                      </div>
                      <div className="bg-white/60 rounded-lg px-2 py-1.5 text-center">
                        <div className="font-semibold text-violet-700">
                          {message.journeyPreview.periods.reduce((a, p) => a + p.blocks.length, 0)}
                        </div>
                        <div className="text-violet-500">blocks</div>
                      </div>
                      <div className="bg-white/60 rounded-lg px-2 py-1.5 text-center">
                        <div className="font-semibold text-violet-700">
                          {message.journeyPreview.periods.reduce((a, p) => a + p.blocks.reduce((b, bl) => b + bl.tasks.length, 0), 0)}
                        </div>
                        <div className="text-violet-500">tasks</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Edit Preview */}
                {message.editPreview && (
                  <div className="mt-3 p-3 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
                    <div className="flex items-center gap-2 mb-2">
                      {message.editPreview.type === 'add_block' && <Plus className="w-4 h-4 text-emerald-600" />}
                      {message.editPreview.type === 'add_period' && <Clock className="w-4 h-4 text-emerald-600" />}
                      <span className="font-semibold text-emerald-900 text-sm">
                        {message.editPreview.type === 'add_block' && `New Block: ${message.editPreview.blockName}`}
                        {message.editPreview.type === 'add_period' && `New Period: ${message.editPreview.periodLabel}`}
                      </span>
                    </div>
                    {message.editPreview.tasks && (
                      <div className="space-y-1">
                        {message.editPreview.tasks.map((t, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-emerald-700">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{t.title}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Quick Options */}
                {message.options && message.options.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {message.options.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => handleOptionClick(option.action)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-violet-100 text-violet-700 rounded-full hover:bg-violet-200 transition-colors"
                      >
                        {option.icon}
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white shadow-sm border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
                  <span className="text-sm text-gray-500">Thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200 bg-white">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={existingJourney ? "Type to modify this journey..." : "Describe the journey you want to create..."}
              className="flex-1 h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              disabled={isTyping}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isTyping}
              className={cn(
                "w-11 h-11 rounded-xl flex items-center justify-center transition-all",
                input.trim() && !isTyping
                  ? "bg-violet-600 text-white hover:bg-violet-700"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              )}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
