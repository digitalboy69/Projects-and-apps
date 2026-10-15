/* ============================================================================
   DATE FINDER — find the likely birth DATE from what the family remembers
   (tithi / weekday / festival / eclipse / nakshatra / Moon sign / lunar month /
   Saturn-Jupiter-Rahu sign / Samvatsara / English month / date number).
   Engine = pure functions (df*) + one generator `dfGen` (yields progress, returns results).
   Month names are AMANTA (Diwali = Ashvina Amavasya); "North-India names" option shifts Krishna paksha by one.
   Day = sunrise to next sunrise (Vedic day). Tithi/nakshatra match if active at sunrise OR during that day.
   ============================================================================ */
const DF_SAM = ['Prabhava','Vibhava','Shukla','Pramodoota','Prajotpatti','Angirasa','Srimukha','Bhava','Yuva','Dhatu','Ishvara','Bahudhanya','Pramathi','Vikrama','Vrisha','Chitrabhanu','Subhanu','Tarana','Parthiva','Vyaya','Sarvajit','Sarvadhari','Virodhi','Vikriti','Khara','Nandana','Vijaya','Jaya','Manmatha','Durmukhi','Hevilambi','Vilambi','Vikari','Sharvari','Plava','Shubhakrit','Shobhakrit','Krodhi','Vishvavasu','Parabhava','Plavanga','Kilaka','Saumya','Sadharana','Virodhikrit','Paridhavi','Pramadicha','Ananda','Rakshasa','Nala','Pingala','Kalayukti','Siddharthi','Raudra','Durmati','Dundubhi','Rudhirodgari','Raktakshi','Krodhana','Akshaya'];
const DF_AT = { sr:0, fore:0.15, noon:0.25, eve:0.54, mid:0.75 };          // moment of the day, as a fraction of a day after sunrise
const DF_LIM_SOLAR = 1.55, DF_LIM_LUNAR = 1.0;                  // |Moon latitude| limits (degrees) at new / full moon
/* [id, name, kind, amantaMonth(0=Chaitra), tithi(1-30), moment]  kind L = lunar (tithi in month), S = Sun enters sign, O = Onam (Shravana nakshatra in Simha) */
const DF_FEST = [
 ['ugadi','Ugadi / Gudi Padwa (new year)','L',0,1,'sr'],
 ['ramnavami','Ram Navami','L',0,9,'noon'],
 ['hanuman','Hanuman Jayanti','L',0,15,'sr'],
 ['akshaya','Akshaya Tritiya','L',1,3,'fore'],
 ['buddha','Buddha Purnima','L',1,15,'eve'],
 ['rath','Rath Yatra','L',3,2,'sr'],
 ['guru','Guru Purnima','L',3,15,'sr'],
 ['nagpanchami','Nag Panchami','L',4,5,'sr'],
 ['rakhi','Raksha Bandhan','L',4,15,'noon'],
 ['janmashtami','Krishna Janmashtami','L',4,23,'mid'],
 ['ganesh','Ganesh Chaturthi','L',5,4,'noon'],
 ['anant','Anant Chaturdashi','L',5,14,'sr'],
 ['pitru','Sarva Pitru Amavasya (Mahalaya)','L',5,30,'sr'],
 ['navratri','Navaratri begins','L',6,1,'sr'],
 ['durgashtami','Durga Ashtami','L',6,8,'sr'],
 ['mahanavami','Maha Navami','L',6,9,'sr'],
 ['dussehra','Vijayadashami (Dussehra)','L',6,10,'noon+eve'],
 ['sharad','Sharad Purnima','L',6,15,'eve'],
 ['karwa','Karwa Chauth','L',6,19,'eve'],
 ['dhanteras','Dhanteras','L',6,28,'eve'],
 ['narak','Naraka Chaturdashi (Choti Diwali)','L',6,29,'sr'],
 ['diwali','Diwali (Lakshmi Puja)','L',6,30,'eve'],
 ['govardhan','Govardhan Puja / Bali Pratipada','L',7,1,'sr'],
 ['bhaidooj','Bhai Dooj','L',7,2,'noon'],
 ['chhath','Chhath Puja','L',7,6,'eve'],
 ['devuthani','Dev Uthani Ekadashi','L',7,11,'sr'],
 ['kartikpurnima','Kartik Purnima / Dev Diwali','L',7,15,'eve'],
 ['makar','Makar Sankranti / Pongal','S',9],
 ['vasant','Vasant Panchami','L',10,5,'fore'],
 ['shivratri','Maha Shivaratri','L',10,29,'mid'],
 ['holika','Holika Dahan','L',11,15,'eve'],
 ['holi','Holi (Dhulandi)','L',11,15,'eve',1],
 ['mesha','Mesha Sankranti (Vishu / Baisakhi / Puthandu)','S',0],
 ['onam','Onam (Thiruvonam)','O']
];

