import { useMemo } from 'react';
import { useJourneyStore } from '@/stores/journeyStore';
import { cn } from '@/lib/utils';
import { 
  Users, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle, 
  Clock, 
  CheckCircle2,
  Target,
  Zap,
  ArrowRight,
  BarChart3,
  Timer,
  AlertCircle,
  Lightbulb,
  ChevronRight,
  Flame,
  Award,
  Calendar
} from 'lucide-react';

interface JourneyHealthOverviewProps {
  journeyId: string;
}

export function JourneyHealthOverview({ journeyId }: JourneyHealthOverviewProps) {
  const { 
    getJourneyMetrics, 
    getBlocksByJourneyId, 
    getBlockMetrics, 
    getJourneyById,
    employees,
    employeeProgress
  } = useJourneyStore();
  
  const journey = getJourneyById(journeyId);
  const metrics = getJourneyMetrics(journeyId);
  const blocks = getBlocksByJourneyId(journeyId);

  // Get detailed employee data
  const employeeData = useMemo(() => {
    const progressList = employeeProgress.filter(p => p.journeyId === journeyId);
    
    return progressList.map(progress => {
      const employee = employees.find(e => e.id === progress.employeeId);
      const currentBlock = blocks.find(b => b.id === progress.currentBlockId);
      const blockProgress = progress.blockProgress.find(bp => bp.blockId === progress.currentBlockId);
      
      return {
        employee,
        progress,
        currentBlock,
        daysInCurrentBlock: blockProgress?.daysSpent || 0
      };
    }).filter(item => item.employee);
  }, [employeeProgress, employees, blocks, journeyId]);

  // Calculate bottlenecks - blocks with most delayed/at-risk
  const bottlenecks = useMemo(() => {
    return blocks.map(block => {
      const blockMetrics = getBlockMetrics(block.id);
      const period = journey?.periods.find(p => p.id === block.periodId);
      return {
        block,
        period,
        metrics: blockMetrics,
        score: (blockMetrics.delayedCount * 3) + (blockMetrics.atRiskCount * 1) // Weighted score
      };
    })
    .filter(b => b.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
  }, [blocks, getBlockMetrics, journey]);

  // Get employees stuck the longest
  const stuckEmployees = useMemo(() => {
    return employeeData
      .filter(e => e.progress.status === 'delayed' || e.progress.status === 'at_risk')
      .sort((a, b) => b.daysInCurrentBlock - a.daysInCurrentBlock)
      .slice(0, 5);
  }, [employeeData]);

  // Distribution by period
  const periodDistribution = useMemo(() => {
    if (!journey) return [];
    
    return journey.periods.map(period => {
      const periodBlocks = blocks.filter(b => b.periodId === period.id);
      const employeesInPeriod = employeeData.filter(e => 
        periodBlocks.some(b => b.id === e.progress.currentBlockId)
      );
      
      return {
        period,
        count: employeesInPeriod.length,
        delayed: employeesInPeriod.filter(e => e.progress.status === 'delayed').length,
        atRisk: employeesInPeriod.filter(e => e.progress.status === 'at_risk').length
      };
    }).sort((a, b) => a.period.order - b.period.order);
  }, [journey, blocks, employeeData]);

  // Calculate insights/opportunities
  const insights = useMemo(() => {
    const result: { type: 'warning' | 'success' | 'info'; title: string; description: string; action?: string }[] = [];
    
    // High delay rate
    const delayRate = metrics.totalEmployees > 0 
      ? (metrics.delayed / metrics.totalEmployees) * 100 
      : 0;
    if (delayRate > 20) {
      result.push({
        type: 'warning',
        title: `${Math.round(delayRate)}% of employees delayed`,
        description: 'Consider reviewing blocks with most delays',
        action: 'View problematic blocks'
      });
    }
    
    // Fast completers
    if (metrics.completed > 0 && metrics.averageDuration < 14) {
      result.push({
        type: 'success',
        title: 'Excellent average time',
        description: `Employees complete in ${metrics.averageDuration} days on average`,
      });
    }
    
    // Bottleneck block
    if (bottlenecks.length > 0) {
      const worst = bottlenecks[0];
      result.push({
        type: 'warning',
        title: `"${worst.block.name}" is a bottleneck`,
        description: `${worst.metrics.delayedCount} delayed and ${worst.metrics.atRiskCount} at risk`,
        action: 'Review block'
      });
    }
    
    // Good completion rate
    const completionRate = metrics.totalEmployees > 0 
      ? (metrics.completed / metrics.totalEmployees) * 100 
      : 0;
    if (completionRate > 50) {
      result.push({
        type: 'success',
        title: `${Math.round(completionRate)}% completion rate`,
        description: 'The journey is progressing well'
      });
    }
    
    // At risk warning
    if (metrics.atRisk > 5) {
      result.push({
        type: 'info',
        title: `${metrics.atRisk} employees at risk`,
        description: 'Act now to avoid delays',
        action: 'View at-risk employees'
      });
    }
    
    return result.slice(0, 4);
  }, [metrics, bottlenecks]);

  if (!journey) return null;

  const healthScore = metrics.totalEmployees > 0 
    ? Math.round(((metrics.onTrack + metrics.completed) / metrics.totalEmployees) * 100) 
    : 100;

  const maxPeriodCount = Math.max(...periodDistribution.map(p => p.count), 1);

  return (
    <div className="space-y-6">
      {/* Header with Health Score */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{journey.name}</h2>
          <p className="text-sm text-gray-500 mt-1">Journey health dashboard</p>
        </div>
        
        {/* Health Score Ring */}
        <div className="flex items-center gap-4 bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
          <div className="relative w-20 h-20">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="3"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke={healthScore >= 70 ? '#10b981' : healthScore >= 40 ? '#f59e0b' : '#ef4444'}
                strokeWidth="3"
                strokeDasharray={`${healthScore}, 100`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={cn(
                "text-2xl font-bold",
                healthScore >= 70 ? 'text-emerald-600' : healthScore >= 40 ? 'text-amber-600' : 'text-red-600'
              )}>
                {healthScore}
              </span>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Health Score</p>
            <p className={cn(
              "text-lg font-semibold",
              healthScore >= 70 ? 'text-emerald-600' : healthScore >= 40 ? 'text-amber-600' : 'text-red-600'
            )}>
              {healthScore >= 70 ? 'Excellent' : healthScore >= 40 ? 'Needs attention' : 'Critical'}
            </p>
          </div>
        </div>
      </div>

      {/* Main KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-indigo-600" />
            </div>
            <span className="text-xs font-medium text-gray-400">Total</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{metrics.totalEmployees}</p>
          <p className="text-sm text-gray-500 mt-1">employees in journey</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-xs font-medium text-emerald-500">
              {metrics.totalEmployees > 0 ? Math.round((metrics.onTrack / metrics.totalEmployees) * 100) : 0}%
            </span>
          </div>
          <p className="text-3xl font-bold text-emerald-600">{metrics.onTrack}</p>
          <p className="text-sm text-gray-500 mt-1">on track</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-xs font-medium text-amber-500">
              {metrics.totalEmployees > 0 ? Math.round((metrics.atRisk / metrics.totalEmployees) * 100) : 0}%
            </span>
          </div>
          <p className="text-3xl font-bold text-amber-600">{metrics.atRisk}</p>
          <p className="text-sm text-gray-500 mt-1">at risk</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <Flame className="w-5 h-5 text-red-600" />
            </div>
            <span className="text-xs font-medium text-red-500">
              {metrics.totalEmployees > 0 ? Math.round((metrics.delayed / metrics.totalEmployees) * 100) : 0}%
            </span>
          </div>
          <p className="text-3xl font-bold text-red-600">{metrics.delayed}</p>
          <p className="text-sm text-gray-500 mt-1">delayed</p>
        </div>
      </div>

      {/* Completions Timeline + Secondary metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Completions Timeline Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <h3 className="font-semibold text-gray-900">Completions by Month</h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-emerald-600">{metrics.completed}</span>
              <span className="text-sm text-gray-500">total</span>
            </div>
          </div>
          
          {/* Mini bar chart */}
          <div className="flex items-end gap-2 h-32">
            {(() => {
              // Calculate completions by month from real data
              const now = new Date();
              const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
              
              // Get last 6 months
              const monthlyData: { month: string; count: number; isCurrent: boolean }[] = [];
              for (let i = 5; i >= 0; i--) {
                const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
                monthlyData.push({
                  month: monthNames[date.getMonth()],
                  count: 0,
                  isCurrent: i === 0
                });
              }
              
              // Count completions per month
              employeeData.forEach(({ progress }) => {
                if (progress.status === 'completed' && progress.completedAt) {
                  const completedDate = new Date(progress.completedAt);
                  const monthDiff = (now.getFullYear() - completedDate.getFullYear()) * 12 + (now.getMonth() - completedDate.getMonth());
                  
                  if (monthDiff >= 0 && monthDiff < 6) {
                    const idx = 5 - monthDiff;
                    if (monthlyData[idx]) {
                      monthlyData[idx].count++;
                    }
                  }
                }
              });
              
              const maxCount = Math.max(...monthlyData.map(m => m.count), 1);
              
              return monthlyData.map((data, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex flex-col items-center justify-end h-24">
                    <span className="text-xs font-medium text-gray-600 mb-1">{data.count}</span>
                    <div 
                      className={cn(
                        "w-full rounded-t-md transition-all",
                        data.isCurrent 
                          ? "bg-gradient-to-t from-emerald-500 to-emerald-400" 
                          : "bg-gradient-to-t from-gray-200 to-gray-100"
                      )}
                      style={{ height: `${(data.count / maxCount) * 100}%`, minHeight: '4px' }}
                    />
                  </div>
                  <span className={cn(
                    "text-xs",
                    data.isCurrent ? "font-semibold text-emerald-600" : "text-gray-400"
                  )}>
                    {data.month}
                  </span>
                </div>
              ));
            })()}
          </div>
          
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-emerald-500" />
                <span className="text-xs text-gray-500">Current month</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-gray-200" />
                <span className="text-xs text-gray-500">Previous months</span>
              </div>
            </div>
            <span className="text-sm text-gray-500">
              <strong className="text-emerald-600">{metrics.completionRate}%</strong> completion rate
            </span>
          </div>
        </div>

        {/* Secondary metrics stacked */}
        <div className="flex flex-col gap-4">
          <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl p-5 text-white shadow-lg flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-slate-300" />
              <span className="text-slate-300 text-sm">Average time</span>
            </div>
            <p className="text-3xl font-bold">{metrics.averageDuration}<span className="text-lg">d</span></p>
            <p className="text-slate-400 text-xs mt-1">
              to complete the journey
            </p>
          </div>

          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-5 text-white shadow-lg flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-indigo-200" />
              <span className="text-indigo-200 text-sm">Active now</span>
            </div>
            <p className="text-3xl font-bold">
              {metrics.totalEmployees - metrics.completed - metrics.delayed}
            </p>
            <p className="text-indigo-300 text-xs mt-1">
              employees progressing
            </p>
          </div>
        </div>
      </div>

      {/* Insights & Opportunities */}
      {insights.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            <h3 className="font-semibold text-gray-900">Insights & Opportunities</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {insights.map((insight, idx) => (
              <div key={idx} className="px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                  insight.type === 'warning' ? 'bg-amber-100' : 
                  insight.type === 'success' ? 'bg-emerald-100' : 
                  'bg-blue-100'
                )}>
                  {insight.type === 'warning' ? (
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                  ) : insight.type === 'success' ? (
                    <Award className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <Zap className="w-5 h-5 text-blue-600" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{insight.title}</p>
                  <p className="text-sm text-gray-500">{insight.description}</p>
                </div>
                {insight.action && (
                  <button className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700">
                    {insight.action}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribution by Period */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-500" />
            <h3 className="font-semibold text-gray-900">Distribution by Period</h3>
          </div>
          <div className="p-5 space-y-4">
            {periodDistribution.map(({ period, count, delayed, atRisk }) => (
              <div key={period.id}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Timer className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">{period.label}</span>
                    <span className="text-xs text-gray-400">Day {period.offsetDays}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">{count}</span>
                    {delayed > 0 && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-700">{delayed}</span>
                    )}
                    {atRisk > 0 && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">{atRisk}</span>
                    )}
                  </div>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-400 to-indigo-500 rounded-full transition-all"
                    style={{ width: `${(count / maxPeriodCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottlenecks */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h3 className="font-semibold text-gray-900">Bottlenecks</h3>
          </div>
          {bottlenecks.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {bottlenecks.map(({ block, period, metrics: blockMetrics }) => (
                <div key={block.id} className="px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                  <div className={cn(
                    "w-2 h-12 rounded-full",
                    blockMetrics.delayedCount > 2 ? 'bg-red-500' : 
                    blockMetrics.delayedCount > 0 ? 'bg-amber-500' : 
                    'bg-yellow-400'
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{block.name}</p>
                    <p className="text-xs text-gray-500">{period?.label} · {blockMetrics.employeesInBlock} in block</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {blockMetrics.delayedCount > 0 && (
                      <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-red-100 text-red-700">
                        <Flame className="w-3 h-3" />
                        {blockMetrics.delayedCount}
                      </span>
                    )}
                    {blockMetrics.atRiskCount > 0 && (
                      <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700">
                        <AlertTriangle className="w-3 h-3" />
                        {blockMetrics.atRiskCount}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">No bottlenecks!</p>
              <p className="text-sm text-gray-400">All blocks are running smoothly</p>
            </div>
          )}
        </div>
      </div>

      {/* Stuck Employees */}
      {stuckEmployees.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-red-500" />
              <h3 className="font-semibold text-gray-900">Employees requiring attention</h3>
            </div>
            <span className="text-xs text-gray-400">Most time in current block</span>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {stuckEmployees.map(({ employee, progress, currentBlock, daysInCurrentBlock }) => (
                employee && (
                  <div 
                    key={progress.id}
                    className={cn(
                      "p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md",
                      progress.status === 'delayed' 
                        ? 'bg-red-50 border-red-200 hover:border-red-300' 
                        : 'bg-amber-50 border-amber-200 hover:border-amber-300'
                    )}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold",
                        progress.status === 'delayed' 
                          ? 'bg-red-200 text-red-700' 
                          : 'bg-amber-200 text-amber-700'
                      )}>
                        {employee.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate text-sm">{employee.name}</p>
                        <p className="text-xs text-gray-500 truncate">{employee.department}</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-gray-600 truncate">
                        📍 {currentBlock?.name || 'Unknown'}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className={cn(
                          "text-xs font-semibold",
                          progress.status === 'delayed' ? 'text-red-600' : 'text-amber-600'
                        )}>
                          {daysInCurrentBlock} days
                        </span>
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-full",
                          progress.status === 'delayed' 
                            ? 'bg-red-200 text-red-700' 
                            : 'bg-amber-200 text-amber-700'
                        )}>
                          {progress.status === 'delayed' ? 'Delayed' : 'At risk'}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats Footer */}
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-5 border border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-600">
                <strong>{journey.periods.length}</strong> periods
              </span>
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-600">
                <strong>{blocks.length}</strong> blocks
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-600">
                Anchor: <strong>{journey.anchorEvent.replace('_', ' ')}</strong>
              </span>
            </div>
          </div>
          <span className={cn(
            "px-3 py-1 rounded-full text-xs font-medium",
            journey.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
            journey.status === 'draft' ? 'bg-gray-200 text-gray-600' :
            'bg-amber-100 text-amber-700'
          )}>
            {journey.status}
          </span>
        </div>
      </div>
    </div>
  );
}
