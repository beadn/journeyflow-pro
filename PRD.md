# JourneyFlow Pro - Product Requirements Document

## 📋 Executive Summary

**JourneyFlow Pro** is an employee lifecycle management platform that enables HR teams to design, build, and monitor employee journeys at scale. From onboarding to offboarding, promotions to role changes, the platform provides a visual workflow builder and real-time monitoring dashboard.

---

## 🎯 Problem Statement

### Current Challenges
1. **Fragmented Onboarding**: Employee onboarding processes are scattered across spreadsheets, emails, and disconnected tools
2. **No Visibility**: HR teams lack real-time visibility into where employees are in their journey
3. **Manual Tracking**: Tracking task completion and identifying bottlenecks requires manual effort
4. **One-Size-Fits-All**: Different employee types (engineers, contractors, remote workers) need different journey paths
5. **Compliance Risk**: Missing steps in critical processes can lead to compliance issues

### Solution
JourneyFlow Pro provides a unified platform to:
- Visually design employee journeys with blocks, tasks, and conditional logic
- Automatically route employees through personalized paths based on their attributes
- Monitor progress in real-time with actionable insights
- Identify and resolve bottlenecks before they impact employee experience

---

## 👥 Target Users

### Primary Users
- **HR Managers**: Design and manage employee lifecycle journeys
- **HR Operations**: Monitor daily progress and resolve blockers
- **People Ops Teams**: Configure and optimize processes

### Secondary Users
- **Managers**: Track their direct reports' onboarding progress
- **IT Admins**: Receive and complete IT-related tasks
- **Employees**: (Future) Self-service portal to track their own journey

---

## 🏗️ Core Features

### 1. Journey Builder

#### 1.1 Journey Management
- Create journeys for different lifecycle events:
  - 🚀 **Onboarding** - New hire integration
  - 👋 **Offboarding** - Employee departure
  - ⭐ **Promotion** - Role advancement
  - 🔄 **Role Change** - Internal transfers
  - 📊 **Performance Cycle** - Review periods
  - 📋 **Custom** - Any custom process

#### 1.2 Eligibility Criteria
- Filter which employees enter each journey based on:
  - Department (Engineering, Sales, HR, etc.)
  - Location (Remote, Madrid, New York, etc.)
  - Employee Type (Full-time, Part-time, Contractor, Intern)
  - Contract Type (Permanent, Temporary, Freelance)
  - Level (Junior, Mid, Senior, Lead, Manager, Director, VP, C-Level)

#### 1.3 Time Periods
- Organize journey into time-based periods:
  - Pre-start activities (-7 days, -3 days)
  - Day 0 activities
  - First week (+7 days)
  - First month (+30 days)
  - Probation end (+90 days)
- Anchor events: Start Date, Last Day, Promotion Date, Cycle Start, Custom

#### 1.4 Blocks
- Group related tasks into logical blocks:
  - **Name & Description**: Clear identification
  - **Category**: Legal, IT, Onboarding, Social, Training, Benefits, Payroll
  - **Period Assignment**: When the block should execute
  - **Dependencies**: Which blocks must complete first
  - **Expected Duration (SLA)**: Time to complete in days

#### 1.5 Tasks
- Individual action items within blocks:
  - **Types**: Basic, Data Input, Signature, Review, Notification
  - **Assignee**: Employee, Manager, HR, IT, specific roles
  - **Due Date Offset**: Relative to block start
  - **Conditional Logic**: Show/hide based on employee attributes

#### 1.6 Audience Rules
- Dynamic task/block assignment based on conditions:
  - **Condition**: Attribute + Operator + Value
    - Example: `department = Engineering`
  - **Actions**:
    - Add tasks (e.g., "GitHub access setup" for engineers)
    - Add sub-blocks (e.g., "NDA Process" for contractors)
  - **Nested Rules**: Sub-blocks can have their own rules for infinite depth

### 2. Visual Views

#### 2.1 Timeline View
- Horizontal kanban-style view
- Columns represent time periods
- Blocks as cards within periods
- Drag-and-drop reordering
- Visual category color coding

#### 2.2 Tree View
- Dependency-based visualization
- Start node → Blocks → Wait nodes → More blocks
- Expand blocks to see internal structure:
  - Base tasks
  - Condition diamond
  - Rule branches
  - Added tasks/sub-blocks
- Cross-period dependency indicators
- Inline editing capabilities

#### 2.3 Journey Preview
- Simulate journey for different employee profiles
- Select conditions (department, location, employee type)
- See which tasks/blocks would be active
- Grouped by period with expandable blocks

### 3. Journey Monitor

#### 3.1 Overview Dashboard
- **Health Score**: 0-100 overall journey health
- **Key Metrics**:
  - Total active employees
  - On track percentage
  - At risk count
  - Delayed count
- **Completions by Month**: Timeline graph
- **Period Distribution**: Employee count per period
- **Bottlenecks**: Top problematic blocks
- **Employees Needing Attention**: Longest time in block

#### 3.2 By Employee View
- Searchable employee list
- Status indicators (on track, at risk, delayed, completed)
- Click to expand detailed journey view:
  - Employee info (name, department, manager, start date)
  - Journey summary with progress bar
  - Period-grouped timeline
  - Block status with time spent
  - Expandable task lists

#### 3.3 By Block View
- Timeline or Tree layout options
- Horizontal or Vertical orientation
- Period headers with aggregated stats
- Block cards showing:
  - Employee count
  - Status breakdown
  - Expandable employee list
- **Bulk Actions**:
  - Reset block
  - Complete tasks
  - Send reminder
  - Unblock

### 4. AI Assistant

#### 4.1 AI Journey Creator
- Natural language interface for journey creation
- Available from:
  - Journeys page ("Create with AI" button)
  - Builder toolbar ("AI Assistant" button)

#### 4.2 Create Mode (New Journey)
- Quick start templates:
  - 🛠️ Engineering Onboarding
  - 💼 Sales Onboarding
  - 👋 Offboarding
  - 🎯 Custom Journey
- Generates complete journey structure:
  - Time periods with appropriate offsets
  - Blocks with category assignments
  - Tasks with assignee types
- Interactive preview with metrics (periods, blocks, tasks)
- One-click journey creation

#### 4.3 Edit Mode (Existing Journey)
- Contextual awareness of current journey state
- Capabilities:
  - Add new blocks to specific periods
  - Add new time periods (60, 90, 180 days, 1 year)
  - Get AI-powered improvement suggestions
- Smart detection of:
  - Missing review periods
  - Compliance training gaps
  - Feedback block opportunities

#### 4.4 Conversation Features
- Chat-based interface with message history
- Quick action buttons for common operations
- Visual previews before applying changes
- Confirmation dialogs for modifications

### 5. Data Model

```typescript
// Journey
interface Journey {
  id: string;
  name: string;
  type: JourneyType;
  anchorEvent: AnchorEvent;
  periods: Period[];
  blockIds: string[];
  status: 'draft' | 'active' | 'archived';
  eligibilityCriteria?: EligibilityCriterion[];
  description?: string;
}

// Period
interface Period {
  id: string;
  label: string;
  offsetDays: number;
  order: number;
}

// Block
interface Block {
  id: string;
  name: string;
  journeyId: string;
  periodId: string;
  taskIds: string[];
  rules: BlockRule[];
  dependencyBlockIds: string[];
  expectedDurationDays?: number;
  category?: string;
  order: number;
}

// Task
interface Task {
  id: string;
  blockId: string;
  title: string;
  type: TaskType;
  assigneeType: string;
  dueOffsetDays?: number;
  order: number;
}

// Block Rule (Audience Rules)
interface BlockRule {
  id: string;
  label: string;
  condition: {
    attribute: string;
    operator: 'equals' | 'not_equals' | 'in' | 'not_in';
    value: string | string[];
  };
  action: {
    type: 'add_task' | 'add_block';
    addedTasks?: Partial<Task>[];
    addedBlockTemplateId?: string;
  };
}

// Employee Progress
interface EmployeeJourneyProgress {
  id: string;
  employeeId: string;
  journeyId: string;
  currentBlockId: string;
  status: 'on_track' | 'at_risk' | 'delayed' | 'completed';
  startedAt: string;
  completedAt?: string;
  completedBlockIds: string[];
  blockProgress: BlockProgress[];
}
```

---

## 🎨 UI/UX Design Principles

### Visual Language
- **Color Palette**: 
  - Primary: Factorial Red (#FF5252 → #E53935)
  - Secondary: Indigo for selections
  - Status: Emerald (success), Amber (warning), Red (error)
  - Categories: Distinct colors for block types
- **Typography**: Clean, modern sans-serif
- **Spacing**: Generous whitespace, clear hierarchy
- **Animations**: Subtle hover effects, smooth transitions

### Navigation
- Sidebar with logo and main sections
- Journey list as home base
- Journey detail with Builder/Monitor tabs
- Breadcrumb navigation within journeys

### Responsiveness
- Desktop-first design
- Tablet-friendly layouts
- Mobile: View-only (editing requires desktop)

---

## 🔧 Technical Architecture

### Frontend Stack
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: Zustand with persistence
- **Routing**: React Router v6
- **Visualizations**: 
  - @xyflow/react (ReactFlow) for tree views
  - Custom SVG/CSS for timelines
- **Drag & Drop**: @dnd-kit

### Data Persistence
- Local storage via Zustand persist middleware
- Mock data generation for demo purposes
- (Future) REST API integration

### Key Dependencies
```json
{
  "@xyflow/react": "^12.x",
  "@dnd-kit/core": "^6.x",
  "@dnd-kit/sortable": "^8.x",
  "@tanstack/react-query": "^5.x",
  "zustand": "^4.x",
  "tailwindcss": "^3.x",
  "lucide-react": "^0.x"
}
```

---

## 📊 Success Metrics

### Adoption
- Number of active journeys created
- Number of employees tracked
- Daily/weekly active HR users

### Efficiency
- Average time to design a journey
- Time saved vs. manual tracking
- Reduction in missed onboarding steps

### Quality
- Employee on-track rate
- Average journey completion time
- Bottleneck resolution time

---

## 🗺️ Roadmap

### Phase 1: Foundation ✅
- [x] Journey CRUD operations
- [x] Block and task management
- [x] Timeline and Tree views
- [x] Basic monitoring dashboard
- [x] Audience rules with conditional logic
- [x] Eligibility criteria for journeys

### Phase 2: Enhanced Monitoring
- [x] By Employee detailed view
- [x] By Block operational view
- [x] Bulk actions for employees
- [x] Health score and insights
- [x] Completion timeline graph

### Phase 3: AI Co-Creation ✅
- [x] AI Journey Creator chat interface
- [x] Pre-built journey templates (Engineering, Sales, Offboarding)
- [x] Natural language journey creation
- [x] Edit mode for existing journeys
- [x] AI-powered improvement suggestions
- [x] Quick action buttons and previews

### Phase 4: Collaboration (Future)
- [ ] Multi-user support
- [ ] Role-based permissions
- [ ] Comments and notes on blocks
- [ ] Activity audit log
- [ ] Email notifications

### Phase 5: Integration (Future)
- [ ] REST API for external systems
- [ ] Webhook triggers
- [ ] HRIS integrations (Factorial, Workday, BambooHR)
- [ ] Slack/Teams notifications
- [ ] Calendar integrations

### Phase 6: Advanced Features (Future)
- [ ] Journey templates marketplace
- [ ] Real AI integration (OpenAI/Claude API)
- [ ] Employee self-service portal
- [ ] Advanced analytics and reporting
- [ ] Custom field definitions
- [ ] Multi-language support

---

## 📝 Glossary

| Term | Definition |
|------|------------|
| **Journey** | A complete employee lifecycle process (e.g., Onboarding) |
| **Period** | A time-based phase within a journey (e.g., "First Week") |
| **Block** | A group of related tasks within a period |
| **Task** | An individual action item assigned to someone |
| **Audience Rule** | Conditional logic that adds tasks/blocks based on employee attributes |
| **Eligibility Criteria** | Conditions that determine which employees enter a journey |
| **SLA** | Expected duration for completing a block |
| **On Track** | Employee progressing within expected timeframes |
| **At Risk** | Employee approaching SLA deadline |
| **Delayed** | Employee has exceeded SLA |
| **AI Assistant** | Chat-based interface for creating/editing journeys with natural language |
| **Journey Template** | Pre-built journey structure (Engineering, Sales, Offboarding) |
| **Edit Mode** | AI Assistant mode for modifying existing journeys |
| **Create Mode** | AI Assistant mode for building new journeys from scratch |

---

## 🔗 Related Documents

- [Technical Architecture](./ARCHITECTURE.md) (TODO)
- [API Documentation](./API.md) (TODO)
- [Component Library](./COMPONENTS.md) (TODO)
- [Testing Strategy](./TESTING.md) (TODO)

---

*Last Updated: December 2025*
*Version: 1.1.0* - Added AI Co-Creation

