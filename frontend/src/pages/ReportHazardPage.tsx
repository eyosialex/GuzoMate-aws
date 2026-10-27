import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Compass, 
  Mic, 
  Zap, 
  Radio, 
  Camera, 
  Check, 
  Flame, 
  CloudFog, 
  Waves, 
  Wrench, 
  AlertOctagon, 
  FileText 
} from 'lucide-react';
import { useAuth } from '../features/AuthContext';

export const ReportHazardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // 1. Category & Severity
  const [category, setCategory] = useState<'ROCKFALL' | 'FOG' | 'MUDSLIDE' | 'BREAKDOWN' | 'LIVESTOCK' | 'BOTTLENECK'>('ROCKFALL');
  const [severity, setSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('HIGH');

  // 2. Pinpoint
  const [corridor, setCorridor] = useState('A2 Highway: Addis Ababa – Debre Birhan – Dessie (Termaber Escarpment)');
  const [kmMarker, setKmMarker] = useState('Km 98.4');
  const [landmark, setLandmark] = useState('Termaber Hairpin Curve #4 (ተርማበር ዋ)');
  const [altitude] = useState('3,120 m (Highland Ridge)');
  const [flowDirection, setFlowDirection] = useState<'Northbound' | 'Both'>('Both');

  // 3. Description & Quick Tags
  const [description, setDescription] = useState(
    'Three large basalt boulders fell from the upper cliff on hairpin #4 right after km 98.4. Heavy cloud cover makes it invisible from 40m away. Selam Bus currently reversing to safety pullout. Mud slurry spreading on descending lane.'
  );
  const [selectedTags, setSelectedTags] = useState<string[]>([
    'Boulder Size >',
    'Mist Below',
    'Tow Truck Required (ኮሬንቲ)',
  ]);
  const [isRecordingMemo, setIsRecordingMemo] = useState(false);

  // 5. Verification
  const [submissionMode, setSubmissionMode] = useState<'guild' | 'anonymous'>('guild');
  const [directPoliceDispatch, setDirectPoliceDispatch] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    {
      id: 'ROCKFALL' as const,
      title: 'Rockfall & Debris',
      amharic: 'የድንጋይ ናዳ / Sigiga',
      icon: <AlertOctagon className="w-5 h-5 text-red-600" />,
    },
    {
      id: 'FOG' as const,
      title: 'Mountain Fog & Mist',
      amharic: 'ክፉኛ ጉም (<30m)',
      icon: <CloudFog className="w-5 h-5 text-gray-600" />,
    },
    {
      id: 'MUDSLIDE' as const,
      title: 'Mudslide / Washout',
      amharic: 'የጭቃ ጎርፍ መደርመስ',
      icon: <Waves className="w-5 h-5 text-amber-700" />,
    },
    {
      id: 'BREAKDOWN' as const,
      title: 'Vehicle Breakdown',
      amharic: 'የተበላሸ ከባድ መኪና',
      icon: <Wrench className="w-5 h-5 text-blue-600" />,
    },
    {
      id: 'LIVESTOCK' as const,
      title: 'Livestock on Highway',
      amharic: 'የከብቶች መንጋ',
      icon: <Flame className="w-5 h-5 text-orange-600" />,
    },
    {
      id: 'BOTTLENECK' as const,
      title: 'Bridge / Toll Bottleneck',
      amharic: 'የድልድይ ጥገና',
      icon: <Radio className="w-5 h-5 text-purple-600" />,
    },
  ];

  const quickTagOptions = [
    'Boulder Size >',
    'Mist Below',
    'Mud on Asphalt (ጭቃ)',
    'Tow Truck Required (ኮሬንቲ)',
    '+ 4WD / High Clearance Only',
  ];

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      alert('Highland hazard broadcasted to Selam Bus Guild radio and Federal Highway Police (991)!');
      navigate('/incidents');
    }, 800);
  };

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-[#f8faf8] text-[#141d18] font-sans pb-16">
      {/* --------------------------------------------------------------------- */}
      {/* TOP STATUS BREADCRUMB SUB-BAR MATCHING SCREEN-7 */}
      {/* --------------------------------------------------------------------- */}
      <div className="bg-white border-b border-[#e2e8e3] px-4 sm:px-6 py-2.5 text-xs text-gray-600">
        <div className="max-w-[1560px] mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Link
              to="/incidents"
              className="font-bold text-[#183a2b] hover:underline flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Road Incidents Radar</span>
            </Link>
            <span className="text-gray-300">/</span>
            <span className="font-semibold text-gray-900">
              Report Escarpment Hazard (የመንገድ አደጋ ሪፖርት)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[11px]">
            <div className="flex items-center gap-1.5 font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>Scout GPS Lock: <strong>9.0478° N, 38.7492° E (±3m)</strong></span>
            </div>
            <span className="font-bold text-[#183a2b] bg-[#f0f7f3] border border-[#d1e2d8] px-2 py-0.5 rounded">
              14 Guild Endorsements
            </span>
            <span className="text-emerald-700 font-semibold hidden sm:inline">
              Telebirr SMS Fallback Ready
            </span>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* PAGE HEADER MATCHING SCREEN-7 */}
      {/* --------------------------------------------------------------------- */}
      <div className="max-w-[1560px] mx-auto px-4 sm:px-6 pt-6 pb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200/80 pb-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight">
              Report Highland Hazard & Road Blockade
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 font-medium mt-1 max-w-3xl leading-relaxed">
              Real-time highway intelligence for Addis Ababa – Dessie – Tigray corridors. Submissions from verified scouts trigger instant broadcasts to 2,400+ intercity buses and regional safety posts.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsRecordingMemo(!isRecordingMemo)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                isRecordingMemo
                  ? 'bg-red-50 text-red-700 border-red-300'
                  : 'bg-white hover:bg-gray-50 text-gray-800 border-gray-200'
              }`}
            >
              <Mic className="w-4 h-4 text-gray-600" />
              <span>{isRecordingMemo ? 'Recording Voice...' : 'Amharic Voice Memo'}</span>
            </button>

            <button
              type="button"
              onClick={() => alert('Quick 10s Dispatch triggered! Pre-filled with latest GPS and boulder telemetry.')}
              className="px-4 py-2 bg-[#0f2b1d] hover:bg-[#07170f] text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Quick 10s Dispatch</span>
            </button>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* MAIN TWO-COLUMN FORM & PREVIEW LAYOUT MATCHING SCREEN-7 */}
      {/* --------------------------------------------------------------------- */}
      <div className="max-w-[1560px] mx-auto px-4 sm:px-6 pt-4">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left 7 Columns: 5 Step Reporting Form */}
          <div className="lg:col-span-7 space-y-6">
            {/* STEP 1: CATEGORY & SEVERITY */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-[#183a2b] text-white flex items-center justify-center font-bold text-xs">
                    1
                  </div>
                  <h3 className="text-sm font-extrabold text-gray-950">
                    Select Hazard Category & Severity
                  </h3>
                </div>
                <span className="text-[11px] font-semibold text-gray-400">አደጋው ዓይነት</span>
              </div>

              {/* 6 Category Selection Cards matching Screen-7 */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {categories.map((cat) => {
                  const isSelected = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
                        isSelected
                          ? 'border-[#183a2b] bg-[#f0f7f3] shadow-xs ring-1 ring-[#183a2b]'
                          : 'border-gray-200 hover:bg-gray-50 bg-white'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-2 right-2 h-4 w-4 rounded-full bg-[#183a2b] text-white flex items-center justify-center">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                      )}
                      <div className="mb-2">{cat.icon}</div>
                      <div className="text-xs font-bold text-gray-900 leading-tight">
                        {cat.title}
                      </div>
                      <div className="text-[10px] text-gray-500 mt-0.5">{cat.amharic}</div>
                    </button>
                  );
                })}
              </div>

              {/* Severity Pill Selector */}
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="font-semibold text-gray-600">Passability & Severity Status (የመንገዱ ሁኔታ):</span>
                <div className="flex items-center gap-1.5">
                  {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const).map((sev) => (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setSeverity(sev)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                        severity === sev
                          ? sev === 'CRITICAL' || sev === 'HIGH'
                            ? 'bg-red-700 text-white'
                            : 'bg-amber-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* STEP 2: CORRIDOR & ESCARPMENT PINPOINT */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-[#183a2b] text-white flex items-center justify-center font-bold text-xs">
                    2
                  </div>
                  <h3 className="text-sm font-extrabold text-gray-950">
                    Precise Corridor & Escarpment Pinpoint
                  </h3>
                </div>
                <span className="text-[11px] font-semibold text-gray-400">ቦታ እና መጋጠሚያ</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Strategic Highland Highway Corridor
                </label>
                <input
                  type="text"
                  value={corridor}
                  onChange={(e) => setCorridor(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#183a2b] font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Physical KM Marker / Distance Post
                  </label>
                  <input
                    type="text"
                    value={kmMarker}
                    onChange={(e) => setKmMarker(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#183a2b] font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Local Landmark / Hairpin Turn Name
                  </label>
                  <input
                    type="text"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#183a2b]"
                  />
                </div>
              </div>

              {/* Barometric lock chip */}
              <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between text-xs">
                <span className="text-gray-600 font-medium">Barometric Sensor Lock:</span>
                <span className="font-mono font-bold text-[#183a2b]">{altitude}</span>
              </div>

              {/* Flow direction radio */}
              <div>
                <span className="block text-xs font-semibold text-gray-700 mb-1.5">Impacted Flow Direction:</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setFlowDirection('Northbound')}
                    className={`p-2 rounded-xl border text-center font-bold cursor-pointer transition-colors ${
                      flowDirection === 'Northbound'
                        ? 'bg-[#183a2b] text-white border-[#183a2b]'
                        : 'bg-gray-50 text-gray-700 border-gray-200'
                    }`}
                  >
                    Northbound (Ascending)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFlowDirection('Both')}
                    className={`p-2 rounded-xl border text-center font-bold cursor-pointer transition-colors ${
                      flowDirection === 'Both'
                        ? 'bg-[#183a2b] text-white border-[#183a2b]'
                        : 'bg-gray-50 text-gray-700 border-gray-200'
                    }`}
                  >
                    Both Directions Blocked
                  </button>
                </div>
              </div>
            </div>

            {/* STEP 3: HAZARD DESCRIPTION & QUICK TAGS */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-[#183a2b] text-white flex items-center justify-center font-bold text-xs">
                    3
                  </div>
                  <h3 className="text-sm font-extrabold text-gray-950">
                    Hazard Description & Quick Tags
                  </h3>
                </div>
                <span className="text-[11px] font-semibold text-gray-400">ዝርዝር መግለጫ</span>
              </div>

              <div>
                <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1">
                  <span>Observations from Scene (Dual-Script Supported)</span>
                  <span>{description.length} / 500 chars</span>
                </div>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#183a2b] leading-relaxed"
                />
              </div>

              {/* Rapid Hazard Attributes */}
              <div>
                <span className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Rapid Hazard Attributes (Click to append):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {quickTagOptions.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#183a2b] text-white shadow-2xs'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {isSelected ? `✓ ${tag}` : `+ ${tag}`}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Voice Memo Broadcast */}
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="block font-bold text-gray-900">Record 15s Voice Memo for Guild Radio Dispatch</span>
                  <span className="text-[11px] text-gray-500">Amharic, Afaan Oromoo, or English. Transcribed via offline engine.</span>
                </div>
                <span className="font-mono text-xs font-bold text-gray-600">00:00 / 00:15</span>
              </div>
            </div>

            {/* STEP 4: VISUAL EVIDENCE */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-[#183a2b] text-white flex items-center justify-center font-bold text-xs">
                    4
                  </div>
                  <h3 className="text-sm font-extrabold text-gray-950">
                    Visual Evidence & Dashcam Feed
                  </h3>
                </div>
                <span className="text-[11px] font-semibold text-gray-400">ፎቶ እና ማስረጃ</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Photo 1 preview */}
                <div className="relative h-32 rounded-xl overflow-hidden border border-gray-200 bg-gray-900 group">
                  <img
                    src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80"
                    alt="Hazard evidence"
                    className="h-full w-full object-cover opacity-90 group-hover:scale-105 transition-transform"
                  />
                  <span className="absolute bottom-2 left-2 text-[10px] font-mono font-bold bg-black/75 text-emerald-300 px-2 py-0.5 rounded">
                    EXIF: 11:42 EAT • ±3m
                  </span>
                </div>

                {/* Dropzone */}
                <div className="h-32 rounded-xl border-2 border-dashed border-gray-300 hover:border-[#183a2b] bg-gray-50 flex flex-col items-center justify-center p-3 text-center transition-colors cursor-pointer">
                  <Camera className="w-5 h-5 text-gray-400 mb-1" />
                  <span className="text-xs font-bold text-gray-800">Drop additional photo or dashcam clip</span>
                  <span className="text-[10px] text-gray-400 mt-0.5">JPG / PNG / MP4 &lt; 20MB</span>
                </div>
              </div>
            </div>

            {/* STEP 5: IDENTITY & VERIFICATION GUILD */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-[#183a2b] text-white flex items-center justify-center font-bold text-xs">
                    5
                  </div>
                  <h3 className="text-sm font-extrabold text-gray-950">
                    Identity & Verification Guild
                  </h3>
                </div>
                <span className="text-[11px] font-semibold text-gray-400">የስካውት ማረጋገጫ</span>
              </div>

              <div className="space-y-2">
                <label
                  onClick={() => setSubmissionMode('guild')}
                  className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                    submissionMode === 'guild'
                      ? 'border-[#183a2b] bg-[#f0f7f3]'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="mode"
                    checked={submissionMode === 'guild'}
                    onChange={() => setSubmissionMode('guild')}
                    className="mt-1 text-[#183a2b] focus:ring-[#183a2b]"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-900">
                        Submit as Verified Guild Scout
                      </span>
                      <span className="text-[9px] font-bold uppercase bg-emerald-100 text-emerald-900 px-1.5 py-0.2 rounded">
                        Instant Broadcast
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Logged as <strong>{user?.fullName || 'Dawit A.'}</strong> ({user?.scoutGuildBadge || 'Selam Bus Intercity Guild #418'}). Trust rating: {user?.trustRating || 98.4}%. No pre-approval needed.
                    </p>
                  </div>
                </label>

                <label
                  onClick={() => setSubmissionMode('anonymous')}
                  className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                    submissionMode === 'anonymous'
                      ? 'border-[#183a2b] bg-[#f0f7f3]'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="mode"
                    checked={submissionMode === 'anonymous'}
                    onChange={() => setSubmissionMode('anonymous')}
                    className="mt-1 text-[#183a2b] focus:ring-[#183a2b]"
                  />
                  <div>
                    <span className="text-xs font-bold text-gray-900">
                      Submit Anonymously / Unverified Passenger
                    </span>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Alert is queued as &lsquo;Under Review&rsquo; until endorsed by 3 on-route verified scouts.
                    </p>
                  </div>
                </label>
              </div>

              {/* Federal police dispatch checkbox */}
              <label className="flex items-center gap-2 pt-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={directPoliceDispatch}
                  onChange={(e) => setDirectPoliceDispatch(e.target.checked)}
                  className="rounded text-[#183a2b] focus:ring-[#183a2b]"
                />
                <span className="text-xs font-semibold text-gray-800">
                  Direct dispatch to <strong>Ethiopian Federal Highway Police (991)</strong> & Debre Birhan Heavy Road Rescue Unit.
                </span>
              </label>
            </div>

            {/* SUBMIT BUTTONS MATCHING SCREEN-7 */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="py-3 px-6 bg-[#0f2b1d] hover:bg-[#07170f] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
              >
                <Radio className="w-4 h-4 text-emerald-400" />
                <span>Publish Hazard Report (ሪፖርቱን ላክ)</span>
              </button>

              <button
                type="button"
                onClick={() => alert('Hazard draft saved locally!')}
                className="py-3 px-4 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Save Offline Draft
              </button>

              <Link
                to="/incidents"
                className="text-xs font-bold text-gray-500 hover:text-gray-900 ml-auto"
              >
                Cancel & Exit
              </Link>
            </div>
          </div>

          {/* Right 5 Columns: Radar, Feed Preview & Standards */}
          <div className="lg:col-span-5 space-y-5">
            {/* Highland Topo Radar mini card matching Screen-7 */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-gray-900 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-[#183a2b]" />
                  Highland Topo Radar
                </span>
              </div>

              {/* Radar Map Graphic Container */}
              <div className="relative h-48 rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                <div className="absolute inset-0 bg-[#eef3ee] flex items-center justify-center">
                  <div className="relative w-full h-full p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="bg-white/90 px-2 py-0.5 rounded shadow-xs text-gray-800">
                        Termaber Escarpment (3,120m)
                      </span>
                    </div>
                    {/* Simulated hairpin marker */}
                    <div className="flex items-center justify-center">
                      <div className="h-6 w-6 rounded-full bg-red-700 text-white flex items-center justify-center shadow-lg relative font-bold text-[10px]">
                        !
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="bg-white/90 px-2 py-0.5 rounded shadow-xs text-gray-800">
                        Debre Birhan Toll
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-gray-500">
                <span>Drag pin to refine exact boulder location</span>
                <button
                  type="button"
                  onClick={() => alert('GPS position reset')}
                  className="font-bold text-[#183a2b] hover:underline"
                >
                  Reset to GPS
                </button>
              </div>
            </div>

            {/* Passenger & Driver Feed Preview Card matching Screen-7 */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs space-y-3">
              <span className="text-xs font-extrabold text-gray-900 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-gray-500" />
                Passenger & Driver Feed Preview
              </span>

              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase bg-red-100 text-red-800 px-2 py-0.5 rounded">
                    {category} • {severity}
                  </span>
                  <span className="text-[10px] text-gray-400">Just now</span>
                </div>
                <h4 className="text-xs font-bold text-gray-900">{landmark}</h4>
                <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">
                  {description}
                </p>
                <div className="flex flex-wrap gap-1 text-[10px]">
                  {selectedTags.map((tag) => (
                    <span key={tag} className="bg-white px-2 py-0.5 rounded border border-gray-200 text-gray-700">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <p className="text-[10px] text-gray-400">
                This card automatically appears on GuzoMate Radar, regional Telegram bot channels, and Selam/Sky Bus onboard radios.
              </p>
            </div>

            {/* Highland Reporting Standards matching Screen-7 */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-gray-900">Highland Reporting Standards</span>
                <span className="text-[10px] font-mono text-gray-400">v4.2 Highland</span>
              </div>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Submitting false or exaggerated road hazard reports disrupts commercial transport corridors and may lead to guild scout suspension under Ethiopian Transport Authority code 44/2.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => alert('Ethiopian Transport Guild Charter v4.2 loaded')}
                  className="font-bold text-[#183a2b] hover:underline text-[11px]"
                >
                  Read Guild Charter (የአሽከርካሪዎች መመሪያ)
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportHazardPage;
