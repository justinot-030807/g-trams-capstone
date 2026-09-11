import React from 'react';
import MainLayout from '../../components/MainLayout';
import { Users, GraduationCap, Code, Server, ShieldCheck, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const About = () => {
  const navigate = useNavigate();

  // Since actual names were not provided, we leave a cool generic placeholder that they can easily edit
  const developers = [
    { name: "John Doe", role: "Project Manager / Lead Dev", icon: <Users size={20} className="text-blue-500" /> },
    { name: "Jane Smith", role: "Frontend Developer", icon: <Code size={20} className="text-emerald-500" /> },
    { name: "Juan Dela Cruz", role: "Backend / Database", icon: <Server size={20} className="text-amber-500" /> },
    { name: "Maria Clara", role: "UI/UX Designer", icon: <Heart size={20} className="text-rose-500" /> },
    { name: "Pedro Penduko", role: "QA / Security", icon: <ShieldCheck size={20} className="text-indigo-500" /> },
  ];

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto pb-16">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 pl-2 pr-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer border border-slate-200 dark:border-slate-700 shadow-sm w-fit mb-6"
        >
          <div className="w-6 h-6 rounded-full bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center">
            <ArrowLeft size={14} className="text-slate-700 dark:text-slate-200" />
          </div>
          <span className="text-[10px] font-bold tracking-wide uppercase">Back</span>
        </button>

        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="bg-[#7A1B22] dark:bg-slate-800 text-white p-8 sm:p-10 text-center relative overflow-hidden">
            <GraduationCap size={120} className="absolute -right-6 -top-6 text-white/10 rotate-12 pointer-events-none" />
            <div className="relative z-10">
              <h1 className="text-3xl sm:text-4xl font-black mb-3">About GTRAMS</h1>
              <p className="text-sm sm:text-base text-white/80 max-w-2xl mx-auto leading-relaxed">
                Gasan Tricycle Route and Management System
              </p>
            </div>
          </div>

          <div className="p-6 sm:p-10 space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-4">
              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                This system was proudly developed by the Capstone Team from <strong>Marinduque State University (MarSU)</strong>. Our goal is to digitize and streamline the franchise renewal and application process for the local government of Gasan, making it faster and more accessible for all TODA members and operators.
              </p>
            </div>

            <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white text-center mb-6">
                Meet the Developers
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {developers.map((dev, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 flex items-center gap-4 hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center shrink-0">
                      {dev.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm">{dev.name}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{dev.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center pt-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-xs font-bold border border-amber-200 dark:border-amber-900/60">
                <span>🎓 Capstone Project - Marinduque State University</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default About;
