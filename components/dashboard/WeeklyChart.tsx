import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface Attendance {
  date: string; // ou Date, dependendo do backend
  status: 'Presente' | 'Ausente';
}

interface WeeklyChartProps {
  attendanceData: Attendance[];
}



export default function WeeklyChart({ attendanceData }: WeeklyChartProps) {
  const weekDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
  
  const chartData = weekDays.map((day, index) => {
    const dayData = attendanceData.filter(a => {
      const date = new Date(a.date);
      return date.getDay() === index + 1;
    });
    
    return {
      name: day,
      presentes: dayData.filter(a => a.status === 'Presente').length,
      ausentes: dayData.filter(a => a.status === 'Ausente').length,
    };
  });

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
      <h3 className="font-semibold text-slate-800 mb-4">Frequência Semanal</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barGap={8}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 12 }}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 12 }}
            />
            <Tooltip 
              contentStyle={{ 
                borderRadius: '12px', 
                border: 'none',
                boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
              }}
            />
            <Bar 
              dataKey="presentes" 
              fill="url(#colorPresentes)" 
              radius={[6, 6, 0, 0]}
              name="Presentes"
            />
            <Bar 
              dataKey="ausentes" 
              fill="url(#colorAusentes)" 
              radius={[6, 6, 0, 0]}
              name="Ausentes"
            />
            <defs>
              <linearGradient id="colorPresentes" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
              <linearGradient id="colorAusentes" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f43f5e" />
                <stop offset="100%" stopColor="#fb7185" />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-linear-to-r from-indigo-500 to-purple-500"></div>
          <span className="text-sm text-slate-600">Presentes</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-linear-to-r from-rose-500 to-rose-400"></div>
          <span className="text-sm text-slate-600">Ausentes</span>
        </div>
      </div>
    </div>
  );
}