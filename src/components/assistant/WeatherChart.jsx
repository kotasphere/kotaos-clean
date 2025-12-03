import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Cloud, CloudRain, CloudSnow, Sun, CloudDrizzle } from "lucide-react";

function getWeatherIcon(condition) {
  const lower = condition.toLowerCase();
  if (lower.includes('rain') || lower.includes('shower')) return <CloudRain className="w-4 h-4" />;
  if (lower.includes('snow')) return <CloudSnow className="w-4 h-4" />;
  if (lower.includes('cloud') || lower.includes('overcast')) return <Cloud className="w-4 h-4" />;
  if (lower.includes('drizzle')) return <CloudDrizzle className="w-4 h-4" />;
  return <Sun className="w-4 h-4" />;
}

export default function WeatherChart({ data }) {
  // Parse weather data from text
  const parseWeatherData = (text) => {
    const hours = [];
    const lines = text.split('\n').filter(line => 
      /\d{1,2}(am|pm|AM|PM)/.test(line) || /\d{1,2}:\d{2}/.test(line)
    );
    
    for (const line of lines) {
      const tempMatch = line.match(/(\d+)°[FC]/);
      const timeMatch = line.match(/(\d{1,2})(:\d{2})?\s*(am|pm|AM|PM)?/);
      const conditionMatch = line.match(/(sunny|cloudy|rain|snow|clear|overcast|drizzle|shower|partly|mostly)/i);
      
      if (tempMatch && timeMatch) {
        const temp = parseInt(tempMatch[1]);
        const hour = timeMatch[1];
        const period = timeMatch[3] || '';
        const condition = conditionMatch ? conditionMatch[0] : 'Clear';
        
        hours.push({
          time: `${hour}${period}`.toUpperCase(),
          temp,
          condition,
        });
      }
    }
    
    return hours.slice(0, 12); // Show max 12 hours
  };

  const weatherData = parseWeatherData(data);
  
  if (weatherData.length === 0) return null;

  return (
    <div className="mt-4 p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
      <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
        <Cloud className="w-4 h-4" />
        Hourly Forecast
      </h3>
      
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={weatherData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis 
            dataKey="time" 
            stroke="#666"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#666"
            style={{ fontSize: '12px' }}
            label={{ value: '°F', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.95)', 
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '8px'
            }}
            formatter={(value, name, props) => [
              `${value}°F`,
              props.payload.condition
            ]}
          />
          <Line 
            type="monotone" 
            dataKey="temp" 
            stroke="#3b82f6" 
            strokeWidth={3}
            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5 }}
            activeDot={{ r: 7 }}
          />
        </LineChart>
      </ResponsiveContainer>
      
      <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
        {weatherData.map((hour, idx) => (
          <div key={idx} className="flex flex-col items-center min-w-[60px] p-2 bg-white/50 dark:bg-gray-800/50 rounded-lg">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{hour.time}</span>
            <div className="my-1 text-blue-600 dark:text-blue-400">
              {getWeatherIcon(hour.condition)}
            </div>
            <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{hour.temp}°</span>
          </div>
        ))}
      </div>
    </div>
  );
}