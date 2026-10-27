import React, { useState } from 'react';
import { useAppStore } from '../../features/useAppStore';
import { StaticHighlandBackground } from './StaticHighlandBackground';
import { AppNavbar } from '../layout/AppNavbar';
import { 
  Compass, 
  MapPin, 
  Sparkles, 
  AlertTriangle, 
  ChevronRight, 
  PhoneCall, 
  ArrowRight, 
  CheckCircle2, 
  Navigation, 
  Clock, 
  Send,
  CloudSun,
  ShieldCheck,
  Building2,
  ExternalLink
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { 
    setPageView 
  } = useAppStore();

  // Chat Interactive Simulator State
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'assistant'; text: string; amharic?: string }>>([
    {
      sender: 'user',
      text: 'Find a 24-hour pharmacy near Bole Medhane Alem and check if pain relievers and altitude remedies are stocked.',
    },
    {
      sender: 'assistant',
      text: 'Lion Pharmacy (Bole Branch) is 450 meters away and open 24/7. Verified in stock: Paracetamol, Ibuprofen, and Diamox for highland acclimatization.',
      amharic: 'አንበሳ ፋርማሲ (ቦሌ ቅርንጫፍ) ለ24 ሰዓት ክፍት ነው። ራስ ምታት እና የከፍታ ማስታገሻ መድኃኒቶች ተረጋግጠው ይገኛሉ።',
    }
  ]);
  const [chatInput, setChatInput] = useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput.trim();
    setChatMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setChatInput('');

    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: `Verified guidance for "${userText}": Route corridors are clear, local highland transports operating normally.`,
          amharic: `የተረጋገጠ መረጃ: የመንገድ መስመሮች ክፍት ናቸው፣ የትራንስፖርት አገልግሎቶች በመደበኛ ሁኔታ በመስራት ላይ ይገኛሉ።`,
        }
      ]);
    }, 600);
  };

  const handleStarterPrompt = (prompt: string) => {
    setChatMessages((prev) => [...prev, { sender: 'user', text: prompt }]);
    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: `Highland Intelligence check complete: Live verification confirms normal traffic and open services along this sector.`,
          amharic: `የቀጥታ ማጣሪያ ውጤት: የተጠቀሰው አካባቢ ትራፊክ እና አገልግሎት ክፍት መሆኑ ተረጋግጧል።`,
        }
      ]);
    }, 600);
  };

  const verifiedPlaces = [
    {
      id: 'p-1',
      title: "St. Paul's Hospital Millennium Medical College",
      location: 'Gulele Subcity, Addis Ababa',
      distance: '2.4 km away',
      status: 'Open 24/7 • Emergency Ready',
      desc: 'Full trauma response unit, multilingual medical staff, modern diagnostics, and dedicated blood bank.',
      badge: 'Guild Verified',
      image: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'p-2',
      title: 'Entoto Park Viewpoint Lodge & Cafe',
      location: 'Entoto Mountain Ridges',
      distance: '7.8 km away',
      status: 'Open now • Scenic view',
      desc: 'Fresh organic highland herbal teas, artisan coffee roasting ceremonies, and elevated city vistas.',
      badge: 'Highland Haven',
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'p-3',
      title: 'TotalEnergies Station & Supermarket',
      location: 'Meskel Square Corridor',
      distance: '1.1 km away',
      status: 'Open 24/7 • EV & Diesel',
      desc: 'Reliable diesel and petrol supplies, tire pressure services, 24/7 grocery mart, and verified ATM kiosk.',
      badge: 'Fuel In Stock',
      image: 'https://images.unsplash.com/photo-1545459720-aac8509eb02c?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'p-4',
      title: 'Lucy Gazebo Traditional Cultural Restaurant',
      location: 'National Museum Precinct',
      distance: '3.2 km away',
      status: 'Authentic dining',
      desc: 'Fresh sourdough injera, clay pot stews, traditional honey wine, and soothing live krar music recitals.',
      badge: '4.9 Travelers Pick',
      image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
    },
  ];

  return (
    <div className="relative min-h-screen bg-surface text-on-surface flex flex-col font-sans selection:bg-primary-fixed selection:text-on-primary-fixed overflow-x-hidden">
      
      {/* 3D Static Highland Terrain & AI Core Background (Zero Animation Loop) */}
      <StaticHighlandBackground />

      {/* Reusable Application Navigation Bar */}
      <AppNavbar activePage="home" />

      {/* MAIN CONTENT AREA */}
      <main className="relative z-10 flex-grow">
        
        {/* 1. HERO SECTION WITH STATIC HIGHLAND WIREFRAME BACKDROP & REAL-TIME SEARCH */}
        <section className="relative min-h-[560px] lg:min-h-[640px] flex items-center justify-center overflow-hidden py-16 px-4 sm:px-6 lg:px-8">
          
          {/* Hero Center Presentation */}
          <div className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center">
            
            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl font-display font-extrabold text-primary mb-4 tracking-tight drop-shadow-sm">
              Explore with confidence.
            </h1>
            <p className="text-base sm:text-lg text-on-surface-variant max-w-2xl mb-8 leading-relaxed font-normal">
              Discover places nearby, plan your journey, and get trusted travel guidance in your language.
            </p>

            {/* Primary & Secondary Action CTAs */}
            <div className="flex flex-wrap items-center justify-center gap-4 mb-10">
              <button
                onClick={() => setPageView('app')}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-primary text-white font-bold text-sm hover:bg-primary-dark transition-all shadow-highland hover:scale-105 active:scale-95 rounded-xl group"
              >
                <Compass className="w-4 h-4 text-secondary-light group-hover:rotate-45 transition-transform" />
                <span>Explore nearby</span>
              </button>

              <a
                href="#ai-assistant"
                className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-surface-lowest/95 backdrop-blur-md text-primary font-bold text-sm hover:bg-white transition-all shadow-sm hover:shadow-md border border-outline-variant/40 rounded-xl group"
              >
                <Sparkles className="w-4 h-4 text-secondary group-hover:scale-110 transition-transform" />
                <span>Ask GuzoMate</span>
                <span className="text-[10px] text-on-surface-variant font-bold bg-surface-low px-2 py-0.5 rounded">
                  AI
                </span>
              </a>
            </div>

          </div>

        </section>

        {/* 2. QUICK ACTIONS HUB (Bento Grid Style - 4 Distinct Cards) */}
        <section className="max-w-7xl mx-auto px-4 lg:px-8 mb-16 relative z-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            
            {/* Card 1 */}
            <div 
              onClick={() => setPageView('app')}
              className="group bg-surface-lowest p-6 rounded-2xl border border-outline-variant/40 shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-200 flex flex-col justify-between cursor-pointer"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors duration-200">
                  <Building2 className="w-6 h-6" />
                </div>
                <h2 className="text-base font-bold text-on-surface mb-1 group-hover:text-primary transition-colors">
                  Find Nearby Services
                </h2>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Verified emergency health facilities, roadside dining, highland lodges, and guaranteed fuel points.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs font-bold text-primary">
                <span>Scan 15km perimeter</span>
                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>

            {/* Card 2 */}
            <div 
              onClick={() => setPageView('app')}
              className="group bg-surface-lowest p-6 rounded-2xl border border-outline-variant/40 shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-200 flex flex-col justify-between cursor-pointer"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors duration-200">
                  <Navigation className="w-6 h-6" />
                </div>
                <h2 className="text-base font-bold text-on-surface mb-1 group-hover:text-primary transition-colors">
                  Plan Route &amp; Transit
                </h2>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Addis Ababa Sheger &amp; Anbessa bus corridors, Sheger train links, plus national toll highway updates.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs font-bold text-primary">
                <span>View transit timelines</span>
                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>

            {/* Card 3 */}
            <a 
              href="#ai-assistant"
              className="group bg-surface-lowest p-6 rounded-2xl border border-outline-variant/40 shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-200 flex flex-col justify-between cursor-pointer"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors duration-200">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h2 className="text-base font-bold text-on-surface mb-1 group-hover:text-primary transition-colors flex items-center gap-1.5">
                  <span>Ask GuzoMate AI</span>
                  <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold">
                    Multilingual
                  </span>
                </h2>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Multilingual real-time assistant fluent in Latin, አማርኛ, and Afaan Oromo with offline cached answers.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs font-bold text-primary">
                <span>Start conversation</span>
                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </a>

            {/* Card 4 */}
            <a 
              href="#road-incidents"
              className="group bg-surface-lowest p-6 rounded-2xl border border-outline-variant/40 shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-200 flex flex-col justify-between cursor-pointer"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors duration-200">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h2 className="text-base font-bold text-on-surface mb-1 group-hover:text-primary transition-colors">
                  Report Road Incident
                </h2>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Crowdsource highland hazard verification: fog alerts, landslide alerts, mountain pass repairs.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs font-bold text-primary">
                <span>Contribute report</span>
                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </a>

          </div>
        </section>

        {/* 3. NEARBY VERIFIED PLACES (Locally Audited Directory) */}
        <section className="max-w-7xl mx-auto px-4 lg:px-8 mb-20" id="explore-map">
          
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span>Locally Audited Directory</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-primary tracking-tight">
                Nearby Verified Places
              </h2>
              <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
                Essential destinations around your current radius in Addis Ababa and surrounding ridges.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setPageView('app')}
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
              >
                <span>View all 48 locations on map</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Places Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {verifiedPlaces.map((place) => (
              <article
                key={place.id}
                className="bg-surface-lowest rounded-2xl overflow-hidden border border-outline-variant/40 shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col group"
              >
                <div className="relative h-44 overflow-hidden bg-surface-container">
                  <img
                    src={place.image}
                    alt={place.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 bg-primary text-white text-[10px] font-bold px-2.5 py-1 flex items-center gap-1 shadow-sm rounded-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>{place.status}</span>
                  </div>
                  <div className="absolute bottom-3 right-3 bg-surface-lowest/90 backdrop-blur-sm text-on-surface text-[11px] font-semibold px-2 py-0.5 rounded-md border border-outline-variant/30">
                    {place.distance}
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="text-[11px] text-ash font-medium mb-1">
                      {place.location}
                    </div>
                    <h3 className="text-sm font-bold text-primary group-hover:text-primary-dark transition-colors mb-2 leading-snug">
                      {place.title}
                    </h3>
                    <p className="text-xs text-on-surface-variant line-clamp-2 mb-4 leading-relaxed">
                      {place.desc}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-outline-variant/30 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-primary" />
                      {place.badge}
                    </span>
                    <button
                      onClick={() => setPageView('app')}
                      className="text-xs font-bold text-primary hover:text-primary-dark flex items-center gap-0.5"
                    >
                      <span>Map</span>
                      <MapPin className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

        </section>

        {/* 4. WEATHER & MICROCLIMATE + LIVE ROAD INCIDENTS (Asymmetric 2-Column Split) */}
        <section className="max-w-7xl mx-auto px-4 lg:px-8 mb-20" id="road-incidents">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Weather & Microclimate (5 Cols) */}
            <div className="lg:col-span-5 bg-surface-lowest p-6 sm:p-7 rounded-3xl border border-outline-variant/40 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-5">
                <span className="text-[11px] uppercase tracking-wider font-bold text-white bg-primary px-2.5 py-1 rounded-md">
                  Highland Microclimate
                </span>
                <span className="text-xs text-ash flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Updated 12 mins ago</span>
                </span>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-bold text-primary">
                  Addis Ababa &amp; Debre Birhan Corridor
                </h3>
                <p className="text-xs text-on-surface-variant">
                  Elevation: 2,355 m — 2,840 m above sea level
                </p>
              </div>

              <div className="flex items-center justify-between p-4 bg-surface-low rounded-2xl mb-5 border border-outline-variant/30">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-surface-lowest flex items-center justify-center text-primary shadow-sm">
                    <CloudSun className="w-8 h-8 text-secondary" />
                  </div>
                  <div>
                    <div className="text-3xl font-display font-extrabold text-primary">
                      21°C <span className="text-sm font-normal text-on-surface-variant">/ 70°F</span>
                    </div>
                    <div className="text-xs text-on-surface-variant font-medium">
                      Partly Cloudy • Fresh mountain breeze
                    </div>
                  </div>
                </div>
              </div>

              {/* Clothing Advice Callout */}
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/15 mb-6 flex items-start gap-3">
                <span className="material-symbols-outlined text-primary text-xl mt-0.5">
                  dry_cleaning
                </span>
                <div>
                  <h4 className="text-xs font-bold text-primary mb-0.5">
                    Highland Travel Clothing Advice
                  </h4>
                  <p className="text-xs text-on-surface leading-snug">
                    "Chilly highland evening ahead. Bring a lightweight traditional <strong className="text-primary font-bold">Gabi</strong> or windbreaker jacket as temperatures dip to 11°C after sunset."
                  </p>
                </div>
              </div>

              {/* Climate Telemetry */}
              <div className="grid grid-cols-3 gap-3 text-center border-t border-outline-variant/20 pt-4 text-xs">
                <div className="p-2.5 rounded-lg bg-surface-low/60">
                  <div className="text-ash text-[10px]">Rain Probability</div>
                  <div className="font-bold text-primary mt-0.5 text-sm">15%</div>
                </div>
                <div className="p-2.5 rounded-lg bg-surface-low/60">
                  <div className="text-ash text-[10px]">Ridge Visibility</div>
                  <div className="font-bold text-primary mt-0.5 text-sm">12 km</div>
                </div>
                <div className="p-2.5 rounded-lg bg-surface-low/60">
                  <div className="text-ash text-[10px]">UV Index</div>
                  <div className="font-bold text-primary mt-0.5 text-sm">6 (Moderate)</div>
                </div>
              </div>
            </div>

            {/* Live Road Alerts Nearby (7 Cols) */}
            <div className="lg:col-span-7 bg-surface-lowest p-6 sm:p-7 rounded-3xl border border-outline-variant/40 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-outline-variant/30 gap-2 mb-5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                      <h3 className="text-lg font-bold text-primary">
                        Live Road Alerts Nearby (Incident Radar)
                      </h3>
                    </div>
                    <p className="text-xs text-on-surface-variant">
                      Real-time crowdsourced reports verified by local transportation unions
                    </p>
                  </div>
                </div>

                {/* Incident 1 */}
                <div className="p-4 rounded-xl bg-surface-low/80 border border-outline-variant/30 mb-3 hover:border-primary/40 transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-secondary" />
                      <span className="text-xs font-bold text-on-surface">
                        Minor road resurfacing near Gotera Interchange
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-primary text-white font-bold whitespace-nowrap rounded">
                      <CheckCircle2 className="w-3 h-3 text-secondary-light" />
                      Verified Guild
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-on-surface-variant">
                    <span>3.4 km from position</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> 18 min ago</span>
                    <span>•</span>
                    <span className="font-medium text-primary">1 lane reduced; traffic flowing smoothly</span>
                  </div>
                </div>

                {/* Incident 2 */}
                <div className="p-4 rounded-xl bg-surface-low/80 border border-outline-variant/30 mb-3 hover:border-primary/40 transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span className="text-xs font-bold text-on-surface">
                        Heavy fog advisory along Entoto Pass highway
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-amber-100 text-amber-800 font-bold whitespace-nowrap rounded">
                      Under Review
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-on-surface-variant">
                    <span>8.1 km from position</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> 42 min ago</span>
                    <span>•</span>
                    <span className="font-medium text-amber-700">Low visibility under 40 meters</span>
                  </div>
                </div>

                {/* Incident 3 */}
                <div className="p-4 rounded-xl bg-surface-low/80 border border-outline-variant/30 mb-4 hover:border-primary/40 transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-on-surface">
                        Expressway toll lane maintenance near Modjo exit
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold whitespace-nowrap rounded">
                      Resolved
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-on-surface-variant">
                    <span>45 km from position</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> 1 hr ago</span>
                    <span>•</span>
                    <span className="font-medium text-emerald-800">All automatic payment lanes operational</span>
                  </div>
                </div>

              </div>

              {/* Guild verification note */}
              <div className="p-3 bg-surface-container rounded-xl flex items-center gap-2.5 text-xs text-on-surface-variant border border-outline-variant/30">
                <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                <span>Community reports undergo dual-verification by local transport guilds and verified highland contributors.</span>
              </div>
            </div>

          </div>
        </section>

        {/* 5. 'ASK GUZOMATE' AI TRAVEL ASSISTANT SHOWCASE */}
        <section className="max-w-7xl mx-auto px-4 lg:px-8 mb-20" id="ai-assistant">
          <div className="bg-gradient-to-br from-primary via-primary-dark to-[#001f14] rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
              
              {/* Left Column: Prompts & Info */}
              <div className="lg:col-span-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md text-secondary-light text-xs font-bold mb-4 border border-white/20 rounded-lg">
                  <Sparkles className="w-3.5 h-3.5 text-secondary-light" />
                  <span>Gemini-Powered Highland Travel Intelligence</span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-display font-bold text-white mb-3 tracking-tight">
                  Instant answers in Latin, አማርኛ, or Afaan Oromoo.
                </h2>
                <p className="text-xs sm:text-sm text-white/80 mb-6 leading-relaxed">
                  Ask about road blockages, minibus taxi rates, hotel bookings, mountain weather, or traditional customs. GuzoMate combines satellite feeds with local elder and transport guild knowledge.
                </p>

                <div className="space-y-2 mb-6">
                  <span className="text-[11px] uppercase tracking-wider text-white/60 font-bold block">
                    Try asking:
                  </span>
                  
                  <button
                    onClick={() => handleStarterPrompt("Find a 24-hour pharmacy near Bole Medhane Alem")}
                    className="w-full text-left p-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-xs text-white flex items-center justify-between transition-colors group"
                  >
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-amber-300 text-sm">chat_bubble</span>
                      <span>"Find a 24-hour pharmacy near Bole Medhane Alem"</span>
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                  </button>

                  <button
                    onClick={() => handleStarterPrompt("What are the current road conditions between Addis and Hawassa?")}
                    className="w-full text-left p-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-xs text-white flex items-center justify-between transition-colors group"
                  >
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-amber-300 text-sm">chat_bubble</span>
                      <span>"What are the current road conditions between Addis and Hawassa?"</span>
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                  </button>

                  <button
                    onClick={() => handleStarterPrompt("Where can I taste authentic freshly roasted Sidama coffee nearby?")}
                    className="w-full text-left p-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-xs text-white flex items-center justify-between transition-colors group"
                  >
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-amber-300 text-sm">chat_bubble</span>
                      <span>"Where can I taste authentic freshly roasted Sidama coffee nearby?"</span>
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                  </button>
                </div>
              </div>

              {/* Right Column: Interactive Chat Box */}
              <div className="lg:col-span-6 bg-surface-lowest text-on-surface rounded-2xl p-5 sm:p-6 shadow-2xl border border-white/30">
                
                {/* Chat Header */}
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-outline-variant/30">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-primary text-white flex items-center justify-center font-bold text-xs rounded-lg shadow-sm">
                      GM
                    </div>
                    <div>
                      <div className="text-xs font-bold text-primary">GuzoMate Travel Assistant</div>
                      <div className="text-[10px] text-emerald-700 flex items-center gap-1 font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                        <span>Online • Local transport guild verified</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center bg-surface-low p-0.5 rounded-lg border border-outline-variant/40 text-[10px] font-bold">
                    <span className="px-2 py-0.5 bg-white text-primary rounded shadow-sm">EN</span>
                    <span className="px-2 py-0.5 text-ash">አማ</span>
                  </div>
                </div>

                {/* Chat Messages Log */}
                <div className="space-y-3 mb-4 text-xs max-h-72 overflow-y-auto pr-1">
                  {chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.sender === 'user' ? (
                        <div className="bg-primary text-white p-3 rounded-2xl rounded-tr-sm max-w-[85%] shadow-sm leading-relaxed">
                          {msg.text}
                        </div>
                      ) : (
                        <div className="bg-surface-low p-3.5 rounded-2xl rounded-tl-sm max-w-[92%] border border-outline-variant/40 space-y-2">
                          <p className="text-on-surface leading-relaxed">{msg.text}</p>
                          {msg.amharic && (
                            <div className="p-2 rounded-lg bg-surface-lowest border border-outline-variant/30 text-on-surface-variant font-medium text-[11px]">
                              <span className="text-primary font-bold block mb-0.5">የአማርኛ ትርጉም:</span>
                              "{msg.amharic}"
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Chat Input */}
                <form onSubmit={handleSendMessage} className="relative flex items-center">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask GuzoMate in English, አማርኛ, or Afaan Oromoo..."
                    className="w-full pl-3.5 pr-20 py-2.5 bg-surface-low rounded-xl text-xs border border-outline-variant/50 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white font-medium"
                  />
                  <button
                    type="submit"
                    className="absolute right-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-primary-dark transition-colors shadow-sm"
                  >
                    <span>Send</span>
                    <Send className="w-3 h-3" />
                  </button>
                </form>

              </div>

            </div>

          </div>
        </section>

        {/* 6. ETHIOPIAN LINGUISTIC PARITY & EMERGENCY SECTION */}
        <section className="max-w-7xl mx-auto px-4 lg:px-8 mb-20" id="emergency-section">
          
          {/* Parity Banner */}
          <div className="bg-surface-low rounded-3xl p-6 sm:p-8 border border-outline-variant/40 mb-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="max-w-2xl">
                <div className="flex items-center gap-2 text-secondary-dark font-bold text-xs uppercase tracking-wider mb-1">
                  <span className="material-symbols-outlined text-base">translate</span>
                  <span>National Language Parity</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-display font-bold text-primary mb-2">
                  Three Official Languages, One Trusted Highland Journey.
                </h3>
                <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                  GuzoMate does not rely on mechanical word-for-word translation. Every routing step, hazard advisory, and medical recommendation is checked with optical metric harmony for Latin, Ge'ez (Amharic), and Qubee (Afaan Oromo) typography.
                </p>
              </div>

              {/* Language Badges */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="px-4 py-3 rounded-2xl bg-surface-lowest border border-outline-variant/40 text-center shadow-sm">
                  <div className="text-sm font-bold text-primary">English</div>
                  <div className="text-[11px] text-ash">Full Latin Support</div>
                </div>
                <div className="px-4 py-3 rounded-2xl bg-surface-lowest border border-outline-variant/40 text-center shadow-sm">
                  <div className="text-sm font-bold text-primary">አማርኛ</div>
                  <div className="text-[11px] text-ash">ግዕዝ ፊደላት</div>
                </div>
                <div className="px-4 py-3 rounded-2xl bg-surface-lowest border border-outline-variant/40 text-center shadow-sm">
                  <div className="text-sm font-bold text-primary">Afaan Oromoo</div>
                  <div className="text-[11px] text-ash">Sirna Qubee</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Emergency Hotline Callout Grid */}
          <div className="bg-surface-lowest border-2 border-primary rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-0.5">
                  <PhoneCall className="w-4 h-4 text-red-600 animate-pulse" />
                  <span>Emergency Hotlines — Direct Dial</span>
                </div>
                <h3 className="text-lg font-bold text-primary">
                  Instant contact with Ethiopian emergency responders
                </h3>
              </div>
              <span className="text-xs text-primary bg-primary/10 px-3 py-1 font-bold rounded-md self-start sm:self-auto border border-primary/20">
                Available toll-free 24/7 across Ethiopia
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <a
                href="tel:991"
                className="flex items-center justify-between p-4 rounded-2xl bg-surface-low border border-outline-variant/40 shadow-sm hover:border-primary transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary flex items-center justify-center text-white rounded-xl shadow-sm">
                    <span className="material-symbols-outlined">local_police</span>
                  </div>
                  <div>
                    <div className="text-[11px] text-ash font-medium">Federal &amp; Traffic Police</div>
                    <div className="text-base font-extrabold text-primary group-hover:text-primary-dark transition-colors">
                      991
                    </div>
                  </div>
                </div>
                <PhoneCall className="w-4 h-4 text-primary" />
              </a>

              <a
                href="tel:907"
                className="flex items-center justify-between p-4 rounded-2xl bg-surface-low border border-outline-variant/40 shadow-sm hover:border-primary transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-700 flex items-center justify-center text-white rounded-xl shadow-sm">
                    <span className="material-symbols-outlined">emergency</span>
                  </div>
                  <div>
                    <div className="text-[11px] text-ash font-medium">Medical Ambulance</div>
                    <div className="text-base font-extrabold text-red-700 transition-colors">
                      907
                    </div>
                  </div>
                </div>
                <PhoneCall className="w-4 h-4 text-red-700" />
              </a>

              <a
                href="tel:922"
                className="flex items-center justify-between p-4 rounded-2xl bg-surface-low border border-outline-variant/40 shadow-sm hover:border-primary transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-secondary-dark flex items-center justify-center text-white rounded-xl shadow-sm">
                    <span className="material-symbols-outlined">health_and_safety</span>
                  </div>
                  <div>
                    <div className="text-[11px] text-ash font-medium">Ethiopian Red Cross</div>
                    <div className="text-base font-extrabold text-secondary-dark transition-colors">
                      922
                    </div>
                  </div>
                </div>
                <PhoneCall className="w-4 h-4 text-secondary-dark" />
              </a>
            </div>

          </div>

        </section>

      </main>

      {/* FOOTER */}
      <footer className="relative z-10 bg-surface-low border-t border-outline-variant/40 w-full mt-auto">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10 flex flex-col md:flex-row justify-between items-center gap-6">
          
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <div className="text-sm font-bold text-primary flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-primary text-white flex items-center justify-center text-[11px] font-bold">
                G
              </div>
              <span>GuzoMate</span>
            </div>
            <span className="hidden sm:inline text-outline-variant">|</span>
            <p className="text-xs text-on-surface-variant">
              © 2026 GuzoMate Ethiopia — Verified Highland Travel Intelligence. Latin, አማርኛ &amp; Afaan Oromo parity.
            </p>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-semibold text-on-surface-variant">
            <a href="tel:991" className="hover:text-primary transition-colors">Police 991</a>
            <a href="tel:907" className="hover:text-primary transition-colors">Medical 907</a>
            <a href="tel:922" className="hover:text-primary transition-colors">Red Cross 922</a>
            <a href="#emergency-section" className="hover:text-primary transition-colors">Emergency Dial</a>
            <a href="#road-incidents" className="hover:text-primary transition-colors">Road Verification Guild</a>
          </nav>

        </div>
      </footer>

    </div>
  );
};

export default HomePage;
