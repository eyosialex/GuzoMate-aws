import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { 
  PhoneCall, 
  ShieldAlert, 
  PlusSquare, 
  Truck, 
  CloudRain, 
  Navigation
} from 'lucide-react';
import { springGentle } from '../lib/motion';

export const EmergencyPage: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();

  const emergencyContacts = [
    {
      id: 'police',
      service: 'Federal Highway Police',
      amharic: 'የፌደራል ፖሊስ ፈጣን አደጋ መከላከያ',
      badge: 'Escarpment Highway Police',
      eta: '4.8 km (6m ETA)',
      shortCode: '991',
      directLine: '+251 11 551 2700',
      assignment: 'Assigned: Cruiser Unit 04 • Patrol Sector A2 Legetafo',
      btnText: 'Direct Call 991 (Police)',
      btnColor: 'bg-[#0f2b1d] hover:bg-[#07170f]',
      icon: <ShieldAlert className="w-5 h-5 text-emerald-400" />,
    },
    {
      id: 'medical',
      service: 'National Ambulance Service',
      amharic: 'የአደጋ ጊዜ ህክምና አምቡላንስ',
      badge: 'Level 1 Trauma EMT',
      feature: 'O2 Equipped',
      shortCode: '907',
      directLine: "St. Paul's & Black Lion (Tikur Anbessa)",
      assignment: 'Direct linked ICU transfer for Tikur Anbessa & St. Paul Hospitals',
      btnText: 'Direct Call 907 (Medical)',
      btnColor: 'bg-[#183a2b] hover:bg-[#122e22]',
      icon: <PlusSquare className="w-5 h-5 text-emerald-400" />,
    },
    {
      id: 'red-cross',
      service: 'Ethiopian Red Cross Emergency Response',
      amharic: 'የኢትዮጵያ ቀይ መስቀል ማህበር አምቡላንስ',
      badge: 'Highland Search & Rescue',
      eta: 'Addis & Sheger Zones',
      shortCode: '922',
      directLine: '+251 11 515 3011',
      assignment: 'Dedicated 4WD mountain rescue vehicles equipped for hypothermia relief',
      btnText: 'Direct Call 922 (Red Cross)',
      btnColor: 'bg-[#183a2b] hover:bg-[#122e22]',
      icon: <PhoneCall className="w-5 h-5 text-red-400" />,
    },
    {
      id: 'fire-heavy',
      service: 'Fire & Heavy Recovery Command',
      amharic: 'የእሳትና አደጋ ስጋት ስራ አመራር ኮሚሽን',
      badge: 'Heavy Crane & Extraction',
      feature: 'Hydraulic Cutters Ready',
      shortCode: '939',
      directLine: '+251 11 155 5300',
      assignment: 'Termaber Summit heavy winch & escarpment extraction rig on standby',
      btnText: 'Direct Call 939 (Rescue)',
      btnColor: 'bg-[#0f2b1d] hover:bg-[#07170f]',
      icon: <Truck className="w-5 h-5 text-amber-400" />,
    },
  ];

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-[#f8faf8] text-[#141d18] font-sans py-8 px-4 sm:px-6">
      <div className="max-w-[1280px] mx-auto space-y-8">
        {/* Header matching Screen-6 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e2e8e3] pb-5">
          <div>
            <div className="flex items-center gap-2">
              <PhoneCall className="w-5 h-5 text-red-600" />
              <h1 className="text-xl sm:text-2xl font-extrabold text-gray-950 tracking-tight">
                Priority Direct Dial Directory
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
              Toll-free emergency dispatch channels with instant operator localization and telemetry broadcasting.
            </p>
          </div>
          <span className="self-start sm:self-auto text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-600 animate-ping" />
            24/7 Monitored
          </span>
        </div>

        {/* Directory Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {emergencyContacts.map((contact) => (
            <motion.div
              key={contact.id}
              initial={shouldReduceMotion ? undefined : { opacity: 0, y: 12 }}
              animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={springGentle}
              className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs flex flex-col justify-between hover:border-[#183a2b]/40 transition-all"
            >
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-[#f0f7f3] text-[#183a2b] border border-[#d1e2d8] px-2 py-0.5 rounded-md">
                    {contact.badge}
                  </span>
                  {(contact.eta || contact.feature) && (
                    <span className="text-[11px] font-semibold text-gray-500 flex items-center gap-1">
                      <Navigation className="w-3 h-3 text-emerald-600" />
                      {contact.eta || contact.feature}
                    </span>
                  )}
                </div>

                <h3 className="text-base font-extrabold text-gray-900 leading-snug">
                  {contact.service}
                </h3>
                <p className="text-xs text-gray-500 font-medium">{contact.amharic}</p>

                {/* Big Short-Code Display */}
                <div className="my-4 flex items-baseline gap-3">
                  <span className="text-3xl sm:text-4xl font-black text-gray-950 font-mono tracking-tight">
                    {contact.shortCode}
                  </span>
                  <span className="text-xs text-gray-500 font-semibold">{contact.directLine}</span>
                </div>

                <p className="text-xs text-gray-600 font-medium">
                  {contact.assignment}
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-gray-100">
                <a
                  href={`tel:${contact.shortCode}`}
                  className={`w-full py-2.5 px-4 ${contact.btnColor} text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer`}
                >
                  <PhoneCall className="w-4 h-4 text-emerald-400" />
                  <span>{contact.btnText}</span>
                </a>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Floating Weather & Highland Chill Advisory Card matching Screen-6 */}
        <div className="bg-white rounded-2xl border border-[#d1e2d8] p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center shrink-0">
              <CloudRain className="w-6 h-6 text-[#183a2b]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold text-gray-950">11°C</span>
                <span className="text-xs font-bold text-gray-600">Highland Chill</span>
                <span className="text-[10px] font-bold uppercase bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md">
                  Apparel Alert
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Dew point: 4°C • Barometric pressure: 746 hPa • Heavy mountain mist anticipated
              </p>
            </div>
          </div>
          <div className="text-xs font-bold text-[#183a2b] bg-[#f0f7f3] border border-[#d1e2d8] px-3 py-2 rounded-xl">
            Gabi / warm woolen shawl strictly recommended for evening chill.
          </div>
        </div>

        {/* Commander Quote Testimonial matching Screen-6 */}
        <div className="bg-[#f0f7f3] rounded-2xl border border-[#d1e2d8] p-5 sm:p-6 flex flex-col sm:flex-row items-start gap-4">
          <img
            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80"
            alt="Lt. Fikru Tadesse"
            className="h-14 w-14 rounded-full object-cover ring-2 ring-[#183a2b] shrink-0"
          />
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-sm font-extrabold text-gray-950">Lt. Fikru Tadesse</h4>
              <span className="text-[10px] font-bold bg-[#183a2b] text-white px-2 py-0.5 rounded">
                Sheno Sector Commander
              </span>
            </div>
            <p className="text-xs text-gray-700 italic leading-relaxed">
              &ldquo;Every second saved on the Debre Birhan escarpment saves lives when mountain fog rolls in. Broadcasting your precise telemetry through GuzoMate allows our 4WD patrol rigs to bring oxygen vaults directly to your bumper.&rdquo;
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyPage;
