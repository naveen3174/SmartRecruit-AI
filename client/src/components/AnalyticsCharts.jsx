import React from 'react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';

const AnalyticsCharts = ({ data }) => {
  const radarData = [
    { subject: 'Overall', A: data.overallScore || 0, fullMark: 100 },
    { subject: 'Technical', A: data.technicalScore || 0, fullMark: 100 },
    { subject: 'Communication', A: data.communicationScore || 0, fullMark: 100 },
    { subject: 'Confidence', A: data.confidenceScore || 0, fullMark: 100 },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Radar Chart */}
      <div className="glass-card p-8 rounded-3xl h-[400px]">
        <h3 className="text-lg font-semibold mb-6">Performance Radar</h3>
        <ResponsiveContainer width="100%" height="85%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
            <PolarGrid stroke="#334155" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <Radar
              name="Score"
              dataKey="A"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.5}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Bar Chart for Scores */}
      <div className="glass-card p-8 rounded-3xl h-[400px]">
        <h3 className="text-lg font-semibold mb-6">Score Breakdown</h3>
        <ResponsiveContainer width="100%" height="85%">
          <BarChart data={radarData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
            <XAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis hide domain={[0, 100]} />
            <Tooltip 
              contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
              itemStyle={{ color: '#3b82f6' }}
            />
            <Bar dataKey="A" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AnalyticsCharts;
