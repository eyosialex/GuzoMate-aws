import React, { useState } from 'react';
import { useAppStore } from '../../features/useAppStore';
import { 
  MapPin, 
  CheckCircle2, 
  Fuel, 
  Coffee, 
  HeartPulse, 
  Pill, 
  Clock, 
  ArrowRight
} from 'lucide-react';

export const VerifiedPlacesShowcase: React.FC = () => {
  const { setPageView } = useAppStore();
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const places = [
    {
      id: 'place-sp-01',
      name: "St. Paul's Hospital Millennium Medical College",
      nameAm: "ቅዱስ ጳውሎስ ሚሊኒየም ሆስፒታል",
      category: 'health',
      subcity: 'Gulele Subcity, Addis Ababa',
      distance: '2.4 km away',
      alt: '2,460 m',
      status: 'Open 24/7 • Emergency Ready',
      desc: 'Full trauma response unit, multilingual medical staff, modern diagnostics, and dedicated blood bank.',
      tags: ['Trauma Center', 'Oxygen Units', 'Ambulance Hub'],
      badge: 'Guild Verified Trauma',
      icon: <HeartPulse className="w-5 h-5 text-red-600" />,
      iconBg: 'bg-red-50 border-red-200',
    },
    {
      id: 'place-te-02',
      name: 'TotalEnergies & Bonjour Mart',
      nameAm: 'ቶታል ኢነርጂስ እና ቦንዡር ማርት',
      category: 'fuel',
      subcity: 'Meskel Square Junction, Kirkos',
      distance: '1.1 km away',
      alt: '2,355 m',
      status: 'Open 24/7 • Fast Charging',
      desc: 'Guaranteed high-grade diesel, 50kW EV Fast Charger, and 24/7 CBE ATM with cash availability.',
      tags: ['Verified Diesel', '50kW EV Charger', 'CBE ATM Online'],
      badge: 'Power & Fuel Hub',
      icon: <Fuel className="w-5 h-5 text-amber-600" />,
      iconBg: 'bg-amber-50 border-amber-200',
    },
    {
      id: 'place-entoto-03',
      name: 'Entoto Mountain Viewpoint Lodge & Traditional Cafe',
      nameAm: 'የእንጦጦ ተራራ ሎጅ እና ባህላዊ ቡና',
      category: 'cafe',
      subcity: 'Entoto Park Ridge Pass (Alt: 3,020 m)',
      distance: '7.8 km away',
      alt: '3,020 m',
      status: 'Open Now • Scenic Haven',
      desc: 'Fresh single-origin Sidama highland coffee roasted on open embers, wood-burning fireplace lounge, and city vistas.',
      tags: ['Highland Buna', 'Wood Fireplace', 'Gabi Shawls Provided'],
      badge: 'Highland Haven',
      icon: <Coffee className="w-5 h-5 text-emerald-700" />,
      iconBg: 'bg-emerald-50 border-emerald-200',
    },
    {
      id: 'place-lion-04',
      name: 'Lion Pharmacy (Bole Medhane Alem Branch)',
      nameAm: 'አንበሳ ፋርማሲ (ቦሌ ቅርንጫፍ)',
      category: 'pharmacy',
      subcity: 'Cameroon Street, Next to Edna Mall area',
      distance: '450 m away',
      alt: '2,355 m',
      status: 'Open 24/7 • Altitude Care',
      desc: 'Altitude relief remedies (Acetazolamide / Diamox) and portable emergency oxygen canisters verified present.',
      tags: ['Acetazolamide Stocked', 'Oxygen Canisters', 'English & Amharic'],
      badge: 'Emergency Pharmacy',
      icon: <Pill className="w-5 h-5 text-blue-600" />,
      iconBg: 'bg-blue-50 border-blue-200',
    },
  ];

  const filteredPlaces = activeCategory === 'all' 
    ? places 
    : places.filter((p) => p.category === activeCategory);

  const handleOpenPlaceOnMap = (placeId: string) => {
    setPageView('app');
  };

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      
      {/* Header and Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-2 border border-primary/20">
            <CheckCircle2 className="w-3.5 h-3.5 text-secondary" />
            <span>Locally Audited Directory</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-extrabold text-on-surface tracking-tight">
            Nearby Verified Places.
          </h2>
          <p className="text-sm text-on-surface-variant mt-1">
            Essential destinations around your radius with audited fuel stock, trauma capability, and altitude readiness.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-surface-low p-1.5 rounded-2xl border border-outline-variant/40">
          {[
            { id: 'all', label: 'All Services' },
            { id: 'health', label: 'Hospitals' },
            { id: 'fuel', label: 'Fuel & EV' },
            { id: 'cafe', label: 'Highland Lodges' },
            { id: 'pharmacy', label: '24/7 Pharmacies' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeCategory === cat.id
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-on-surface-variant hover:text-primary hover:bg-surface-high'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Place Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredPlaces.map((place) => (
          <div
            key={place.id}
            className="bg-surface-lowest rounded-3xl border border-outline-variant/50 p-6 shadow-highland hover:border-primary/50 transition-all duration-300 flex flex-col justify-between group"
          >
            <div>
              {/* Card Top Meta */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl ${place.iconBg} border flex items-center justify-center flex-shrink-0 shadow-sm`}>
                    {place.icon}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary uppercase">
                      {place.badge}
                    </span>
                    <h3 className="font-display font-bold text-lg text-on-surface group-hover:text-primary transition-colors mt-0.5">
                      {place.name}
                    </h3>
                    <p className="text-xs text-ash flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-primary" />
                      <span>{place.subcity}</span>
                    </p>
                  </div>
                </div>

                {/* Distance & Altitude Badge */}
                <div className="text-right flex-shrink-0">
                  <span className="text-xs font-bold font-mono text-primary bg-surface-low px-2 py-1 rounded-lg border border-outline-variant/40 block">
                    {place.distance}
                  </span>
                  <span className="text-[10px] text-ash block mt-1">
                    ▲ {place.alt}
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed mb-4">
                {place.desc}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mb-5">
                {place.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-surface-low text-on-surface border border-outline-variant/30 flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3 h-3 text-secondary" />
                    <span>{tag}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Bottom Card Action */}
            <div className="pt-4 border-t border-outline-variant/30 flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>{place.status}</span>
              </span>

              <button
                onClick={() => handleOpenPlaceOnMap(place.id)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold transition-all shadow-sm group-hover:scale-105"
              >
                <span>View on Map</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        ))}
      </div>

    </section>
  );
};
