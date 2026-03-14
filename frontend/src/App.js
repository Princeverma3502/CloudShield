import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Zap, ShieldCheck, Globe, Activity, RefreshCcw } from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState({ hits: 0, misses: 0, coalesced: 0 });
  const [history, setHistory] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsSyncing(true);
      try {
        // Full URL to your local backend
        const res = await axios.get('http://localhost:3000/api/performance');
        
        if (mountedRef.current) {
          setStats(res.data);
          setHistory(prev => {
            const newEntry = { 
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), 
              ...res.data 
            };
            // Keep the last 20 data points for the graph
            return [...prev.slice(-19), newEntry];
          });
        }
      } catch (e) { 
        console.error("Backend offline. Check if Docker api-server is running."); 
      } finally {
        setTimeout(() => { if (mountedRef.current) setIsSyncing(false); }, 500);
      }
    };

    const interval = setInterval(fetchData, 2000);
    fetchData(); // Fetch immediately on load

    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 p-8">
      {/* ... (Header stays the same) ... */}
      <div className="max-w-7xl mx-auto flex justify-between items-center mb-12">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Cache-Cloud Engine
          </h1>
          <p className="text-slate-500 text-sm mt-1">Real-time Distributed Proxy Monitoring</p>
        </div>
        <div className="flex items-center gap-4">
          <div className={`transition-all duration-500 ${isSyncing ? 'opacity-100' : 'opacity-30'}`}>
            <RefreshCcw size={18} className="animate-spin text-blue-400" />
          </div>
          <div className="px-4 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-semibold flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            SYSTEM OPERATIONAL
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        <StatCard icon={<ShieldCheck className="text-blue-400" />} label="Cache Hits" value={stats.hits} description="Requests served from Redis memory" trend="HIT RATE" />
        <StatCard icon={<Globe className="text-amber-400" />} label="Upstream Misses" value={stats.misses} description="Direct calls to external APIs" trend="LATENCY" />
        <StatCard icon={<Zap className="text-purple-400" />} label="Coalesced" value={stats.coalesced} description="Simultaneous requests unified" trend="OPTIMIZED" />

        <div className="lg:col-span-3 bg-slate-800/40 border border-slate-700/50 backdrop-blur-md rounded-2xl p-8 shadow-xl">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <Activity className="text-blue-400" size={20} /> Traffic Velocity
            </h3>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="colorHits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} minTickGap={30} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="hits" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorHits)" animationDuration={1000} />
                <Area type="monotone" dataKey="misses" stroke="#f59e0b" strokeWidth={2} fill="transparent" strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, description, trend }) => (
  <div className="bg-slate-800/40 border border-slate-700/50 backdrop-blur-md rounded-2xl p-6 transition-all duration-300 hover:translate-y-[-4px] hover:border-blue-500/30">
    <div className="flex justify-between items-start mb-4">
      <div className="p-3 bg-slate-900/50 rounded-xl">{icon}</div>
      <span className="text-[10px] font-bold px-2 py-1 rounded bg-slate-900 text-slate-400 uppercase tracking-wider">
        {trend}
      </span>
    </div>
    <div className="text-sm text-slate-400 font-medium">{label}</div>
    <div className="text-4xl font-bold my-1">{value}</div>
    <div className="text-xs text-slate-500 italic mt-2">{description}</div>
  </div>
);

export default Dashboard;