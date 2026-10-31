import { Language } from '../../types';

export interface SceneTranslation {
  number: string;
  kicker: string;
  title: string;
  body: string;
  foundationNote?: string;
  badges?: string[];
  reportNote?: string;
  exitLink?: string;
}

export interface FeatureCardTranslation {
  title: string;
  icon: 'spark' | 'rain' | 'warning';
  text: string;
  items: string[];
}

export interface LandingCopy {
  header: {
    taglineLead: string;
    taglineEmphasis: string;
    explore: string;
    openApp: string;
    signOut: string;
    logIn: string;
    signUp: string;
    selectLanguage: string;
  };
  stage: {
    caption: string;
    ariaLabel: string;
    chapterNavLabel: string;
    chapterAriaPrefix: string;
  };
  map: {
    origin: string;
    destination: string;
    estimatedArrival: string;
    arrivalTime: string;
    liveReport: string;
    communityReport: string;
    incidentReported: string;
    incidentDefaultLabel: string;
    verifiedCommunity: string;
    unverifiedReport: string;
    liveSpatialLabel: string;
    illustrativeLabel: string;
    formatTimeAgo: (mins: number) => string;
    greetings: {
      enLabel: string;
      enText: string;
      amLabel: string;
      amText: string;
      omLabel: string;
      omText: string;
    };
  };
  weather: {
    destinationForecast: string;
    destinationCity: string;
    atArrival: string;
    arrivalTime: string;
    temperature: string;
    rainChance: string;
    aiRecommends: string;
    defaultAdvice: string;
  };
  scenes: SceneTranslation[];
  features: {
    eyebrow: string;
    titleLead: string;
    titleEmphasis: string;
    subtitleLead: string;
    subtitleHighlight: string;
    cards: FeatureCardTranslation[];
  };
  closing: {
    eyebrow: string;
    titleLead: string;
    titleEmphasis: string;
    body: string;
    openApp: string;
    exploreMap: string;
    signUp: string;
    logIn: string;
    authNoteLoggedIn: (name: string) => string;
    authNoteLoggedOut: string;
  };
  footer: {
    aboutUs: string;
    contactUs: string;
    exploreMap: string;
    quoteLead: string;
    quoteEmphasis: string;
    metaPill: string;
    location: string;
  };
}

export const landingTranslations: Record<Language, LandingCopy> = {
  en: {
    header: {
      taglineLead: 'A map shows you where. ',
      taglineEmphasis: 'We help you know what to expect.',
      explore: 'Explore',
      openApp: 'Open App',
      signOut: 'Sign Out',
      logIn: 'Log in',
      signUp: 'Sign up',
      selectLanguage: 'Select application language',
    },
    stage: {
      caption: 'Travel intelligence / a journey in four chapters',
      ariaLabel:
        'An illustrative paper map of Bishoftu and Addis Ababa, with multilingual greetings, a community road incident and arrival-time rainfall',
      chapterNavLabel: 'Story chapters',
      chapterAriaPrefix: 'Go to chapter',
    },
    map: {
      origin: 'Bishoftu',
      destination: 'Addis Ababa',
      estimatedArrival: 'Estimated arrival',
      arrivalTime: '4:30 PM',
      liveReport: 'Live report',
      communityReport: 'Community report',
      incidentReported: 'Road incident reported',
      incidentDefaultLabel: 'Bole Road · Debris reported',
      verifiedCommunity: 'Verified community',
      unverifiedReport: 'Unverified report',
      liveSpatialLabel: 'GuzoMate Live Spatial · Addis Ababa',
      illustrativeLabel: 'Illustrative map · not live data',
      formatTimeAgo: (mins: number) =>
        mins < 60 ? `${mins} min ago` : `${Math.floor(mins / 60)}h ago`,
      greetings: {
        enLabel: 'English',
        enText: 'Welcome',
        amLabel: 'Amharic',
        amText: 'እንኳን ደህና መጡ',
        omLabel: 'Afaan Oromoo',
        omText: 'Baga nagaan dhuftan',
      },
    },
    weather: {
      destinationForecast: 'Destination forecast',
      destinationCity: 'Addis Ababa',
      atArrival: 'At arrival',
      arrivalTime: '4:30 PM',
      temperature: 'Temperature',
      rainChance: 'Rain chance',
      aiRecommends: 'GuzoMate AI recommends',
      defaultAdvice:
        'Rain is expected when you arrive. Bring an umbrella and a light jacket.',
    },
    scenes: [
      {
        number: '01 / 04',
        kicker: 'The map unfolds',
        title: 'Your journey starts with a map.',
        body: 'Open a little possibility. Discover the places, people and conditions that make every journey different.',
        foundationNote:
          'The map provides the geographical foundation. Travel intelligence adds the context.',
      },
      {
        number: '02 / 04',
        kicker: 'A welcome in every language',
        title: 'Travel speaks every language.',
        body: 'A travel companion that understands you. Speak or type naturally in English, Amharic or Afaan Oromoo.',
        badges: ['Text', 'Voice', '3 languages', 'RAG-grounded'],
      },
      {
        number: '03 / 04',
        kicker: 'The road has a story',
        title: 'Know what lies ahead.',
        body: 'Accidents, closures, construction and hazards. See what fellow travelers have reported, right where it happened.',
        reportNote:
          'Community reports are cross-verified by active scout consensus.',
      },
      {
        number: '04 / 04',
        kicker: 'Weather that follows you',
        title: 'Arrive prepared, not surprised.',
        body: 'Not just the weather here and now. The conditions at your destination, when you expect to arrive.',
        exitLink: 'A little more about the intelligence ↓',
      },
    ],
    features: {
      eyebrow: '05 / From the map to the journey',
      titleLead: 'A little context.',
      titleEmphasis: 'A better journey.',
      subtitleLead: 'The map is your geographical foundation.',
      subtitleHighlight: 'These are the three layers we add.',
      cards: [
        {
          title: 'AI travel assistant',
          icon: 'spark',
          text: 'Your personal travel companion, powered by AI and built to understand you.',
          items: [
            'RAG-powered conversational assistance',
            'English, Amharic and Afaan Oromoo',
            'Voice and text interaction',
            'Context-aware travel information',
          ],
        },
        {
          title: 'Arrival-time weather',
          icon: 'rain',
          text: 'Know what the weather will be when you get there, and what to bring.',
          items: [
            'Destination-specific forecasts',
            'Estimated arrival-time weather',
            'AI-powered clothing and preparation recommendations',
          ],
        },
        {
          title: 'Community road reports',
          icon: 'warning',
          text: 'Stay aware of incidents and road conditions reported by other travelers.',
          items: [
            'Accident reports',
            'Road closures',
            'Construction and hazards',
            'Location-based incident information',
          ],
        },
      ],
    },
    closing: {
      eyebrow: 'The journey continues',
      titleLead: 'Go beyond',
      titleEmphasis: 'getting there.',
      body: 'Understand your destination, anticipate the weather, stay informed about road incidents and travel with an assistant that speaks your language.',
      openApp: 'Open GuzoMate',
      exploreMap: 'Explore Map',
      signUp: 'Sign up',
      logIn: 'Log in',
      authNoteLoggedIn: (name: string) =>
        `Signed in as ${name}. Ready to explore routes and radar.`,
      authNoteLoggedOut:
        'Create a free account to bookmark locations, report road hazards, and unlock AI guidance.',
    },
    footer: {
      aboutUs: 'About Us',
      contactUs: 'Contact Us',
      exploreMap: 'Explore Map',
      quoteLead: 'Geography is the foundation.',
      quoteEmphasis: 'Travel intelligence is the difference.',
      metaPill: 'AI assistant · Arrival weather · Community reports',
      location: 'Addis Ababa, Ethiopia',
    },
  },

  am: {
    header: {
      taglineLead: 'ካርታ የት መሄድ እንዳለብዎት ያሳያል። ',
      taglineEmphasis: 'ምን እንደሚጠብቅዎት እንድያውቁ እናግዛለን።',
      explore: 'ያስሱ',
      openApp: 'መተግበሪያውን ክፈት',
      signOut: 'ውጣ',
      logIn: 'ይግቡ',
      signUp: 'ይመዝገቡ',
      selectLanguage: 'ቋንቋ ይምረጡ',
    },
    stage: {
      caption: 'የጉዞ መረጃ / ጉዞ በአራት ምዕራፎች',
      ariaLabel:
        'የቢሾፍቱ እና የአዲስ አበባ ካርታ፣ የብዙ ቋንቋ ሰላምታዎች፣ የማህበረሰብ መንገድ ክስተት እና የመድረሻ ዝናብ ሁኔታ የሚያሳይ ማሳያ',
      chapterNavLabel: 'የታሪኩ ምዕራፎች',
      chapterAriaPrefix: 'ወደ ምዕራፍ ሂድ',
    },
    map: {
      origin: 'ቢሾፍቱ',
      destination: 'አዲስ አበባ',
      estimatedArrival: 'የሚደረስበት ሰዓት',
      arrivalTime: '10:30 ከሰዓት',
      liveReport: 'የቀጥታ ሪፖርት',
      communityReport: 'የማህበረሰብ ሪፖርት',
      incidentReported: 'የመንገድ ክስተት ተዘግቧል',
      incidentDefaultLabel: 'ቦሌ መንገድ · ፍርስራሽ ተዘግቧል',
      verifiedCommunity: 'የተረጋገጠ ማህበረሰብ',
      unverifiedReport: 'ያልተረጋገጠ ሪፖርት',
      liveSpatialLabel: 'ጉዞሜት የቀጥታ ካርታ · አዲስ አበባ',
      illustrativeLabel: 'ማሳያ ካርታ · የቀጥታ መረጃ አይደለም',
      formatTimeAgo: (mins: number) =>
        mins < 60 ? `ከ${mins} ደቂቃ በፊት` : `ከ${Math.floor(mins / 60)} ሰዓት በፊት`,
      greetings: {
        enLabel: 'እንግሊዝኛ',
        enText: 'Welcome',
        amLabel: 'አማርኛ',
        amText: 'እንኳን ደህና መጡ',
        omLabel: 'አፋን ኦሮሞ',
        omText: 'Baga nagaan dhuftan',
      },
    },
    weather: {
      destinationForecast: 'የመድረሻ የአየር ሁኔታ ትንበያ',
      destinationCity: 'አዲስ አበባ',
      atArrival: 'በሚደረስበት ወቅት',
      arrivalTime: '10:30 ከሰዓት',
      temperature: 'የሙቀት መጠን',
      rainChance: 'የዝናብ ዕድል',
      aiRecommends: 'ጉዞሜት AI ይመክራል',
      defaultAdvice: 'ሲደርሱ ዝናብ ይጠበቃል። ጃንጥላ እና ቀለል ያለ ጃኬት ይዘው ይጓዙ።',
    },
    scenes: [
      {
        number: '01 / 04',
        kicker: 'ካርታው ይዘረጋል',
        title: 'ጉዞዎ በካርታ ይጀምራል።',
        body: 'አዳዲስ ዕድሎችን ይክፈቱ። እያንዳንዱን ጉዞ ልዩ የሚያደርጉትን ቦታዎች፣ ሰዎች እና ሁኔታዎች ይወቁ።',
        foundationNote:
          'ካርታው የመልክዓ ምድር መሰረትን ይሰጣል። የጉዞ መረጃ ደግሞ ሙሉ ሁኔታውን ያብራራል።',
      },
      {
        number: '02 / 04',
        kicker: 'በሁሉም ቋንቋ አቀባበል',
        title: 'ጉዞ በሁሉም ቋንቋ ይናገራል።',
        body: 'የሚረዳዎት የጉዞ ጓደኛ። በእንግሊዝኛ፣ በአማርኛ ወይም በአፋን ኦሮሞ በተፈጥሮአዊ መንገድ ይናገሩ ወይም ይፃፉ።',
        badges: ['ጽሑፍ', 'ድምፅ', '3 ቋንቋዎች', 'በእውነተኛ መረጃ የተደገፈ (RAG)'],
      },
      {
        number: '03 / 04',
        kicker: 'መንገዱ የራሱ ታሪክ አለው',
        title: 'ወደፊት ምን እንደሚጠብቅዎት ይወቁ።',
        body: 'አደጋዎች፣ የተዘጉ መንገዶች፣ ግንባታዎች እና አደጋ ቀጣናዎች። ሌሎች ተጓዦች በቦታው ሪፖርት ያደረጉትን በቀጥታ ይመልከቱ።',
        reportNote: 'የማህበረሰብ ሪፖርቶች በተጠቃሚዎች ንቁ ተሳትፎ ይረጋገጣሉ።',
      },
      {
        number: '04 / 04',
        kicker: 'አብሮዎት የሚጓዝ የአየር ሁኔታ',
        title: 'ተዘጋጅተው ይድረሱ፤ አይደናገጡ።',
        body: 'አሁን እና እዚህ ያለውን አየር ብቻ አይደለም። መድረሻዎ ላይ በሚደርሱበት ሰዓት የሚኖረውን የአየር ሁኔታ አስቀድመው ይወቁ።',
        exitLink: 'ስለ ጉዞ መረጃው ተጨማሪ ዝርዝር ↓',
      },
    ],
    features: {
      eyebrow: '05 / ከካርታ ወደ ሙሉ ጉዞ',
      titleLead: 'የተሟላ መረጃ።',
      titleEmphasis: 'የተሻለ ጉዞ።',
      subtitleLead: 'ካርታው መልክዓ ምድራዊ መሰረትዎ ነው።',
      subtitleHighlight: 'የምንጨምራቸው ሦስቱ ጠቃሚ አገልግሎቶች እነዚህ ናቸው።',
      cards: [
        {
          title: 'የAI የጉዞ ረዳት',
          icon: 'spark',
          text: 'በአርቴፊሻል ኢንተለጀንስ የተደገፈ እና እርስዎን ለመረዳት የተዘጋጀ የግል የጉዞ ጓደኛዎ።',
          items: [
            'በRAG የተደገፈ የውይይት ረዳት',
            'እንግሊዝኛ፣ አማርኛ እና አፋን ኦሮሞ',
            'የድምፅ እና የጽሑፍ ግንኙነት',
            'ሁኔታን ያገናዘበ የጉዞ መረጃ',
          ],
        },
        {
          title: 'የመድረሻ ሰዓት የአየር ሁኔታ',
          icon: 'rain',
          text: 'እዚያ ሲደርሱ አየሩ ምን እንደሚመስል እና ምን ይዘው መሄድ እንዳለብዎት አስቀድመው ይወቁ።',
          items: [
            'ለመድረሻ ቦታው የተለየ ትንበያ',
            'የሚደርሱበት ሰዓት የአየር ሁኔታ',
            'በAI የተደገፈ የአለባበስ እና የዝግጅት ምክሮች',
          ],
        },
        {
          title: 'የማህበረሰብ የመንገድ ሪፖርቶች',
          icon: 'warning',
          text: 'በሌሎች ተጓዦች ሪፖርት የተደረጉ የመንገድ ሁኔታዎችን እና ክስተቶችን ይከታተሉ።',
          items: [
            'የትራፊክ አደጋ ሪፖርቶች',
            'የተዘጉ መንገዶች መረጃ',
            'የመንገድ ግንባታዎች እና አደጋዎች',
            'በቦታ ላይ የተመሰረተ የክስተት መረጃ',
          ],
        },
      ],
    },
    closing: {
      eyebrow: 'ጉዞው ይቀጥላል',
      titleLead: 'ከመድረስ ባለፈ',
      titleEmphasis: 'ጉዞዎን ያቅዱ።',
      body: 'መድረሻዎን ይረዱ፣ የአየር ሁኔታውን አስቀድመው ይወቁ፣ ስለ መንገድ ክስተቶች መረጃ ያግኙ እና በቋንቋዎ ከሚረዳ ረዳት ጋር ይጓዙ።',
      openApp: 'ጉዞሜትን ክፈት',
      exploreMap: 'ካርታ ያስሱ',
      signUp: 'ይመዝገቡ',
      logIn: 'ይግቡ',
      authNoteLoggedIn: (name: string) =>
        `በ ${name} ስም ገብተዋል። መንገዶችን እና ሁኔታዎችን ለመቃኘት ዝግጁ ነዎት።`,
      authNoteLoggedOut:
        'ቦታዎችን ለማስቀመጥ፣ የመንገድ ችግሮችን ሪፖርት ለማድረግ እና የAI መመሪያዎችን ለማግኘት ነፃ አካውንት ይፍጠሩ።',
    },
    footer: {
      aboutUs: 'ስለ እኛ',
      contactUs: 'ያግኙን',
      exploreMap: 'ካርታ ያስሱ',
      quoteLead: 'መልክዓ ምድር መሰረቱ ነው።',
      quoteEmphasis: 'የጉዞ መረጃ ደግሞ የልህቀቱ መለያ ነው።',
      metaPill: 'የAI ረዳት · የመድረሻ አየር ሁኔታ · የማህበረሰብ ሪፖርቶች',
      location: 'አዲስ አበባ፣ ኢትዮጵያ',
    },
  },

  om: {
    header: {
      taglineLead: 'Kaartaan eessa akka deemtan isinitti agarsiisa. ',
      taglineEmphasis: 'Maal akka isin eeggatu akka beektan isin gargaarra.',
      explore: 'Daawwadhaa',
      openApp: 'Appii Bani',
      signOut: "Ba'aa",
      logIn: 'Seenaa',
      signUp: "Galmaa'aa",
      selectLanguage: 'Afaan filadhaa',
    },
    stage: {
      caption: 'Odeeffannoo imalaa / imala boqonnaalee afuriin',
      ariaLabel:
        'Kaartaa waraqaa fakkeenyaa kan Bishooftuu fi Finfinnee, simannaa afaanoota sadii, balaa daandii hawaasaa fi haala rooba ga’umsaa',
      chapterNavLabel: 'Boqonnaalee seenaa',
      chapterAriaPrefix: 'Gara boqonnaa deemi',
    },
    map: {
      origin: 'Bishooftuu',
      destination: 'Finfinnee',
      estimatedArrival: 'Yeroo itti ga’amu',
      arrivalTime: '10:30 WB',
      liveReport: 'Gabaasa qajeeltoo',
      communityReport: 'Gabaasa hawaasaa',
      incidentReported: 'Balaan daandii gabaafameera',
      incidentDefaultLabel: 'Daandii Boolee · Caccabaan gabaafameera',
      verifiedCommunity: "Hawaasaan mirkanaa'e",
      unverifiedReport: 'Gabaasa hin mirkanoofne',
      liveSpatialLabel: 'GuzoMate Kaartaa Kallattii · Finfinnee',
      illustrativeLabel: 'Kaartaa fakkeenyaa · daataa kallattii miti',
      formatTimeAgo: (mins: number) =>
        mins < 60 ? `Daqiiqaa ${mins} dura` : `Sa'aatii ${Math.floor(mins / 60)} dura`,
      greetings: {
        enLabel: 'Ingilizii',
        enText: 'Welcome',
        amLabel: 'Amaariffa',
        amText: 'እንኳን ደህና መጡ',
        omLabel: 'Afaan Oromoo',
        omText: 'Baga nagaan dhuftan',
      },
    },
    weather: {
      destinationForecast: "Raaga qilleensa bakka ga'umsaa",
      destinationCity: 'Finfinnee',
      atArrival: "Yeroo ga'umsaa",
      arrivalTime: '10:30 WB',
      temperature: "Ho'ina",
      rainChance: 'Carraa roobaa',
      aiRecommends: 'GuzoMate AI ni gorsa',
      defaultAdvice:
        'Yommuu geessan roobni ni eegama. Dibaabaa fi jakkeettii salphaa qabadhaa.',
    },
    scenes: [
      {
        number: '01 / 04',
        kicker: 'Kaartaan ni diriira',
        title: 'Imalli keessan kaartaan eegala.',
        body: 'Carraawwan haaraa banaa. Bakkeewwan, namootaa fi haalota imala hundumaa adda taasisan adda baafadhaa.',
        foundationNote:
          'Kaartaan bu’uura ji’oogiraafii kenna. Odeeffannoon imalaa immoo haala isaa ibsa.',
      },
      {
        number: '02 / 04',
        kicker: 'Afaan hundumaan simannaa',
        title: 'Imalli afaan hundumaan dubbata.',
        body: 'Hiriyaa imalaa kan isin hubatu. Afaan Ingilizii, Afaan Amaaraa yookiin Afaan Oromootiin salphaatti dubbadhaa ykn barreessaa.',
        badges: ['Barreeffama', 'Sagalee', 'Afaanoota 3', 'Daataa qabatamaan (RAG)'],
      },
      {
        number: '03 / 04',
        kicker: 'Daandiin seenaa qaba',
        title: 'Fuuldura keessan maal akka jiru beekaa.',
        body: 'Balaawwan, cufamuu daandii, ijaarsa fi balaawwan tasaa. Wanta imaltoonni biraa bakka ta’etti gabaasan kallattiin ilaalaa.',
        reportNote:
          "Gabaasawwan hawaasaa walii-galtee fayyadamtootaan mirkanaa'u.",
      },
      {
        number: '04 / 04',
        kicker: 'Qilleensa isin faana deemu',
        title: 'Qophooftanii ga’aa, hin rifatinaa.',
        body: 'Haala qilleensa ammaa fi as jiru qofa miti. Bakka ga’umsaa yeroo itti geessan haala jiru dursanii beekaa.',
        exitLink: 'Waa’ee odeeffannoo imalaa dabalataan ↓',
      },
    ],
    features: {
      eyebrow: '05 / Kaartaa irraa gara imalaatti',
      titleLead: 'Hubannoo guutuu.',
      titleEmphasis: 'Imala wayyaa.',
      subtitleLead: 'Kaartaan bu’uura ji’oogiraafii keessani.',
      subtitleHighlight: 'Sadarkaalee sadii nuti itti daballu kanneeni.',
      cards: [
        {
          title: 'Gargaaraa Imalaa AI',
          icon: 'spark',
          text: 'Hiriyaa imalaa dhuunfaa keessanii, AI-n kan deeggaramee fi isin hubachuuf kan tolfame.',
          items: [
            'Gargaarsa marii RAG tiin deeggarame',
            'Afaan Ingilizii, Afaan Amaaraa fi Afaan Oromoo',
            'Wal-qunnamtii sagalee fi barreeffamaa',
            'Odeeffannoo imalaa haala hubate',
          ],
        },
        {
          title: "Haala qilleensa yeroo ga'umsaa",
          icon: 'rain',
          text: 'Yeroo achi geessan qilleensi maal akka fakkaatuu fi maal qabachuu akka qabdan beekaa.',
          items: [
            "Raaga bakka ga'umsaa qofaaf qophaa'e",
            "Haala qilleensa yeroo ga'umsaa tilmaamame",
            'Gorsa uffannaa fi qophii AI tiin deeggarame',
          ],
        },
        {
          title: 'Gabaasaalee daandii hawaasaa',
          icon: 'warning',
          text: 'Haala daandii fi balaawwan imaltoota biraan gabaafaman hordofaa.',
          items: [
            'Gabaasaalee balaa tiraafikaa',
            'Karaalee cufaman',
            'Ijaarsa daandii fi balaawwan',
            "Odeeffannoo balaa bakka irratti hundaa'e",
          ],
        },
      ],
    },
    closing: {
      eyebrow: 'Imalli ni fufa',
      titleLead: "Ga'uu qofa osoo hin taane",
      titleEmphasis: 'imalicha mi’eeffadhaa.',
      body: 'Bakka ga’umsaa keessan hubadhaa, haala qilleensaa dursitanii beekaa, balaawwan daandii irraa of eegaa, hiriyaa afaan keessan dubbatu wajjin imalaa.',
      openApp: 'GuzoMate Bani',
      exploreMap: 'Kaartaa Daawwadhaa',
      signUp: "Galmaa'aa",
      logIn: 'Seenaa',
      authNoteLoggedIn: (name: string) =>
        `Akka ${name} seentanii jirtu. Karaalee fi haala daandii daawwachuuf qophiidha.`,
      authNoteLoggedOut:
        "Bakkeewwan olkaa'uuf, balaawwan daandii gabaasuuf, fi gorsa AI argachuuf akkaawuntii tolaa banadhaa.",
    },
    footer: {
      aboutUs: 'Waa’ee Keenya',
      contactUs: 'Nu Qunnamaa',
      exploreMap: 'Kaartaa Daawwadhaa',
      quoteLead: 'Ji’oogiraafiin bu’uura.',
      quoteEmphasis: 'Odeeffannoon imalaa immoo adda durummaa dha.',
      metaPill: 'Gargaaraa AI · Qilleensa ga’umsaa · Gabaasaalee hawaasaa',
      location: 'Finfinnee, Itoophiyaa',
    },
  },
};
