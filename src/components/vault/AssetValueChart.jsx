
import React, { useState, useMemo } from "react";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Sparkles, PieChart as PieChartIcon } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, subDays, subYears, parseISO, isValid } from "date-fns";

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function AssetValueChart({ assets, valuations }) {
  const [timeRange, setTimeRange] = useState('all');
  const [chartType, setChartType] = useState('area');

  console.log('AssetValueChart rendered with:', {
    assetCount: assets.length,
    valuationCount: valuations.length,
    timeRange,
    chartType
  });

  const getDateRange = () => {
    const now = new Date();
    switch (timeRange) {
      case '1day':
        return subDays(now, 1);
      case '7day':
        return subDays(now, 7);
      case '14day':
        return subDays(now, 14);
      case '30day':
        return subDays(now, 30);
      case '1year':
        return subYears(now, 1);
      case '2year':
        return subYears(now, 2);
      case '5year':
        return subYears(now, 5);
      case 'all':
        return new Date(0);
      default:
        return new Date(0);
    }
  };

  const chartData = useMemo(() => {
    console.log('Building chart data...');
    console.log('Assets:', assets);
    console.log('Valuations:', valuations);
    
    if (assets.length === 0) {
      console.log('No assets, returning empty array');
      return [];
    }
    
    const startDate = getDateRange();
    const dataMap = new Map();

    // Add today's data point from current asset values
    const today = new Date();
    const todayKey = format(today, 'yyyy-MM-dd');
    
    let todayCurrentValue = 0;
    let todayAIValue = 0;
    
    assets.forEach(asset => {
      const current = parseFloat(asset.current_value) || 0;
      const ai = parseFloat(asset.ai_estimated_value) || 0;
      todayCurrentValue += current;
      todayAIValue += ai;
      console.log(`Asset ${asset.name}: current=${current}, ai=${ai}`);
    });
    
    console.log('Today totals:', { todayCurrentValue, todayAIValue });
    
    if (todayCurrentValue > 0 || todayAIValue > 0) {
      dataMap.set(todayKey, {
        date: todayKey,
        currentValue: todayCurrentValue,
        aiEstimatedValue: todayAIValue
      });
    }

    // Add historical valuation data
    valuations
      .filter(v => {
        try {
          const valDate = parseISO(v.as_of_date);
          const isAfterStart = valDate >= startDate;
          console.log(`Valuation ${v.id}: date=${v.as_of_date}, afterStart=${isAfterStart}`);
          return isAfterStart && isValid(valDate);
        } catch (error) {
          console.error('Error parsing valuation date:', error);
          return false;
        }
      })
      .forEach(valuation => {
        try {
          const dateKey = format(parseISO(valuation.as_of_date), 'yyyy-MM-dd');
          
          if (!dataMap.has(dateKey)) {
            dataMap.set(dateKey, {
              date: dateKey,
              currentValue: 0,
              aiEstimatedValue: 0
            });
          }
          
          const entry = dataMap.get(dateKey);
          const amount = parseFloat(valuation.amount) || 0;
          
          if (valuation.valuation_type === 'ai_estimated') {
            entry.aiEstimatedValue += amount;
          } else {
            entry.currentValue += amount;
          }
          
          console.log(`Updated ${dateKey}: current=${entry.currentValue}, ai=${entry.aiEstimatedValue}`);
        } catch (error) {
          console.error('Error processing valuation:', error);
        }
      });

    // Sort by date and format for display
    const sortedData = Array.from(dataMap.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(item => {
        const displayDate = format(parseISO(item.date), 
          timeRange === '1day' || timeRange === '7day' ? 'MMM d' : 
          timeRange === '14day' || timeRange === '30day' ? 'MMM d' : 
          'MMM yyyy'
        );
        
        return {
          date: displayDate,
          'Current Value': Math.round(item.currentValue),
          'AI Estimated': Math.round(item.aiEstimatedValue)
        };
      });
    
    console.log('Final chart data:', sortedData);
    return sortedData;
  }, [assets, valuations, timeRange]);

  // Category breakdown for pie chart
  const categoryData = useMemo(() => {
    const breakdown = {};
    assets.forEach(asset => {
      const category = asset.category || 'other';
      const value = parseFloat(asset.current_value) || 0;
      breakdown[category] = (breakdown[category] || 0) + value;
    });
    
    return Object.entries(breakdown)
      .map(([name, value]) => ({ 
        name: name.charAt(0).toUpperCase() + name.slice(1), 
        value: Math.round(value)
      }))
      .filter(item => item.value > 0);
  }, [assets]);

  const totalCurrentValue = assets.reduce((sum, a) => sum + (parseFloat(a.current_value) || 0), 0);
  const totalAIValue = assets.reduce((sum, a) => sum + (parseFloat(a.ai_estimated_value) || 0), 0);
  const difference = totalAIValue - totalCurrentValue;
  const percentDiff = totalCurrentValue > 0 ? ((difference / totalCurrentValue) * 100).toFixed(1) : 0;

  console.log('Totals:', { totalCurrentValue, totalAIValue, difference, percentDiff });

  if (assets.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="relative inline-block">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 flex items-center justify-center mb-4 animate-pulse">
            <TrendingUp className="w-12 h-12 text-green-600 dark:text-green-400" />
          </div>
          <Sparkles className="w-6 h-6 absolute -top-1 -right-1 text-purple-500 animate-bounce" />
        </div>
        <p className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Start Building Your Portfolio</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">Add assets with values to visualize your wealth over time</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-xl border-2 border-green-200 dark:border-green-800">
          <p className="font-bold text-gray-900 dark:text-gray-100 mb-3 text-lg">{payload[0].payload.date}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-3 mb-2">
              <div className="w-4 h-4 rounded-full shadow-md" style={{ backgroundColor: entry.color }} />
              <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[100px]">{entry.name}</span>
              <span className="font-bold text-lg text-gray-900 dark:text-gray-100">
                ${entry.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload[0]) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-xl border-2 border-green-200 dark:border-green-800">
          <p className="font-semibold text-gray-900 dark:text-gray-100">{payload[0].name}</p>
          <p className="text-lg font-bold text-green-600 dark:text-green-400">
            ${payload[0].value.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500">
            {((payload[0].value / totalCurrentValue) * 100).toFixed(1)}% of total
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <span>Portfolio Value</span>
            </CardTitle>
            <div className="flex gap-2 w-full sm:w-auto">
              <Tabs value={chartType} onValueChange={setChartType} className="w-full sm:w-auto">
                <TabsList className="grid grid-cols-3 bg-gray-100 dark:bg-gray-800 w-full sm:w-auto">
                  <TabsTrigger value="area">Area</TabsTrigger>
                  <TabsTrigger value="bar">Bar</TabsTrigger>
                  <TabsTrigger value="pie">
                    <PieChartIcon className="w-4 h-4" />
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
          
          <div className="flex flex-col gap-4">
            {chartType !== 'pie' && chartData.length > 0 && (
              <div className="w-full overflow-x-auto pb-2">
                <Tabs value={timeRange} onValueChange={setTimeRange}>
                  <TabsList className="inline-flex bg-gray-100 dark:bg-gray-800 w-full sm:w-auto min-w-min">
                    <TabsTrigger value="1day" className="text-xs px-2 sm:px-3">1D</TabsTrigger>
                    <TabsTrigger value="7day" className="text-xs px-2 sm:px-3">7D</TabsTrigger>
                    <TabsTrigger value="14day" className="text-xs px-2 sm:px-3">14D</TabsTrigger>
                    <TabsTrigger value="30day" className="text-xs px-2 sm:px-3">30D</TabsTrigger>
                    <TabsTrigger value="1year" className="text-xs px-2 sm:px-3">1Y</TabsTrigger>
                    <TabsTrigger value="2year" className="text-xs px-2 sm:px-3">2Y</TabsTrigger>
                    <TabsTrigger value="5year" className="text-xs px-2 sm:px-3">5Y</TabsTrigger>
                    <TabsTrigger value="all" className="text-xs px-2 sm:px-3">All</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            )}
            
            <div className="flex flex-col items-start sm:items-end gap-2 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 p-4 rounded-xl border border-green-200 dark:border-green-800">
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
                  ${totalCurrentValue.toLocaleString()}
                </span>
                {difference !== 0 && (
                  <span className={`flex items-center gap-1 text-xs sm:text-sm font-bold px-2 py-1 rounded-full ${difference >= 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'}`}>
                    {difference >= 0 ? <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" /> : <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4" />}
                    {difference >= 0 ? '+' : ''}{percentDiff}%
                  </span>
                )}
              </div>
              {totalAIValue > 0 && (
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                    AI Estimate: <span className="text-blue-600 dark:text-blue-400 font-bold">${totalAIValue.toLocaleString()}</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-2">
        {chartData.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">Add asset values to see your portfolio chart</p>
            <p className="text-sm text-gray-400">Values will appear on the chart after you save assets</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            {chartType === 'pie' ? (
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
              </PieChart>
            ) : chartType === 'area' ? (
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorAI" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.5}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
                <XAxis 
                  dataKey="date" 
                  stroke="#6b7280"
                  style={{ fontSize: '12px', fontWeight: '500' }}
                  tick={{ fill: '#6b7280' }}
                />
                <YAxis 
                  stroke="#6b7280"
                  style={{ fontSize: '12px', fontWeight: '500' }}
                  tickFormatter={(value) => value >= 1000 ? `$${(value / 1000).toFixed(0)}k` : `$${value}`}
                  tick={{ fill: '#6b7280' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ fontSize: '13px', fontWeight: '500', paddingTop: '15px' }}
                  iconType="circle"
                />
                <Area 
                  type="monotone" 
                  dataKey="Current Value" 
                  stroke="#10b981" 
                  fillOpacity={1}
                  fill="url(#colorCurrent)"
                  strokeWidth={4}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 5, stroke: '#fff' }}
                  activeDot={{ r: 8, stroke: '#10b981', strokeWidth: 3, fill: '#fff' }}
                />
                {totalAIValue > 0 && (
                  <Area 
                    type="monotone" 
                    dataKey="AI Estimated" 
                    stroke="#3b82f6" 
                    fillOpacity={1}
                    fill="url(#colorAI)"
                    strokeWidth={3}
                    strokeDasharray="8 4"
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4, stroke: '#fff' }}
                    activeDot={{ r: 7, fill: '#fff', stroke: '#3b82f6', strokeWidth: 2 }}
                  />
                )}
              </AreaChart>
            ) : (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
                <XAxis 
                  dataKey="date" 
                  stroke="#6b7280"
                  style={{ fontSize: '12px', fontWeight: '500' }}
                  tick={{ fill: '#6b7280' }}
                />
                <YAxis 
                  stroke="#6b7280"
                  style={{ fontSize: '12px', fontWeight: '500' }}
                  tickFormatter={(value) => value >= 1000 ? `$${(value / 1000).toFixed(0)}k` : `$${value}`}
                  tick={{ fill: '#6b7280' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ fontSize: '13px', fontWeight: '500', paddingTop: '15px' }}
                  iconType="square"
                />
                <Bar 
                  dataKey="Current Value" 
                  fill="#10b981"
                  radius={[10, 10, 0, 0]}
                />
                {totalAIValue > 0 && (
                  <Bar 
                    dataKey="AI Estimated" 
                    fill="#3b82f6"
                    radius={[10, 10, 0, 0]}
                  />
                )}
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </CardContent>
    </div>
  );
}
