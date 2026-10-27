-- Seed Curated Knowledge Base for Addis Ababa Travel Guidance (FR-05)

INSERT INTO rag_documents (source_type, source_id, language, title, content, metadata)
VALUES
-- 1. Transport Knowledge (EN)
('travel_guide', 'transport_aalrt_en', 'en', 'Addis Ababa Light Rail Transit (AALRT)',
 'The Light Rail Transit in Addis Ababa consists of two main lines: the Blue Line (North-South from Menelik II Square to Kaliti) and the Green Line (East-West from Ayat to Tor Hailoch). Both lines intersect at Stadium station. Tickets are purchased at designated station kiosks prior to boarding.',
 '{"category": "transport", "region": "Addis Ababa", "tags": ["train", "metro", "transit"]}'),

-- 2. Transport Knowledge (AM)
('travel_guide', 'transport_aalrt_am', 'am', 'የአዲስ አበባ ቀላል ባቡር ትራንዚት',
 'የአዲስ አበባ ቀላል ባቡር ሁለት መስመሮች አሉት፡ ሰማያዊ መስመር (ከዳግማዊ ምኒልክ አደባባይ እስከ ቃሊቲ) እና አረንጓዴ መስመር (ከአያት እስከ ጦር ኃይሎች)። ሁለቱም መስመሮች በስታዲየም ጣቢያ ይገናኛሉ። ትኬቶች ባቡር ከመሳፈርዎ በፊት በጣቢያዎች ባሉ የትኬት መቁረጫዎች ይገዛሉ።',
 '{"category": "transport", "region": "Addis Ababa", "tags": ["ባቡር", "መጓጓዣ"]}'),

-- 3. Transport Knowledge (OM)
('travel_guide', 'transport_aalrt_om', 'om', 'Baabura Salphaa Finfinnee (AALRT)',
 'Tajaajilli baabura salphaa Finfinnee sararoota gurguddoo lama qaba: Sarara Cuquliisa (Addabaabayii Minilik Lammaffaa irraa gara Qaallittiitti) fi Sarara Magariisa (Ayaat irraa gara Xoor-Haayiloochitti). Sararoonni lamaan buufata Istaadiyeemitti wal-argu. Tikeetiin osoo baabura hin yaabbatin dura buufataalee keessaa bitama.',
 '{"category": "transport", "region": "Finfinnee", "tags": ["baabura", "tiraanzitii"]}'),

-- 4. Minibuses & Taxis (EN)
('travel_guide', 'transport_minibus_en', 'en', 'Blue & White Minibuses and Ride-hailing',
 'Blue and white minibuses are the most common public transit mode in Addis Ababa. Fare collectors (called Woyalas) call out destinations from the door. Major transit hubs include Mexico Square, Megenagna, Piazza, and Bole. For direct private transport, ride-hailing apps like Ride and Feres are widely available and accept cash or local mobile payments.',
 '{"category": "transport", "region": "Addis Ababa", "tags": ["taxi", "minibus", "ride"]}'),

-- 5. Minibuses & Taxis (AM)
('travel_guide', 'transport_minibus_am', 'am', 'ሰማያዊና ነጭ ታክሲዎች እና የራይድ መጓጓዣ',
 'ሰማያዊ እና ነጭ ሚኒባስ ታክሲዎች በአዲስ አበባ በብዛት የሚዘወተሩ የህዝብ ማመላለሻዎች ናቸው። ረዳቶች (ወያላዎች) መዳረሻዎችን በመጥራት መንገደኞችን ይቀበላሉ። ዋና ዋና የመናኸሪያ ቦታዎች ሜክሲኮ፣ መገናኛ፣ ፒያሳ እና ቦሌ ይገኙበታል። ለግል ጉዞ ራይድ እና ፈረስ የተባሉ የሞባይል መተግበሪያዎች በስፋት ያገለግላሉ።',
 '{"category": "transport", "region": "Addis Ababa", "tags": ["ታክሲ", "ሚኒባስ", "ራይድ"]}'),

-- 6. Minibuses & Taxis (OM)
('travel_guide', 'transport_minibus_om', 'om', 'Midiibaasii fi Tajaajila Raayidii',
 'Midiibaasiiwwan cuquliisa fi adiin tajaajila geejjiba uummataa Finfinnee keessatti baay''ee beekamoodha. Gargaartonni (wayyaalota) iddoo geessan balbala irraa lallabu. Buufanni gurguddoon Meeksikoo, Maganaanyaa, Piyaassaa fi Booleedha. Geejjiba dhuunfaatiif aplikeeshiniiwwan akka Ride fi Feres bal''inaan itti fayyadamu.',
 '{"category": "transport", "region": "Finfinnee", "tags": ["taaksii", "midiibaasii", "raayidii"]}'),

-- 7. Landmarks & Culture (EN)
('travel_guide', 'culture_coffee_en', 'en', 'Traditional Ethiopian Coffee Ceremony',
 'The traditional coffee ceremony (Buna) is an essential social and cultural ritual. Fresh beans are roasted over coals, ground by hand, and brewed in a clay pot called a Jebena. Coffee is traditionally served in three successive rounds: Abol (the first and strongest), Tona (the second), and Bereka (the third and blessing round), often accompanied by popcorn or roasted barley (Kolo).',
 '{"category": "culture", "region": "Ethiopia", "tags": ["coffee", "culture", "buna"]}'),

-- 8. Landmarks & Culture (AM)
('travel_guide', 'culture_coffee_am', 'am', 'የኢትዮጵያ ባህላዊ የቡና ስነ-ስርዓት',
 'ባህላዊ የቡና ስነ-ስርዓት የኢትዮጵያ ማህበራዊ ህይወት መገለጫ ነው። ቡናው በእሳት ላይ ተቆልቶ፣ ተወቅጦ፣ በሸክላ ጀበና ይፈላል። ቡና በሶስት ዙሮች ይሰጣል፡ አቦል (የመጀመሪያውና ጠንካራው)፣ ቶና (ሁለተኛው) እና በረካ (የበረከት ዙር)። ብዙውን ጊዜ ከፈንዲሻ ወይም ቆሎ ጋር ይቀርባል።',
 '{"category": "culture", "region": "Ethiopia", "tags": ["ቡና", "ባህል", "ጀበና"]}'),

-- 9. Landmarks & Culture (OM)
('travel_guide', 'culture_coffee_om', 'om', 'Sirna Buna Aadaa Oromoo fi Itoophiyaa',
 'Sirni buna aadaa sirna hawaasummaa guddaadha. Bunni calaqqee irratti akaawamee, mooyyetti tumamee, jabana supheetti danfisama. Bunni marsaa sadiin dhihaata: Abooli (marsaa duraa), Toonaa (marsaa lammaffaa), fi Barakaa (marsaa eebbaa). Yeroo baay''ee boqqoolloo affeelamaa (faandishaa) yookiin qoolloo wajjin dhihaata.',
 '{"category": "culture", "region": "Finfinnee", "tags": ["buna", "aadaa", "jabana"]}'),

-- 10. Health & Altitude Tips (EN)
('travel_guide', 'health_altitude_en', 'en', 'Altitude & Climate in Addis Ababa',
 'Addis Ababa is located at an altitude of approximately 2,355 meters (7,726 feet) above sea level. Travelers may experience mild breathlessness or dehydration during the first 48 hours. Staying well-hydrated, avoiding strenuous exertion on day one, and dressing in layers for cool evenings is strongly recommended.',
 '{"category": "health", "region": "Addis Ababa", "tags": ["altitude", "health", "weather"]}');
