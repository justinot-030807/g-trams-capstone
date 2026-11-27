import React from 'react';
import MainLayout from '../../components/MainLayout';
import { GraduationCap, Code2, Briefcase, Cpu, BookOpen, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CAPSTONE_TEAM } from '../../utils/projectInfo';

const ROLE_ICONS = {
  lead_dev: Code2,
  project_manager: Briefcase,
  system_analyst: Cpu,
  researcher: BookOpen,
};

const About = () => {
  const navigate = useNavigate();

  const developers = CAPSTONE_TEAM.map((member) => {
    const IconComponent = ROLE_ICONS[member.iconKey] || BookOpen;
    return {
      ...member,
      icon: <IconComponent size={20} className="text-[#9E2A2B] dark:text-[#D4AF37]" />,
    };
  });

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto pb-16">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#F6F5F3] hover:bg-[#E4E1DC] dark:bg-[#1C1917] dark:hover:bg-[#2E2A27] text-[#1F1D1B] dark:text-[#EAE7E1] transition-all cursor-pointer border border-[#E4E1DC] dark:border-[#2E2A27] shadow-sm w-fit mb-5 min-h-[44px]"
        >
          <ArrowLeft size={16} className="text-[#6B6761] dark:text-[#A8A29E]" />
          <span className="text-xs font-bold tracking-wider uppercase">Bumalik (Back)</span>
        </button>

        <div className="bg-white dark:bg-[#1C1917] rounded-xl shadow-sm border border-[#E4E1DC] dark:border-[#2E2A27] overflow-hidden">
          <div className="bg-[#9E2A2B] border-b border-[#7A1B22] text-white p-6 sm:p-8 text-center relative overflow-hidden">
            <GraduationCap size={100} className="absolute -right-4 -top-4 text-white/10 rotate-12 pointer-events-none" />
            <div className="relative z-10">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-[-0.025em] mb-2">Tungkol sa G-TRAMS</h1>
              <p className="text-xs sm:text-sm text-white/85 max-w-2xl mx-auto leading-relaxed">
                Gasan Tricycle Records &amp; Application Management System
              </p>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <p className="text-[#6B6761] dark:text-[#A8A29E] text-xs sm:text-sm leading-relaxed">
                Ang sistemang ito ay buong pusong nilikha ng Capstone Team mula sa <strong>Marinduque State University (MarSU)</strong> katuwang ang Pamahalaang Bayan ng Gasan. Layunin nitong gawing mabilis, maaasahan, at digital ang pagpoproseso ng prangkisa at pamamahala ng mga TODA.
              </p>
            </div>

            <div className="pt-6 border-t border-[#E4E1DC] dark:border-[#2E2A27]">
              <h2 className="text-base sm:text-lg font-bold text-[#1F1D1B] dark:text-[#F6F5F3] text-center mb-5 tracking-[-0.015em]">
                Mga Tagapagtaguyod ng Proyekto
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {developers.map((dev, idx) => (
                  <div key={idx} className="p-3.5 rounded-lg bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-lg bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] flex items-center justify-center shrink-0">
                      {dev.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-[#1F1D1B] dark:text-[#F6F5F3] text-xs sm:text-sm">{dev.name}</h3>
                      <p className="text-[11px] text-[#6B6761] dark:text-[#A8A29E] mt-0.5">{dev.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center pt-6 border-t border-[#E4E1DC] dark:border-[#2E2A27]">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/50 text-[#B45309] dark:text-amber-300 text-xs font-bold border border-amber-200 dark:border-amber-800/60">
                <GraduationCap size={14} />
                <span>Capstone Project &bull; Marinduque State University</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default About;
