import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { createClient } from '@supabase/supabase-js';
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { AreaChart, Area, Tooltip, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { 
  ShieldCheck, Globe, Clock, Settings, Sun, Moon, 
  Download, Zap, Layers, Database, Lock, Trash2, 
  Save, LogOut, Github, Chrome, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './index.css';

// Initialize Supabase (Replace with your own keys from Supabase Dashboard)
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL || 'YOUR_SUPABASE_URL',
  process.env.REACT_APP_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'
);

const GEO_DATA_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://cloudshield-backend.onrender.com';

const Dashboard = () => {
  const [session, setSession] = useState(null);
  const [stats, setStats] = useState({ hits: 0, misses: 0, coalesced: 0, totalSavedMs: 0, ttl: 60 });
  const [logs, setLogs] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [activeTab, setActiveTab] = useState('monitor');
  const [ttlInput, setTtlInput] = useState(60);
  const [isDark, setIsDark] = useState(true);

  // Auth Listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchData = async () => {
    try {
      const s = await axios.get(`${API_BASE_URL}/api/performance`);
      const l = await axios.get(`${API_BASE_URL}/api/logs`);
      setStats(s.data);
      setLogs(l.data || []);
      setChartData(prev => [...prev, { 
        time: new Date().toLocaleTimeString().slice(-5), 
        hits: s.data.hits, 
        misses: s.data.misses 
      }].slice(-15));
    } catch (e) { console.warn("Telemetry offline..."); }
  };

  useEffect(() => {
    if (session) {
      fetchData();
      const intervalId = setInterval(fetchData, 5000);
      return () => clearInterval(intervalId);
    }
  }, [session]);

  const handleOAuthLogin = async (provider) => {
    const { error } = await supabase.auth.signInWithOAuth({ provider });
    if (error) toast.error(error.message);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Terminal Disconnected");
  };

  const updateTTL = async () => {
    try {
      await axios.post(`${API_BASE_URL}/api/config`, { ttl: parseInt(ttlInput) });
      toast.success(`Cache TTL optimized: ${ttlInput}s`);
    } catch (e) { toast.error("Config failed to commit"); }
  };

  const themeClass = isDark ? "bg-[#020617] text-slate-300" : "bg-slate-50 text-slate-900";
  const cardClass = isDark ? "glass border-slate-800/50" : "bg-white border-slate-200 shadow-xl";
  const totalRequests = (stats.hits + stats.misses + stats.coalesced) || 1;

  if (!session) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-6 ${isDark ? 'bg-[#020617]' : 'bg-slate-100'}`}>
        <motion.div 
          initial={{ y: 20, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }} 
          className={`p-10 rounded-[3rem] w-full max-w-md border ${cardClass} text-center`}
        >
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-blue-600 rounded-3xl shadow-2xl shadow-blue-500/20">
              <ShieldCheck size={40} className="text-white" />
            </div>
          </div>
          <h2 className={`text-3xl font-black mb-2 tracking-tighter ${isDark ? 'text-white' : 'text-slate-900'}`}>CloudShield</h2>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-10">Cyber Infrastructure Access</p>
          
          <div className="space-y-4">
            <button 
              onClick={() => handleOAuthLogin('github')}
              className="w-full flex items-center justify-center gap-3 py-4 bg-[#24292F] text-white rounded-2xl font-bold hover:bg-black transition-all"
            >
              <Github size={20} /> Continue with GitHub
            </button>
            <button 
              onClick={() => handleOAuthLogin('google')}
              className="w-full flex items-center justify-center gap-3 py-4 bg-white text-black border border-slate-200 rounded-2xl font-bold hover:bg-slate-50 transition-all"
            >
              <Chrome size={20} /> Continue with Google
            </button>
          </div>
          <p className="mt-8 text-[10px] text-slate-500 uppercase font-black tracking-widest opacity-40">Identity Managed by Supabase Auth</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-700 p-6 md:p-10 font-sans ${themeClass} overflow-x-hidden`}>
      <Toaster position="top-center" />
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-center mb-16 gap-6">
          <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex items-center gap-4 group">
            <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/40">
                <Activity size={24} className="text-white" />
            </div>
            <div>
                <h1 className="text-2xl font-black tracking-tighter uppercase leading-none italic">CloudShield</h1>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                  <span className="text-[10px] font-bold text-blue-500 tracking-[0.2em] uppercase">Node: Global-v2.4</span>
                </div>
            </div>
          </motion.div>

          <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex items-center gap-4 bg-black/20 p-2 rounded-[2rem] border border-white/5 backdrop-blur-md">
            <nav className="flex gap-1 p-1">
                {['monitor', 'settings'].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`px-8 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-500 hover:text-white'}`}>{tab}</button>
                ))}
            </nav>
            <div className="h-6 w-[1px] bg-white/10 mx-2" />
            <button onClick={() => setIsDark(!isDark)} className="p-3 text-slate-400 hover:text-amber-500 transition-colors">
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button onClick={handleLogout} className="p-3 text-slate-400 hover:text-red-500"><LogOut size={18} /></button>
          </motion.div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'monitor' ? (
            <motion.div 
              key="monitor" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Efficiency Sliders */}
              <div className={`p-8 rounded-[2.5rem] border ${cardClass}`}>
                  <div className="flex items-center gap-3 mb-10">
                      <Zap className="text-blue-500" size={20} />
                      <h3 className="text-[11px] font-black uppercase text-slate-500 tracking-[0.2em]">Live Efficiency</h3>
                  </div>
                  <div className="space-y-10">
                      <StatBar label="Cache Accuracy" value={stats.hits} total={totalRequests} color="from-blue-600 to-cyan-400" icon={ShieldCheck} delay={0.1} />
                      <StatBar label="Traffic Coalescing" value={stats.coalesced} total={totalRequests} color="from-purple-600 to-pink-400" icon={Layers} delay={0.2} />
                      <StatBar label="Direct Backend" value={stats.misses} total={totalRequests} color="from-amber-600 to-orange-400" icon={Database} delay={0.3} />
                  </div>
              </div>

              {/* Real-time Graph */}
              <div className={`lg:col-span-2 border rounded-[2.5rem] p-8 h-[380px] relative ${cardClass}`}>
                <div className="absolute top-6 left-8 flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                   <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Throughput Analysis</span>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 40, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorHits" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="hits" stroke="#3b82f6" fill="url(#colorHits)" strokeWidth={4} />
                    <Area type="monotone" dataKey="misses" stroke="#f59e0b" fill="transparent" strokeWidth={2} strokeDasharray="5 5" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Map Visualization */}
              <div className={`lg:col-span-2 border rounded-[3rem] overflow-hidden h-[450px] relative ${cardClass}`}>
                <ComposableMap projectionConfig={{ scale: 160 }} style={{ width: "100%", height: "100%" }}>
                  <Geographies geography={GEO_DATA_URL}>
                    {({ geographies }) => geographies.map((geo) => (
                      <Geography 
                        key={geo.rsmKey} geography={geo} 
                        fill={isDark ? "#111827" : "#e2e8f0"} stroke={isDark ? "#1f2937" : "#cbd5e1"} 
                        strokeWidth={0.5} style={{ default: { outline: 'none' } }} 
                      />
                    ))}
                  </Geographies>
                  {logs.filter(l => l.geo?.lat).map((log, i) => (
                    <Marker key={i} coordinates={[log.geo.lon, log.geo.lat]}>
                      <motion.circle 
                        initial={{ r: 0, opacity: 0 }} animate={{ r: 4, opacity: 1 }}
                        transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
                        fill={log.status === 'HIT' ? '#3b82f6' : '#f59e0b'} 
                      />
                    </Marker>
                  ))}
                </ComposableMap>
              </div>

              {/* Data Cards */}
              <div className="space-y-6">
                <motion.div whileHover={{ y: -5 }} className={`p-8 border rounded-[2.5rem] flex items-center justify-between ${cardClass}`}>
                  <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Time Salvage</p>
                      <p className="text-4xl font-black text-blue-500 tracking-tighter">-{stats.totalSavedMs}ms</p>
                  </div>
                  <Clock size={32} className="text-blue-500 opacity-20" />
                </motion.div>

                <div className={`p-8 border rounded-[2.5rem] ${cardClass} h-[310px] flex flex-col`}>
                  <h4 className="text-[11px] font-black text-slate-500 uppercase mb-6 tracking-widest flex items-center justify-between">
                      <span>Recent Events</span>
                      <div className="flex gap-1">
                        {[1, 2, 3].map(i => <div key={i} className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" />)}
                      </div>
                  </h4>
                  <div className="space-y-4 overflow-y-auto flex-1 custom-scrollbar pr-2">
                    {logs.slice(0, 10).map((log, i) => (
                      <motion.div initial={{ x: 10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.05 }} key={i} className="flex justify-between items-center text-[10px] font-mono border-b border-white/5 pb-3">
                        <span className={`px-2 py-0.5 rounded ${log.status === 'HIT' ? 'bg-blue-500/10 text-blue-500' : 'bg-amber-500/10 text-amber-500'}`}>{log.status}</span>
                        <span className="opacity-50 truncate w-24">{log.url}</span>
                        <span className="font-bold">{log.latency}ms</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto">
              <div className={`border rounded-[3rem] p-12 ${cardClass}`}>
                <h3 className="text-xl font-black mb-10 flex items-center gap-4 text-blue-500"><Settings size={24} /> Configuration</h3>
                <div className="space-y-12">
                  <section>
                    <div className="flex justify-between items-end mb-6">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Cache Lifetime: {ttlInput}s</h4>
                      <Clock className="text-slate-700" size={20} />
                    </div>
                    <input type="range" min="10" max="3600" value={ttlInput} onChange={(e) => setTtlInput(e.target.value)} className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600 mb-8" />
                    <button onClick={updateTTL} className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl hover:shadow-2xl hover:shadow-blue-500/30 transition-all uppercase tracking-widest text-[10px]">Save Configuration</button>
                  </section>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const StatBar = ({ label, value, total, color, icon: Icon, delay }) => {
    const percentage = Math.round((value / total) * 100) || 0;
    return (
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay }}>
            <div className="flex justify-between items-end mb-3">
                <div className="flex items-center gap-3">
                    <Icon size={16} className="text-slate-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</span>
                </div>
                <span className="text-lg font-black">{percentage}%</span>
            </div>
            <div className="h-3 w-full bg-slate-800/30 rounded-full overflow-hidden p-[2px] border border-white/5">
                <motion.div initial={{ width: 0 }} animate={{ width: `${percentage}%` }} transition={{ duration: 1, ease: "easeOut" }} className={`h-full bg-gradient-to-r ${color} rounded-full`} />
            </div>
        </motion.div>
    );
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass p-4 rounded-2xl border-white/10 text-[10px] font-black uppercase tracking-widest">
        <p className="text-blue-500 mb-1">Hits: {payload[0].value}</p>
        <p className="text-amber-500">Misses: {payload[1].value}</p>
      </div>
    );
  }
  return null;
};

export default Dashboard;