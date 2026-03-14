import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Zap, ShieldCheck, Globe, Activity, RefreshCcw, Database } from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState({ hits: 0, misses: 0, coalesced: 0, ttl: 60 });
  const [logs, setLogs] = useState([]);
  const [history, setHistory] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const mountedRef = useRef(true);

  const fetchData = async () => {
    setIsSyncing(true);
    try {
      const [statsRes, logsRes] = await Promise.all([
        axios.get('http://localhost:3000/api/performance'),
        axios.get('http://localhost:3000/api/logs')
      ]);
      
      if (mountedRef.current) {
        setStats(statsRes.data);
        setLogs(logsRes.data);
        setHistory(prev => [...prev.slice(-19), { 
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), 
          hits: statsRes.data.hits,
          misses: statsRes.data.misses
        }]);
      }
    } catch (e) { console.error("Sync Error"); }
    finally { setTimeout(() => { if (mountedRef.current) setIsSyncing(false); }, 500); }
  };

  useEffect(() => {
    const interval = setInterval(fetchData, 2000);
    fetchData();
    return () => { mountedRef.current = false; clearInterval(interval); };
  }, []);

  const handleTTLChange = async (newTtl) => {
    try {
      await axios.post('http://localhost:3000/api/ttl', { ttl: parseInt(newTtl) });
      setStats(prev => ({ ...prev, ttl: newTtl }));
    } catch (e) { console.error("TTL Update Failed"); }
  };

  const handlePurge = async () => {
    await axios.delete('http://localhost:3000/api/purge');
    setStats({ hits: 0, misses: 0, coalesced: 0, ttl: stats.ttl });
    setHistory([]);
    setLogs([]);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 p-8 font-sans">
      {/* Header */}
      <div className="max-w-7xl mx-auto flex justify-between items-center mb-12">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Cache-Cloud Engine
          </h1>
          <p className="text-slate-500 text-sm mt-1">Real-time Distributed Proxy Monitoring</p>
        </div>
        
        <div className="flex items-center gap-4">
          <button onClick={handlePurge} className="px-4 py-2 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-all">
            PURGE CACHE
          </button>
          <div className={`transition-all duration-500 ${isSyncing ? 'opacity-100' : 'opacity-30'}`}>
            <RefreshCcw size={18} className="animate-spin text-blue-400" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* TTL Control Card */}
        <div className="lg:col-span-3 bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 rounded-xl"><Database className="text-blue-400" /></div>
                <div>
                    <h4 className="font-semibold">Cache Expiration (TTL)</h4>
                    <p className="text-xs text-slate-500">Data persists in Redis for {stats.ttl} seconds</p>
                </div>
            </div>
            <input 
                type="range" min="5" max="3600" value={stats.ttl} 
                onChange={(e) => handleTTLChange(e.target.value)}
                className="w-64 accent-blue-500"
            />
        </div>

        <StatCard icon={<ShieldCheck className="text-blue-400" />} label="Cache Hits" value={stats.hits} trend="OPTIMIZED" />
        <StatCard icon={<Globe className="text-amber-400" />} label="Upstream Misses" value={stats.misses} trend="LATENCY" />
        <StatCard icon={<Zap className="text-purple-400" />} label="Coalesced" value={stats.coalesced} trend="SAVINGS" />

        {/* Chart */}
        <div className="lg:col-span-2 bg-slate-800/40 border border-slate-700/50 rounded-2xl p-8">
          <h3 className="text-xl font-semibold mb-8 flex items-center gap-2"><Activity size={20} /> Traffic Velocity</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="time" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none' }} />
                <Area type="monotone" dataKey="hits" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} />
                <Area type="monotone" dataKey="misses" stroke="#f59e0b" fill="transparent" strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-8 overflow-hidden">
          <h3 className="text-xl font-semibold mb-6">Live Stream</h3>
          <div className="space-y-4">
            {logs.map(log => (
              <div key={log.id} className="flex justify-between items-center border-b border-slate-700/50 pb-2">
                <div>
                    <div className={`text-[10px] font-bold ${log.status === 'HIT' ? 'text-emerald-400' : 'text-amber-400'}`}>{log.status}</div>
                    <div className="text-xs font-mono truncate w-40">{log.url}</div>
                </div>
                <div className="text-[10px] text-slate-500">{log.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, trend }) => (
  <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6">
    <div className="flex justify-between items-start mb-4">
      <div className="p-3 bg-slate-900/50 rounded-xl">{icon}</div>
      <span className="text-[10px] font-bold px-2 py-1 rounded bg-slate-900 text-slate-400">{trend}</span>
    </div>
    <div className="text-sm text-slate-400">{label}</div>
    <div className="text-4xl font-bold">{value}</div>
  </div>
);

export default Dashboard;