import React, { useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, CheckCircle, Calendar, Brain, Target, Zap, Award } from "lucide-react";
import moment from "moment";

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];

export default function InsightsPage() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.Task.filter({ created_by: user.email });
    },
    enabled: !!user?.email,
  });

  const { data: bills = [] } = useQuery({
    queryKey: ['bills', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.Bill.filter({ created_by: user.email });
    },
    enabled: !!user?.email,
  });

  const { data: events = [] } = useQuery({
    queryKey: ['events', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.Event.filter({ created_by: user.email });
    },
    enabled: !!user?.email,
  });

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['subscriptions', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.Subscription.filter({ created_by: user.email });
    },
    enabled: !!user?.email,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.Project.filter({ created_by: user.email });
    },
    enabled: !!user?.email,
  });

  const { data: assets = [] } = useQuery({
    queryKey: ['assets', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.Asset.filter({ created_by: user.email });
    },
    enabled: !!user?.email,
  });

  // Calculate insights
  const insights = useMemo(() => {
    // Task completion rate
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const completionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

    // Priority distribution
    const priorityData = [
      { name: 'Low', value: tasks.filter(t => t.priority === 'low').length },
      { name: 'Medium', value: tasks.filter(t => t.priority === 'medium').length },
      { name: 'High', value: tasks.filter(t => t.priority === 'high').length },
      { name: 'Urgent', value: tasks.filter(t => t.priority === 'urgent').length },
    ].filter(d => d.value > 0);

    // Monthly spending
    const monthlySpending = bills.reduce((acc, bill) => {
      const month = moment(bill.due_date).format('MMM');
      acc[month] = (acc[month] || 0) + bill.amount;
      return acc;
    }, {});

    const spendingData = Object.entries(monthlySpending)
      .map(([month, amount]) => ({ month, amount: Math.round(amount) }))
      .slice(-6); // Last 6 months

    // Subscription costs
    const monthlySubscriptionCost = subscriptions
      .filter(s => s.status === 'active')
      .reduce((sum, sub) => {
        if (sub.interval === 'monthly') return sum + sub.amount;
        if (sub.interval === 'yearly') return sum + (sub.amount / 12);
        if (sub.interval === 'quarterly') return sum + (sub.amount / 3);
        return sum;
      }, 0);

    const yearlySubscriptionCost = monthlySubscriptionCost * 12;

    // Activity heatmap (last 30 days)
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = moment().subtract(i, 'days');
      const dateStr = date.format('YYYY-MM-DD');
      
      const tasksCreated = tasks.filter(t => 
        moment(t.created_date).format('YYYY-MM-DD') === dateStr
      ).length;
      
      const eventsOnDay = events.filter(e => 
        moment(e.start_date).format('YYYY-MM-DD') === dateStr
      ).length;

      return {
        date: date.format('MMM D'),
        activity: tasksCreated + eventsOnDay
      };
    }).reverse();

    // Upcoming commitments (next 7 days)
    const upcomingTasks = tasks.filter(t => 
      t.due_date && 
      moment(t.due_date).isBetween(moment(), moment().add(7, 'days')) &&
      t.status !== 'completed'
    ).length;

    const upcomingEvents = events.filter(e => 
      moment(e.start_date).isBetween(moment(), moment().add(7, 'days'))
    ).length;

    const upcomingBills = bills.filter(b => 
      moment(b.due_date).isBetween(moment(), moment().add(7, 'days')) &&
      b.status !== 'paid'
    ).length;

    // Net worth
    const totalAssetValue = assets.reduce((sum, a) => sum + (a.current_value || 0), 0);

    // Project status
    const activeProjects = projects.filter(p => p.status === 'active').length;
    const completedProjects = projects.filter(p => p.status === 'completed').length;

    return {
      completionRate,
      priorityData,
      spendingData,
      monthlySubscriptionCost,
      yearlySubscriptionCost,
      last30Days,
      upcomingTasks,
      upcomingEvents,
      upcomingBills,
      totalAssetValue,
      activeProjects,
      completedProjects,
    };
  }, [tasks, bills, events, subscriptions, projects, assets]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50/30 dark:from-gray-950 dark:to-purple-950/30 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Brain className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Smart Insights</h1>
            <p className="text-gray-500 dark:text-gray-400">Discover patterns in your digital life</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Task Completion Rate</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {insights.completionRate}%
                </div>
                {insights.completionRate >= 70 ? (
                  <TrendingUp className="w-8 h-8 text-green-600" />
                ) : (
                  <TrendingDown className="w-8 h-8 text-orange-600" />
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {insights.completionRate >= 70 ? 'Excellent productivity! 🎉' : 'Room for improvement'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Monthly Subscriptions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  ${Math.round(insights.monthlySubscriptionCost)}
                </div>
                <DollarSign className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                ${Math.round(insights.yearlySubscriptionCost)}/year total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Active Projects</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {insights.activeProjects}
                </div>
                <Target className="w-8 h-8 text-indigo-600" />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {insights.completedProjects} completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Net Worth (Assets)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  ${insights.totalAssetValue.toLocaleString()}
                </div>
                <Award className="w-8 h-8 text-purple-600" />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {assets.length} items tracked
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Week */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-600" />
              Next 7 Days Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tasks Due</span>
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {insights.upcomingTasks}
                </div>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Events</span>
                  <Calendar className="w-5 h-5 text-purple-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {insights.upcomingEvents}
                </div>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Bills Due</span>
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {insights.upcomingBills}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Activity Heatmap */}
          <Card>
            <CardHeader>
              <CardTitle>Activity (Last 30 Days)</CardTitle>
              <CardDescription>Your daily engagement with KOTA OS</CardDescription>
            </CardHeader>
            <CardContent>
              {insights.last30Days.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={insights.last30Days}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="activity" stroke="#8b5cf6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">No activity data yet</p>
              )}
            </CardContent>
          </Card>

          {/* Priority Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Task Priority Distribution</CardTitle>
              <CardDescription>How you prioritize your work</CardDescription>
            </CardHeader>
            <CardContent>
              {insights.priorityData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={insights.priorityData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {insights.priorityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">No tasks yet</p>
              )}
            </CardContent>
          </Card>

          {/* Spending Trends */}
          {insights.spendingData.length > 0 && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Spending Trends (Last 6 Months)</CardTitle>
                <CardDescription>Bills and expenses over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={insights.spendingData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="amount" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Smart Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600" />
              Smart Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.completionRate < 50 && (
                <div className="p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200 dark:border-orange-800">
                  <p className="text-sm text-orange-900 dark:text-orange-100">
                    💡 Your task completion rate is low. Try breaking down large tasks into smaller, actionable steps.
                  </p>
                </div>
              )}
              {insights.monthlySubscriptionCost > 100 && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    💰 You're spending ${Math.round(insights.monthlySubscriptionCost)}/month on subscriptions. Review them to find potential savings.
                  </p>
                </div>
              )}
              {insights.upcomingBills > 3 && (
                <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
                  <p className="text-sm text-purple-900 dark:text-purple-100">
                    📅 You have {insights.upcomingBills} bills due in the next week. Set aside time to review your finances.
                  </p>
                </div>
              )}
              {insights.activeProjects > 5 && (
                <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-sm text-green-900 dark:text-green-100">
                    🎯 You're juggling {insights.activeProjects} projects. Consider focusing on your top 3 priorities.
                  </p>
                </div>
              )}
              {insights.completionRate >= 80 && (
                <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-sm text-green-900 dark:text-green-100">
                    🌟 Excellent work! Your {insights.completionRate}% completion rate shows you're on top of your game.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}