"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n";
import { loadForm, saveForm, type FormState } from "@/lib/session";
import { motion } from "framer-motion";
import FeatureCard from "./FeatureCard";

export default function HomeForm() {
  const { t, lang } = useT();
  const router = useRouter();
  const [step, setStep] = useState<'idle' | 'searching'>('idle');
  const [zip, setZip] = useState("");

  const startSearching = () => setStep('searching');

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:py-20">
      
      {/* 1. HERO SECTION WITH ANIMATED DOCTOR BIRD */}
      <section className="flex flex-col items-center text-center">
        {/* The Animated Bird */}
        <motion.div
          animate={{ 
            y: [0, -60, 0],
            rotate: [-1, 3, -1]
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="relative mb-6 h-90 w-90 drop-shadow-2xl"
        >
          <img 
            src="/doctor-bird.png" 
            alt="Doctor Bird Mascot" 
            className="h-full w-full object-contain"
          />
        </motion.div>

        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
          Healthcare help, <span className="text-medical-600">without the maze.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
          Find care, lower costs, and understand your documents — all in one place.
        </p>

        {/* Search-First Input */}
        <div className="mt-10 w-full max-w-2xl px-2">
          <div className="relative group">
            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
              <span className="text-2xl">🔍</span>
            </div>
            <input
              type="text"
              placeholder="Search by symptoms or ZIP code..."
              className="w-full rounded-3xl border-0 bg-white py-6 pl-16 pr-36 text-lg shadow-soft ring-1 ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-medical-600 transition-all"
              onClick={startSearching}
              value={zip}
              onChange={(e) => setZip(e.target.value)}
            />
            <button 
              onClick={startSearching}
              className="absolute right-3 top-2.5 bottom-2.5 px-8 rounded-2xl bg-medical-600 text-white font-bold text-sm hover:bg-medical-700 transition-all active:scale-95"
            >
              Get Started
            </button>
          </div>
        </div>
      </section>

      {/* 2. CARD-BASED DASHBOARD SECTION */}
      <section className="mt-24">
        <div className="mb-10 text-center sm:text-left">
          <h2 className="text-2xl font-bold text-slate-900">What do you need help with?</h2>
          <p className="text-slate-500 mt-1">Select a tool to begin your journey</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          <FeatureCard
            icon="🧾"
            label={t("nav.lowerCosts")}
            description={t("home.lowerCostsHint")}
            active={false}
            onClick={() => router.push("/costs")}
          />
          <FeatureCard
            icon="📄"
            label={t("nav.understandDocs")}
            description={t("home.docsHint")}
            active={false}
            onClick={() => router.push("/docs")}
          />
          <FeatureCard
            icon="🪪"
            label={t("nav.getHelp")}
            description={t("home.applyHint")}
            active={false}
            onClick={() => router.push("/apply")}
          />
        </div>
      </section>

      {/* 3. CONVERSATIONAL STEP OVERLAY */}
      {step === 'searching' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-lg bg-white rounded-3xl p-10 shadow-2xl"
          >
             <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-2">
                  <img src="/doctor-bird.png" className="w-8 h-8" alt="Bird" />
                  <span className="text-xs font-bold uppercase tracking-widest text-medical-600">Navigator Guide</span>
                </div>
                <button 
                  onClick={() => setStep('idle')} 
                  className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
                >
                  ✕
                </button>
             </div>
             
             <h3 className="text-3xl font-bold text-slate-900 mb-4 leading-tight">
               Great! To start, what is your ZIP code?
             </h3>
             <p className="text-slate-500 mb-8">This helps me find the best care options near you.</p>
             
             <input 
               autoFocus
               type="text"
               inputMode="numeric"
               maxLength={5}
               className="w-full text-5xl font-bold border-none focus:ring-0 outline-none py-4 mb-10 text-medical-600 placeholder:text-slate-100"
               placeholder="00000"
               value={zip}
               onChange={(e) => setZip(e.target.value.replace(/\D/g, ""))}
             />
             
             <button 
                onClick={() => router.push('/care')}
                className="group w-full py-5 rounded-2xl bg-medical-600 text-white font-bold text-xl hover:bg-medical-700 transition-all shadow-lg shadow-medical-200 flex items-center justify-center gap-2"
              >
                Continue
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}