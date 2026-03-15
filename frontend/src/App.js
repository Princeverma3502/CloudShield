import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { createClient } from '@supabase/supabase-js';
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { AreaChart, Area, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  ShieldCheck, Globe, Clock, Settings, Sun, Moon, 
  Download, Zap, Layers, Database, Lock, Trash2, 
  Save, LogOut, Github, Activity, Phone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './index.css';

// 1. Initialize Supabase
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL || '',
  process.env.REACT_APP_SUPABASE_ANON_KEY || ''
);

const GEO_DATA_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://cloudshield-backend.onrender.com';

export default function App() {
  const [session, setSession] = useState(null);
  const [stats, setStats] = useState({ hits: 0, misses: 0, coalesced: 0, totalSavedMs: 0, ttl: 60 });
  const [logs, setLogs] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [activeTab, setActiveTab] = useState('monitor');
  const [ttlInput, setTtlInput] = useState(60);
  const [isDark, setIsDark] = useState(true);
  
  // Auth States
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);

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

  // Auth Handlers
  const handleOAuthLogin = async (provider) => {
    const { error } = await supabase.auth.signInWithOAuth({ provider });
    if (error) toast.error(error.message);
  };

  const handlePhoneLogin = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithOtp({ phone });
    if (error) toast.error(error.message);
    else {
      setShowOtpInput(true);
      toast.success("OTP Sent!");
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.verifyOtp({ phone, token: otp, type: 'sms' });
    if (error) toast.error(error.message);
    else toast.success("Access Granted");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const themeClass = isDark ? "bg-[#020617] text-slate-300" : "bg-slate-50 text-slate-900";
  const cardClass = isDark ? "glass border-slate-800/50" : "bg-white border-slate-200 shadow-xl";
  const totalRequests = (stats.hits + stats.misses + stats.coalesced) || 1;

  if (!session) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-6 ${isDark ? 'bg-[#020617]' : 'bg-slate-100'}`}>
        <Toaster position="top-center" />
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`p-10 rounded-[3rem] w-full max-w-md border ${cardClass} text-center`}>
          <ShieldCheck size={48} className="text-blue-500 mx-auto mb-6" />
          <h2 className="text-3xl font-black mb-10 tracking-tighter">CloudShield</h2>
          
          <AnimatePresence mode="wait">
            {!showOtpInput ? (
              <motion.form key="phone" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} onSubmit={handlePhoneLogin} className="space-y-4">
                <input 
                  type="tel" placeholder="+91 Phone Number" 
                  className="w-full px-6 py-4 rounded-2xl bg-black/20 border border-white/5 outline-none focus:border-blue-500 transition-all text-center font-bold"
                  onChange={(e) => setPhone(e.target.value)} 
                />
                <button className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-lg uppercase tracking-widest text-[10px]">Send Security Code</button>
              </motion.form>
            ) : (
              <motion.form key="otp" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} onSubmit={verifyOtp} className="space-y-4">
                <input 
                  type="text" placeholder="6-Digit OTP" 
                  className="w-full px-6 py-4 rounded-2xl bg-black/20 border border-blue-500 outline-none text-center font-bold tracking-[0.5em]"
                  onChange={(e) => setOtp(e.target.value)} 
                />
                <button className="w-full py-4 bg-green-600 text-white font-black rounded-2xl shadow-lg uppercase tracking-widest text-[10px]">Verify Identity</button>
                <button type="button" onClick={() => setShowOtpInput(false)} className="text-[10px] text-slate-500 font-bold uppercase">Change Number</button>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="my-8 flex items-center gap-4 text-slate-700">
            <div className="h-[1px] flex-1 bg-current opacity-20" />
            <span className="text-[9px] font-black uppercase">Identity Provider</span>
            <div className="h-[1px] flex-1 bg-current opacity-20" />
          </div>

          <button onClick={() => handleOAuthLogin('github')} className="w-full flex items-center justify-center gap-3 py-4 bg-[#24292F] text-white rounded-2xl font-bold hover:bg-black transition-all">
            <Github size={18} /> Continue with GitHub
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-700 p-6 md:p-10 font-sans ${themeClass} overflow-x-hidden`}>
      <Toaster position="bottom-right" />
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-center mb-16 gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600 rounded-2xl shadow-xl shadow-blue-500/20"><Activity size={24} className="text-white" /></div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter uppercase italic leading-none">CloudShield</h1>
              <span className="text-[10px] font-bold text-blue-500 tracking-widest uppercase opacity-60">System Online</span>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-black/20 p-1.5 rounded-3xl border border-white/5 backdrop-blur-md">
            {['monitor', 'settings'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-8 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>{tab}</button>
            ))}
            <button onClick={handleLogout} className="p-3 text-slate-500 hover:text-red-500"><LogOut size={18} /></button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'monitor' ? (
            <motion.div key="m" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Efficiency */}
              <div className={`p-8 rounded-[2.5rem] border ${cardClass}`}>
                <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] mb-10">Efficiency Engine</h3>
                <div className="space-y-10">
                  <StatBar label="Cache Hits" value={stats.hits} total={totalRequests} color="from-blue-600 to-cyan-400" icon={Zap} delay={0.1} />
                  <StatBar label="Coalesced" value={stats.coalesced} total={totalRequests} color="from-purple-600 to-pink-400" icon={Layers} delay={0.2} />
                  <StatBar label="Direct" value={stats.misses} total={totalRequests} color="from-amber-600 to-orange-400" icon={Database} delay={0.3} />
                </div>
              </div>
              
              {/* Graph */}
              <div className={`lg:col-span-2 border rounded-[2.5rem] p-8 h-[380px] ${cardClass}`}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <Tooltip contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '16px' }} />
                    <Area type="monotone" dataKey="hits" stroke="#3b82f6" fillOpacity={0.1} fill="#3b82f6" strokeWidth={4} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Map */}
              <div className={`lg:col-span-2 border rounded-[3rem] h-[450px] overflow-hidden ${cardClass}`}>
                <ComposableMap projectionConfig={{ scale: 150 }} style={{ width: "100%", height: "100%" }}>
                  <Geographies geography={GEO_DATA_URL}>
                    {({ geographies }) => geographies.map((geo) => (
                      <Geography key={geo.rsmKey} geography={geo} fill={isDark ? "#0f172a" : "#e2e8f0"} stroke={isDark ? "#1e293b" : "#cbd5e1"} strokeWidth={0.5} style={{ default: { outline: 'none' } }} />
                    ))}
                  </Geographies>
                  {logs.filter(l => l.geo?.lat).map((log, i) => (
                    <Marker key={i} coordinates={[log.geo.lon, log.geo.lat]}>
                      <circle r={3} fill="#3b82f6" className="animate-ping" />
                    </Marker>
                  ))}
                </ComposableMap>
              </div>

              {/* Logs */}
              <div className={`p-8 border rounded-[2.5rem] ${cardClass} h-[450px] flex flex-col`}>
                <h4 className="text-[10px] font-black text-slate-500 uppercase mb-6 tracking-widest">Live Logs</h4>
                <div className="space-y-4 overflow-y-auto flex-1 custom-scrollbar">
                  {logs.slice(0, 15).map((log, i) => (
                    <div key={i} className="flex justify-between text-[10px] font-mono border-b border-white/5 pb-2">
                      <span className="text-blue-500">{log.status}</span>
                      <span className="opacity-50 truncate w-24">{log.url}</span>
                      <span className="font-bold">{log.latency}ms</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div key="s" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto">
              <div className={`border rounded-[3rem] p-12 ${cardClass}`}>
                <h3 className="text-xl font-black mb-10 text-blue-500 flex items-center gap-3"><Settings size={20} /> Settings</h3>
                <input type="range" min="10" max="3600" value={ttlInput} onChange={(e) => setTtlInput(e.target.value)} className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600 mb-8" />
                <button className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest">Update TTL</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

const StatBar = ({ label, value, total, color, icon: Icon, delay }) => {
  const percentage = Math.round((value / total) * 100) || 0;
  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay }}>
      <div className="flex justify-between items-end mb-2">
        <div className="flex items-center gap-2"><Icon size={14} className="text-slate-500" /><span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</span></div>
        <span className="text-lg font-black">{percentage}%</span>
      </div>
      <div className="h-2 w-full bg-slate-800/30 rounded-full overflow-hidden border border-white/5">
        <motion.div initial={{ width: 0 }} animate={{ width: `${percentage}%` }} transition={{ duration: 1 }} className={`h-full bg-gradient-to-r ${color}`} />
      </div>
    </motion.div>
  );
};