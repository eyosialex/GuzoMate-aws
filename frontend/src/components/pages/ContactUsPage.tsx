import React, { useState } from 'react';
import { useAppStore } from '../../features/useAppStore';
import { 
  Mail, 
  MapPin, 
  Send, 
  PhoneCall, 
  ShieldAlert, 
  CheckCircle2, 
  Clock
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const ContactUsPage: React.FC = () => {
  const { language } = useAppStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('general');
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;

    setIsSubmitted(true);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#1b4332', '#d97706', '#0e7490'],
    });
  };

  const emergencyContacts = [
    { name: 'Federal & Traffic Police', number: '991', desc: 'Highway roadblock, traffic accident, security incident' },
    { name: 'Medical Emergency Ambulance', number: '907', desc: 'Trauma support, oxygen delivery, medical dispatch' },
    { name: 'Ethiopian Red Cross Society', number: '922', desc: 'First responder disaster relief & blood bank coordination' },
  ];

  const regionalHubs = [
    { city: 'Addis Ababa (Headquarters)', address: 'Africa Avenue, Next to Medhane Alem Cathedral, Bole Subcity', phone: '+251 11 661 2345' },
    { city: 'Bahir Dar (Northern Corridor Hub)', address: 'Lake Tana Shoreline Road, Kebele 03', phone: '+251 58 220 8765' },
    { city: 'Hawassa (Rift Valley Gateway)', address: 'Lake View Blvd, Tabor Subcity', phone: '+251 46 221 4321' },
    { city: 'Dire Dawa (Eastern Rail Corridor)', address: 'Chemin de Fer Ave, Kebele 02', phone: '+251 25 111 9876' },
  ];

  return (
    <div className="min-h-screen bg-surface py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      
      {/* Editorial Header */}
      <div className="text-center max-w-3xl mx-auto mb-14 space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
          <Mail className="w-3.5 h-3.5 text-secondary" />
          <span>Connect With GuzoMate • ያግኙን</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-display font-extrabold text-on-surface tracking-tight">
          We Are Here Across the Highlands.
        </h1>
        <p className="text-base sm:text-lg text-on-surface-variant font-normal leading-relaxed">
          Whether you represent a regional transport association, have road data to verify, or require emergency dispatch coordination — our team is reachable 24/7.
        </p>
      </div>

      {/* Direct Emergency Dispatch Hotline Banner */}
      <div className="bg-red-50 border-2 border-red-300 rounded-3xl p-6 sm:p-8 shadow-sm mb-14">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center font-bold shadow-md">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-red-900">
                Direct Emergency Dispatch Hotlines
              </h2>
              <p className="text-xs text-red-700">
                Toll-free 24/7 direct dial across all Ethiopian mobile networks (Ethio Telecom &amp; Safaricom)
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {emergencyContacts.map((c) => (
            <a
              key={c.number}
              href={`tel:${c.number}`}
              className="p-4 rounded-2xl bg-white border border-red-200 shadow-sm hover:border-red-400 hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <p className="text-xs font-bold text-on-surface group-hover:text-red-700 transition-colors">
                  {c.name}
                </p>
                <p className="text-[11px] text-ash mt-1">{c.desc}</p>
              </div>
              <div className="mt-3 flex items-center justify-between pt-2 border-t border-red-100">
                <span className="text-2xl font-display font-extrabold text-red-700">{c.number}</span>
                <span className="p-1.5 rounded-full bg-red-100 text-red-700 group-hover:bg-red-600 group-hover:text-white transition-colors">
                  <PhoneCall className="w-4 h-4" />
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Two Column Layout: Contact Form & Regional Hubs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
        
        {/* Contact Form (7 cols) */}
        <div className="lg:col-span-7 bg-surface-lowest rounded-3xl border border-outline-variant/50 p-6 sm:p-8 shadow-highland">
          <h2 className="text-2xl font-display font-bold text-on-surface mb-2">
            Send Us a Message
          </h2>
          <p className="text-xs sm:text-sm text-on-surface-variant mb-6">
            Inquiries are routed to our dispatch engineers and regional transport coordinators within 2 hours.
          </p>

          {isSubmitted ? (
            <div className="p-8 text-center space-y-4 bg-emerald-50 rounded-2xl border border-emerald-200 animate-in fade-in">
              <div className="w-12 h-12 rounded-full bg-emerald-600 text-white mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-emerald-900">Message Delivered</h3>
              <p className="text-xs text-emerald-800 max-w-sm mx-auto">
                Thank you, <strong>{name}</strong>. Our highland dispatch coordinator has received your request and will follow up at <strong>{email}</strong>.
              </p>
              <button
                onClick={() => {
                  setIsSubmitted(false);
                  setMessage('');
                }}
                className="px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-bold"
              >
                Send Another Inquiry
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Dawit Alemayehu"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-low border border-outline-variant/30 text-xs font-medium focus:border-primary focus:bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@organization.et"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-low border border-outline-variant/30 text-xs font-medium focus:border-primary focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">Topic / Partnership Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-low border border-outline-variant/30 text-xs font-medium focus:border-primary focus:bg-white outline-none"
                >
                  <option value="general">General Traveler Inquiries</option>
                  <option value="guild">Transport Guild &amp; Bus Association Partnership</option>
                  <option value="incident">Hazard &amp; Incident Verification Telemetry</option>
                  <option value="api">Geospatial API &amp; SDK Access</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">Your Message</label>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your inquiry, road report, or collaboration proposal..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-low border border-outline-variant/30 text-xs font-medium focus:border-primary focus:bg-white outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-primary hover:bg-primary-dark text-white font-bold text-xs shadow-highland flex items-center justify-center gap-2 transition-all"
              >
                <Send className="w-4 h-4" />
                <span>Submit Inquiry</span>
              </button>
            </form>
          )}
        </div>

        {/* Regional Hubs Directory (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-surface-lowest rounded-3xl border border-outline-variant/50 p-6 shadow-highland">
            <h3 className="font-display font-bold text-lg text-primary mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-secondary" />
              <span>Regional Dispatch Hubs</span>
            </h3>
            
            <div className="space-y-4">
              {regionalHubs.map((hub, idx) => (
                <div key={idx} className="pb-3 border-b border-outline-variant/20 last:border-b-0 last:pb-0">
                  <h4 className="text-xs font-bold text-on-surface">{hub.city}</h4>
                  <p className="text-[11px] text-ash mt-0.5">{hub.address}</p>
                  <p className="text-xs font-bold font-mono text-primary mt-1">{hub.phone}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-surface-lowest rounded-3xl border border-outline-variant/50 p-6 shadow-highland flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-secondary flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-on-surface">Live Network Hours</p>
              <p className="text-[11px] text-ash">Radar telemetry &amp; emergency dispatch operating 24/7/365.</p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
