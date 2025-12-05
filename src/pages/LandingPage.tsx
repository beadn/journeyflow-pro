import { useNavigate } from 'react-router-dom';
import { useJourneyStore } from '@/stores/journeyStore';
import { useMemo, useState } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  UserPlus,
  Briefcase,
  Star,
  ArrowLeftRight,
  LogOut,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Settings2,
  GitBranch,
  ExternalLink,
  Users,
  Timer,
  Plus,
  Mail,
  MapPin,
  Building2,
  Search,
  BarChart3,
  Percent,
  Calendar,
  UserMinus,
  Award,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Employee } from '@/types/journey';

// Main lifecycle stages
const lifecycleStages = [
  { 
    id: 'hiring', 
    name: 'Hiring', 
    icon: UserPlus, 
    gradient: 'from-violet-500 to-purple-600',
    avgDays: 21,
    journeyTypes: ['hiring'],
  },
  { 
    id: 'preonboarding', 
    name: 'Pre-boarding', 
    icon: Clock, 
    gradient: 'from-blue-500 to-cyan-500',
    avgDays: 14,
    journeyTypes: ['onboarding'],
  },
  { 
    id: 'onboarding', 
    name: 'Onboarding', 
    icon: TrendingUp, 
    gradient: 'from-emerald-500 to-teal-500',
    avgDays: 90,
    journeyTypes: ['onboarding'],
  },
  { 
    id: 'active', 
    name: 'Active', 
    icon: Briefcase, 
    gradient: 'from-amber-500 to-orange-500',
    avgDays: null,
    journeyTypes: ['promotion', 'role_change', 'training'],
  },
  { 
    id: 'offboarding', 
    name: 'Offboarding', 
    icon: LogOut, 
    gradient: 'from-rose-500 to-red-500',
    avgDays: 14,
    journeyTypes: ['offboarding'],
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { journeys, employees, employeeProgress, getJourneyMetrics } = useJourneyStore();
  const [showSettings, setShowSettings] = useState(false);
  const [hoveredStage, setHoveredStage] = useState<string | null>(null);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [panelTab, setPanelTab] = useState<'journeys' | 'employees'>('journeys');
  
  const [lifecycleConfig] = useState({
    onboardingDays: 90,
    preboardingDays: 14,
  });

  const lifecycleData = useMemo(() => {
    const employeesInOnboarding = new Set<string>();
    const employeesInOffboarding = new Set<string>();
    const employeesCompleted = new Set<string>();
    
    employeeProgress.forEach(progress => {
      const journey = journeys.find(j => j.id === progress.journeyId);
      if (!journey) return;
      
      if (progress.status === 'completed') {
        employeesCompleted.add(progress.employeeId);
      } else if (journey.type === 'onboarding') {
        employeesInOnboarding.add(progress.employeeId);
      } else if (journey.type === 'offboarding') {
        employeesInOffboarding.add(progress.employeeId);
      }
    });

    const totalEmployees = employees.length;
    const hiring = Math.floor(totalEmployees * 0.04); 
    const preonboarding = Math.floor(employeesInOnboarding.size * 0.2);
    const onboarding = Math.max(0, employeesInOnboarding.size - preonboarding);
    const offboarding = employeesInOffboarding.size || Math.floor(totalEmployees * 0.015);
    const active = Math.max(0, totalEmployees - onboarding - preonboarding - offboarding - hiring);

    const counts = { hiring, preonboarding, onboarding, active, offboarding };
    const maxCount = Math.max(...Object.values(counts));

    const journeysByStage: Record<string, typeof journeys> = {
      hiring: journeys.filter(j => j.type === 'hiring'),
      preonboarding: journeys.filter(j => j.type === 'onboarding'),
      onboarding: journeys.filter(j => j.type === 'onboarding'),
      active: journeys.filter(j => ['promotion', 'role_change', 'training', 'performance', 'engagement'].includes(j.type || '')),
      offboarding: journeys.filter(j => j.type === 'offboarding'),
    };

    // Calculate metrics per stage
    const getStageMetrics = (stageJourneys: typeof journeys) => {
      let onTrack = 0, atRisk = 0, delayed = 0;
      stageJourneys.forEach(j => {
        const m = getJourneyMetrics(j.id);
        onTrack += m.onTrack;
        atRisk += m.atRisk;
        delayed += m.delayed;
      });
      return { onTrack, atRisk, delayed };
    };

    const metricsByStage: Record<string, { onTrack: number; atRisk: number; delayed: number }> = {
      hiring: { onTrack: hiring, atRisk: 0, delayed: 0 }, // Simulated - no journey data
      preonboarding: getStageMetrics(journeysByStage.preonboarding),
      onboarding: getStageMetrics(journeysByStage.onboarding),
      active: { onTrack: active, atRisk: 0, delayed: 0 }, // Active employees don't have journey metrics
      offboarding: getStageMetrics(journeysByStage.offboarding),
    };

    // Assign employees to stages (simulated distribution)
    const allEmployeeIds = employees.map(e => e.id);
    const employeesByStage: Record<string, string[]> = {
      hiring: [],
      preonboarding: [],
      onboarding: [],
      active: [],
      offboarding: [],
    };

    // Real employees in onboarding/offboarding journeys
    const onboardingEmployeeIds = Array.from(employeesInOnboarding);
    const offboardingEmployeeIds = Array.from(employeesInOffboarding);
    
    // Split onboarding into preboarding and onboarding
    employeesByStage.preonboarding = onboardingEmployeeIds.slice(0, preonboarding);
    employeesByStage.onboarding = onboardingEmployeeIds.slice(preonboarding);
    employeesByStage.offboarding = offboardingEmployeeIds.length > 0 
      ? offboardingEmployeeIds 
      : allEmployeeIds.slice(0, offboarding);
    
    // Simulate hiring (take some random employees as "candidates")
    const usedIds = new Set([
      ...employeesByStage.preonboarding,
      ...employeesByStage.onboarding,
      ...employeesByStage.offboarding
    ]);
    const availableForHiring = allEmployeeIds.filter(id => !usedIds.has(id));
    employeesByStage.hiring = availableForHiring.slice(0, hiring);
    
    // Rest are active
    const allUsedIds = new Set([
      ...employeesByStage.hiring,
      ...employeesByStage.preonboarding,
      ...employeesByStage.onboarding,
      ...employeesByStage.offboarding
    ]);
    employeesByStage.active = allEmployeeIds.filter(id => !allUsedIds.has(id));

    return {
      counts,
      maxCount,
      totalEmployees,
      metricsByStage,
      journeysByStage,
      employeesByStage,
      promotionJourneys: journeys.filter(j => j.type === 'promotion'),
      roleChangeJourneys: journeys.filter(j => j.type === 'role_change'),
    };
  }, [journeys, employees, employeeProgress, getJourneyMetrics]);

  const getBarHeight = (count: number) => {
    if (lifecycleData.maxCount === 0) return 20;
    return Math.max(20, (count / lifecycleData.maxCount) * 100);
  };

  // Calculate company-wide metrics
  const companyMetrics = useMemo(() => {
    // Average tenure calculation
    const now = new Date();
    const tenures = employees.map(emp => {
      const startDate = new Date(emp.startDate);
      const monthsWorked = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
      return Math.max(0, monthsWorked);
    });
    const avgTenureMonths = tenures.length > 0 
      ? tenures.reduce((a, b) => a + b, 0) / tenures.length 
      : 0;
    const avgTenureYears = avgTenureMonths / 12;

    // Turnover rate (annualized) - employees in offboarding / total * 12
    const offboardingCount = lifecycleData.counts.offboarding;
    const turnoverRateMonthly = employees.length > 0 
      ? (offboardingCount / employees.length) * 100 
      : 0;
    const turnoverRateAnnual = turnoverRateMonthly * 12;

    // Promotion rate - employees in promotion journeys this year
    const promotionJourneys = journeys.filter(j => j.type === 'promotion');
    let promotedCount = 0;
    promotionJourneys.forEach(j => {
      const metrics = getJourneyMetrics(j.id);
      promotedCount += metrics.completed + metrics.totalEmployees;
    });
    const promotionRate = employees.length > 0 
      ? (promotedCount / employees.length) * 100 
      : 0;

    // New hires rate (hiring + preboarding + onboarding / total)
    const newHiresCount = lifecycleData.counts.hiring + lifecycleData.counts.preonboarding + lifecycleData.counts.onboarding;
    const newHiresRate = employees.length > 0 
      ? (newHiresCount / employees.length) * 100 
      : 0;

    // Retention rate (100 - turnover)
    const retentionRate = Math.max(0, 100 - turnoverRateAnnual);

    // Growth rate (new hires - offboarding / total)
    const growthRate = employees.length > 0 
      ? ((newHiresCount - offboardingCount) / employees.length) * 100 
      : 0;

    return {
      avgTenureMonths: Math.round(avgTenureMonths * 10) / 10,
      avgTenureYears: Math.round(avgTenureYears * 10) / 10,
      turnoverRateAnnual: Math.round(turnoverRateAnnual * 10) / 10,
      promotionRate: Math.round(promotionRate * 10) / 10,
      newHiresRate: Math.round(newHiresRate * 10) / 10,
      retentionRate: Math.round(retentionRate * 10) / 10,
      growthRate: Math.round(growthRate * 10) / 10,
      promotedCount,
      newHiresCount,
      offboardingCount,
    };
  }, [employees, lifecycleData.counts, journeys, getJourneyMetrics]);

  // Get employees for selected stage
  const selectedStageEmployees = useMemo(() => {
    if (!selectedStage) return [];
    const employeeIds = lifecycleData.employeesByStage[selectedStage] || [];
    const stageEmployees = employeeIds
      .map(id => employees.find(e => e.id === id))
      .filter((e): e is Employee => e !== undefined);
    
    if (employeeSearch) {
      const search = employeeSearch.toLowerCase();
      return stageEmployees.filter(e => 
        e.name.toLowerCase().includes(search) ||
        e.email.toLowerCase().includes(search) ||
        e.department.toLowerCase().includes(search)
      );
    }
    return stageEmployees;
  }, [selectedStage, lifecycleData.employeesByStage, employees, employeeSearch]);

  const selectedStageInfo = lifecycleStages.find(s => s.id === selectedStage);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/20">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">JourneyFlow</h1>
                <p className="text-xs text-gray-500">Employee Lifecycle</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg text-sm transition-all"
              >
                <Settings2 className="w-4 h-4" />
                Settings
              </button>
          <button
                onClick={() => navigate('/workflows')}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-all"
          >
                Go to Journeys
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Settings Panel */}
        {showSettings && (
          <div className="mb-6 bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-gray-500" />
              Lifecycle Stage Configuration
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pre-boarding Duration
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={lifecycleConfig.preboardingDays}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    readOnly
                  />
                  <span className="text-sm text-gray-500">days before start date</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Onboarding Duration
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={lifecycleConfig.onboardingDays}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    readOnly
                  />
                  <span className="text-sm text-gray-500">days until "Active"</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Page Title */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Employee Lifecycle</h2>
          <p className="text-gray-500 mt-1">
            {lifecycleData.totalEmployees} employees across 5 stages
            <span className="text-xs text-gray-400 ml-2">• Click on a stage to see details</span>
          </p>
        </div>

        {/* Horizontal Funnel */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
          {/* Funnel Bars - Horizontal, growing upward */}
          <div className="flex items-end justify-center gap-1 h-[380px] px-4">
            {lifecycleStages.map((stage, index) => {
              const count = lifecycleData.counts[stage.id as keyof typeof lifecycleData.counts];
              const stageJourneys = lifecycleData.journeysByStage[stage.id] || [];
              const stageMetrics = lifecycleData.metricsByStage[stage.id];
              const Icon = stage.icon;
              const barHeight = getBarHeight(count);
              const hasIssues = stageMetrics.atRisk > 0 || stageMetrics.delayed > 0;
              const percentage = lifecycleData.totalEmployees > 0 
                ? Math.round((count / lifecycleData.totalEmployees) * 100) 
                : 0;
              const isHovered = hoveredStage === stage.id;
              const isSelected = selectedStage === stage.id;
              const isLast = index === lifecycleStages.length - 1;
              
              return (
                <div key={stage.id} className="flex items-end">
                  {/* Bar Container */}
                  <div 
                    className="relative cursor-pointer group"
                    style={{ width: '140px' }}
                    onMouseEnter={() => setHoveredStage(stage.id)}
                    onMouseLeave={() => setHoveredStage(null)}
                    onClick={() => {
                      setSelectedStage(stage.id);
                      setEmployeeSearch('');
                    }}
                  >
                    {/* The growing bar */}
                    <div 
                      className={cn(
                        "w-full rounded-t-2xl bg-gradient-to-t relative overflow-hidden transition-all duration-500",
                        stage.gradient,
                        (isHovered || isSelected) && "shadow-xl scale-105 z-10",
                        isSelected && "ring-4 ring-white ring-offset-2"
                      )}
                      style={{ 
                        height: `${barHeight * 2.6}px`,
                        minHeight: '140px'
                      }}
                    >
                      {/* Shimmer effect */}
                      <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-white/20" />
                      
                      {/* Content inside bar */}
                      <div className="absolute inset-0 flex flex-col justify-between p-3 text-white">
                        {/* Top: Count */}
                        <div className="text-center">
                          <div className="text-3xl font-bold">{count}</div>
                          <div className="text-[11px] opacity-80">{percentage}% of total</div>
                        </div>
                        
                        {/* Middle: Status badges */}
                        {hasIssues && (
                          <div className="flex flex-col gap-1 items-center">
                            {stageMetrics.delayed > 0 && (
                              <span className="flex items-center gap-1 px-2 py-0.5 bg-red-500/40 backdrop-blur-sm rounded text-[10px]">
                                <Clock className="w-3 h-3" />
                                {stageMetrics.delayed} delayed
                              </span>
                            )}
                            {stageMetrics.atRisk > 0 && (
                              <span className="flex items-center gap-1 px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded text-[10px]">
                                <AlertTriangle className="w-3 h-3" />
                                {stageMetrics.atRisk} at risk
                              </span>
                            )}
                          </div>
                        )}
                        
                        {/* Bottom: Avg time & Journeys */}
                        <div className="text-center space-y-1">
                          {stage.avgDays && (
                            <div className="flex items-center justify-center gap-1 text-[10px] opacity-70">
                              <Timer className="w-3 h-3" />
                              <span>~{stage.avgDays}d avg</span>
                            </div>
                          )}
                          {stageJourneys.length > 0 ? (
                            <div className="flex items-center justify-center gap-1 text-[10px] opacity-90">
                              <GitBranch className="w-3 h-3" />
                              <span>{stageJourneys.length} active</span>
                            </div>
                          ) : (
                            <div className="text-[10px] opacity-60">No journeys</div>
                          )}
                        </div>
                      </div>
                      
                      {/* Click indicator */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10">
                        <div className="bg-white/90 rounded-full px-3 py-1.5 text-xs font-medium text-gray-700 shadow-lg">
                          View details
                        </div>
                      </div>
                    </div>
                    
                    {/* Label below bar */}
                    <div className="mt-3 text-center">
                      <div className="flex items-center justify-center gap-1.5 mb-1">
                        <div className={cn(
                          "w-6 h-6 rounded-lg bg-gradient-to-br flex items-center justify-center",
                          stage.gradient
                        )}>
                          <Icon className="w-3.5 h-3.5 text-white" />
                        </div>
                        <span className="font-semibold text-sm text-gray-700">{stage.name}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Flow Arrow between stages */}
                  {!isLast && (
                    <div className="flex items-center justify-center w-8 h-full pb-16">
                      <div className="flex flex-col items-center gap-1 text-gray-300">
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Flow description */}
          <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-center">
            <div className="flex items-center gap-6 text-xs text-gray-400">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gradient-to-br from-violet-500 to-purple-600" />
                <span>Candidates enter</span>
              </div>
              <ChevronRight className="w-4 h-4" />
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gradient-to-br from-amber-500 to-orange-500" />
                <span>Become active employees</span>
              </div>
              <ChevronRight className="w-4 h-4" />
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gradient-to-br from-rose-500 to-red-500" />
                <span>Eventually leave</span>
              </div>
            </div>
          </div>
        </div>

        {/* Company Metrics */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Company Metrics
          </h3>
          <div className="grid grid-cols-6 gap-4">
            {/* Average Tenure */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-blue-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {companyMetrics.avgTenureYears < 1 
                  ? `${companyMetrics.avgTenureMonths}m` 
                  : `${companyMetrics.avgTenureYears}y`}
              </p>
              <p className="text-xs text-gray-500">Avg Tenure</p>
            </div>

            {/* Retention Rate */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Users className="w-4 h-4 text-emerald-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-emerald-600">{companyMetrics.retentionRate}%</p>
              <p className="text-xs text-gray-500">Retention Rate</p>
            </div>

            {/* Turnover Rate */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
                  <UserMinus className="w-4 h-4 text-rose-600" />
                </div>
              </div>
              <p className={cn(
                "text-2xl font-bold",
                companyMetrics.turnoverRateAnnual > 20 ? "text-rose-600" : 
                companyMetrics.turnoverRateAnnual > 10 ? "text-amber-600" : "text-gray-900"
              )}>
                {companyMetrics.turnoverRateAnnual}%
              </p>
              <p className="text-xs text-gray-500">Turnover (Annual)</p>
            </div>

            {/* Promotion Rate */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Award className="w-4 h-4 text-amber-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-amber-600">{companyMetrics.promotionRate}%</p>
              <p className="text-xs text-gray-500">Promotion Rate</p>
            </div>

            {/* Growth Rate */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                </div>
              </div>
              <p className={cn(
                "text-2xl font-bold",
                companyMetrics.growthRate > 0 ? "text-emerald-600" : 
                companyMetrics.growthRate < 0 ? "text-rose-600" : "text-gray-900"
              )}>
                {companyMetrics.growthRate > 0 ? '+' : ''}{companyMetrics.growthRate}%
              </p>
              <p className="text-xs text-gray-500">Net Growth</p>
            </div>

            {/* New Hires */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                  <UserPlus className="w-4 h-4 text-violet-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-violet-600">{companyMetrics.newHiresCount}</p>
              <p className="text-xs text-gray-500">New Hires</p>
            </div>
          </div>
        </div>

        {/* Cross-Lifecycle Processes */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Cross-Lifecycle Processes
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {/* Promotions */}
            <div 
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-amber-200 transition-all cursor-pointer group"
              onClick={() => {
                if (lifecycleData.promotionJourneys.length > 0) {
                  navigate(`/journey/${lifecycleData.promotionJourneys[0].id}`);
                } else {
                  navigate('/workflows');
                }
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Star className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Promotions</h3>
                    <p className="text-xs text-gray-500">
                      {lifecycleData.promotionJourneys.length > 0 
                        ? `${lifecycleData.promotionJourneys.length} journey${lifecycleData.promotionJourneys.length > 1 ? 's' : ''}`
                        : 'No journeys configured'
                      }
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">
                    {lifecycleData.promotionJourneys.reduce((acc, j) => acc + getJourneyMetrics(j.id).totalEmployees, 0) || '—'}
                  </p>
                  <p className="text-xs text-gray-500">in process</p>
                </div>
              </div>
            </div>

            {/* Role Changes */}
            <div 
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group"
              onClick={() => {
                if (lifecycleData.roleChangeJourneys.length > 0) {
                  navigate(`/journey/${lifecycleData.roleChangeJourneys[0].id}`);
                } else {
                  navigate('/workflows');
                }
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ArrowLeftRight className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Role Changes</h3>
                    <p className="text-xs text-gray-500">
                      {lifecycleData.roleChangeJourneys.length > 0 
                        ? `${lifecycleData.roleChangeJourneys.length} journey${lifecycleData.roleChangeJourneys.length > 1 ? 's' : ''}`
                        : 'No journeys configured'
                      }
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">
                    {lifecycleData.roleChangeJourneys.reduce((acc, j) => acc + getJourneyMetrics(j.id).totalEmployees, 0) || '—'}
                  </p>
                  <p className="text-xs text-gray-500">in process</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-3 gap-6">
          {/* Alerts */}
          <div className="col-span-2 bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Needs Attention
            </h3>
            <div className="space-y-3">
              {/* Show alerts for all stages with issues */}
              {lifecycleStages.map(stage => {
                const metrics = lifecycleData.metricsByStage[stage.id];
                if (metrics.delayed === 0 && metrics.atRisk === 0) return null;
                
                return (
                  <div key={stage.id}>
                    {metrics.delayed > 0 && (
                      <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100 mb-2">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center", stage.gradient)}>
                            <stage.icon className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{stage.name}: Delayed</p>
                            <p className="text-xs text-gray-500">{metrics.delayed} employees past SLA</p>
                          </div>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setSelectedStage(stage.id); }}
                          className="text-xs text-red-600 font-medium hover:underline"
                        >
                          Review →
                        </button>
                      </div>
                    )}
                    {metrics.atRisk > 0 && (
                      <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-100">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center", stage.gradient)}>
                            <stage.icon className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{stage.name}: At Risk</p>
                            <p className="text-xs text-gray-500">{metrics.atRisk} approaching deadline</p>
                          </div>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setSelectedStage(stage.id); }}
                          className="text-xs text-amber-600 font-medium hover:underline"
                        >
                          Review →
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
              {/* All clear message */}
              {Object.values(lifecycleData.metricsByStage).every(m => m.delayed === 0 && m.atRisk === 0) && (
                <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  <div>
                    <p className="text-sm font-medium text-emerald-700">All Clear!</p>
                    <p className="text-xs text-emerald-600">Everyone is on track</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Overview</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-500">Onboarding Success</span>
                  <span className="font-bold text-emerald-600">
                    {lifecycleData.counts.onboarding > 0 
                      ? Math.round((lifecycleData.metricsByStage.onboarding.onTrack / lifecycleData.counts.onboarding) * 100) 
                      : 100}%
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                    style={{ 
                      width: `${lifecycleData.counts.onboarding > 0 
                        ? (lifecycleData.metricsByStage.onboarding.onTrack / lifecycleData.counts.onboarding) * 100 
                        : 100}%` 
                    }}
                  />
                </div>
              </div>
              <div className="pt-4 border-t border-gray-100 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Total Journeys</span>
                  <span className="font-semibold">{journeys.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Active Journeys</span>
                  <span className="font-semibold text-emerald-600">
                    {journeys.filter(j => j.status === 'active').length}
                  </span>
                </div>
              </div>
              <button
                onClick={() => navigate('/workflows')}
                className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-all"
              >
                Manage Journeys
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stage Detail Side Panel */}
      <Sheet open={!!selectedStage} onOpenChange={(open) => { if (!open) { setSelectedStage(null); setPanelTab('journeys'); } }}>
        <SheetContent className="w-[500px] sm:max-w-[500px] p-0 flex flex-col">
          {selectedStageInfo && (
            <>
              {/* Header */}
              <SheetHeader className={cn(
                "p-6 bg-gradient-to-r text-white",
                selectedStageInfo.gradient
              )}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                    <selectedStageInfo.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <SheetTitle className="text-white text-xl">{selectedStageInfo.name} Stage</SheetTitle>
                    <p className="text-white/80 text-sm">
                      {lifecycleData.counts[selectedStage as keyof typeof lifecycleData.counts]} employees in this stage
                    </p>
                  </div>
                </div>
              </SheetHeader>

              {/* Tabs */}
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setPanelTab('journeys')}
                  className={cn(
                    "flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors",
                    panelTab === 'journeys' 
                      ? "text-indigo-600 border-b-2 border-indigo-600" 
                      : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  <GitBranch className="w-4 h-4" />
                  Active Journeys ({lifecycleData.journeysByStage[selectedStage]?.length || 0})
                </button>
                <button
                  onClick={() => setPanelTab('employees')}
                  className={cn(
                    "flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors",
                    panelTab === 'employees' 
                      ? "text-indigo-600 border-b-2 border-indigo-600" 
                      : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  <Users className="w-4 h-4" />
                  People ({lifecycleData.counts[selectedStage as keyof typeof lifecycleData.counts]})
                </button>
              </div>

              {/* Journeys Tab */}
              {panelTab === 'journeys' && (
                <div className="flex-1 overflow-y-auto p-4">
                  {lifecycleData.journeysByStage[selectedStage]?.length > 0 ? (
                    <div className="space-y-3">
                      {lifecycleData.journeysByStage[selectedStage].map(journey => {
                        const metrics = getJourneyMetrics(journey.id);
                        return (
                          <div
                            key={journey.id}
                            className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer border border-gray-100"
                            onClick={() => navigate(`/journey/${journey.id}`)}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className={cn(
                                  "w-2 h-2 rounded-full",
                                  journey.status === 'active' ? 'bg-emerald-500' : 'bg-gray-300'
                                )} />
                                <h4 className="font-semibold text-gray-900">{journey.name}</h4>
                              </div>
                              <ExternalLink className="w-4 h-4 text-gray-400" />
                            </div>
                            
                            {journey.description && (
                              <p className="text-xs text-gray-500 mb-3 line-clamp-2">{journey.description}</p>
                            )}
                            
                            {/* Metrics */}
                            <div className="grid grid-cols-4 gap-2 mb-3">
                              <div className="text-center p-2 bg-white rounded-lg">
                                <p className="text-lg font-bold text-gray-900">{metrics.totalEmployees}</p>
                                <p className="text-[10px] text-gray-500">Total</p>
                              </div>
                              <div className="text-center p-2 bg-emerald-50 rounded-lg">
                                <p className="text-lg font-bold text-emerald-600">{metrics.onTrack}</p>
                                <p className="text-[10px] text-emerald-600">On track</p>
                              </div>
                              <div className="text-center p-2 bg-amber-50 rounded-lg">
                                <p className="text-lg font-bold text-amber-600">{metrics.atRisk}</p>
                                <p className="text-[10px] text-amber-600">At risk</p>
                              </div>
                              <div className="text-center p-2 bg-red-50 rounded-lg">
                                <p className="text-lg font-bold text-red-600">{metrics.delayed}</p>
                                <p className="text-[10px] text-red-600">Delayed</p>
                              </div>
                            </div>
                            
                            {/* Progress bar */}
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden flex">
                              {metrics.totalEmployees > 0 && (
                                <>
                                  <div 
                                    className="bg-emerald-500 h-full"
                                    style={{ width: `${(metrics.onTrack / metrics.totalEmployees) * 100}%` }}
                                  />
                                  <div 
                                    className="bg-amber-500 h-full"
                                    style={{ width: `${(metrics.atRisk / metrics.totalEmployees) * 100}%` }}
                                  />
                                  <div 
                                    className="bg-red-500 h-full"
                                    style={{ width: `${(metrics.delayed / metrics.totalEmployees) * 100}%` }}
                                  />
                                </>
                              )}
                            </div>
                            
                            <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                              <span className="capitalize">{journey.status}</span>
                              <span>{journey.type?.replace('_', ' ')}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                      <GitBranch className="w-12 h-12 mb-3 opacity-50" />
                      <p className="text-sm font-medium mb-1">No active journeys</p>
                      <p className="text-xs text-gray-400 mb-4 text-center px-4">
                        Create a journey to automate tasks for employees in the {selectedStageInfo?.name} stage
                      </p>
                      <button
                        onClick={() => navigate('/workflows')}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Create Journey
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Employees Tab */}
              {panelTab === 'employees' && (
                <>
                  {/* Search */}
                  <div className="p-4 border-b border-gray-100">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search employees..."
                        value={employeeSearch}
                        onChange={(e) => setEmployeeSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Employee List */}
                  <div className="flex-1 overflow-y-auto p-4">
                    {selectedStageEmployees.length > 0 ? (
                      <div className="space-y-2">
                        {selectedStageEmployees.map(employee => {
                          const progress = employeeProgress.find(p => p.employeeId === employee.id);
                          const journey = progress ? journeys.find(j => j.id === progress.journeyId) : null;
                          
                          return (
                            <div
                              key={employee.id}
                              className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                              onClick={() => {
                                if (journey) {
                                  navigate(`/journey/${journey.id}`);
                                }
                              }}
                            >
                              <div className="flex items-start gap-3">
                                <div className={cn(
                                  "w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm bg-gradient-to-br",
                                  selectedStageInfo.gradient
                                )}>
                                  {employee.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-900 truncate">{employee.name}</p>
                                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                    <span className="flex items-center gap-1">
                                      <Building2 className="w-3 h-3" />
                                      {employee.department}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <MapPin className="w-3 h-3" />
                                      {employee.location}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                                    <Mail className="w-3 h-3" />
                                    {employee.email}
                                  </div>
                                  
                                  {journey && progress && (
                                    <div className="mt-2 pt-2 border-t border-gray-200">
                                      <div className="flex items-center gap-2">
                                        <GitBranch className="w-3 h-3 text-gray-400" />
                                        <span className="text-xs text-gray-600">{journey.name}</span>
                                        <span className={cn(
                                          "text-[10px] px-1.5 py-0.5 rounded",
                                          progress.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                          progress.status === 'at_risk' ? 'bg-amber-100 text-amber-700' :
                                          progress.status === 'delayed' ? 'bg-red-100 text-red-700' :
                                          'bg-blue-100 text-blue-700'
                                        )}>
                                          {progress.status.replace('_', ' ')}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                
                                {journey && (
                                  <ExternalLink className="w-4 h-4 text-gray-300" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                        <Users className="w-12 h-12 mb-2 opacity-50" />
                        <p className="text-sm">
                          {employeeSearch ? 'No employees match your search' : 'No employees in this stage'}
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
