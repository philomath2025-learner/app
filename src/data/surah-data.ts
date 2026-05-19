/**
 * Static Surah Catalog — All 114 Chapters of the Quran
 *
 * Fields: id, nameAr, nameEn, meaningEn, verses, words, chars, revelation, juz, rukus, sajdah
 * Source: Cross-verified with user-provided reference table + Quran.com metadata
 */

export interface SurahInfo {
  id: number;
  nameAr: string;
  nameEn: string;
  meaningEn: string;
  verses: number;
  words: number;
  chars: number;
  revelation: "Meccan" | "Medinan";
  juz: number;
  rukus: number;
  sajdah: boolean;
}

// Compact tuple: [id, nameAr, nameEn, meaningEn, verses, words, chars, revelation(0=Meccan,1=Medinan), juz, rukus, sajdah(0/1)]
type R = [number,string,string,string,number,number,number,number,number,number,number];
const D: R[] = [
[1,"الفاتحة","Al-Fatiha","The Opening",7,29,143,0,1,1,0],
[2,"البقرة","Al-Baqarah","The Cow",286,6140,26249,1,1,40,0],
[3,"آل عمران","Ali 'Imran","Family of Imran",200,3501,14985,1,3,20,0],
[4,"النساء","An-Nisa","The Women",176,3763,16332,1,4,24,0],
[5,"المائدة","Al-Ma'idah","The Table Spread",120,2837,12206,1,6,16,0],
[6,"الأنعام","Al-An'am","The Cattle",165,3056,12726,0,7,20,0],
[7,"الأعراف","Al-A'raf","The Heights",206,3341,14435,0,8,24,1],
[8,"الأنفال","Al-Anfal","The Spoils of War",75,1242,5387,1,9,10,0],
[9,"التوبة","At-Tawbah","The Repentance",129,2505,11115,1,10,16,0],
[10,"يونس","Yunus","Jonah",109,1839,7589,0,11,11,0],
[11,"هود","Hud","Hud",123,1946,7817,0,11,10,0],
[12,"يوسف","Yusuf","Joseph",111,1795,7307,0,12,12,0],
[13,"الرعد","Ar-Ra'd","The Thunder",43,853,3545,1,13,6,1],
[14,"ابراهيم","Ibrahim","Abraham",52,830,3539,0,13,7,0],
[15,"الحجر","Al-Hijr","The Rocky Tract",99,657,2882,0,14,6,0],
[16,"النحل","An-Nahl","The Bee",128,1844,7832,0,14,16,1],
[17,"الإسراء","Al-Isra","The Night Journey",111,1558,6643,0,15,12,1],
[18,"الكهف","Al-Kahf","The Cave",110,1583,6552,0,15,12,0],
[19,"مريم","Maryam","Mary",98,971,3935,0,16,6,1],
[20,"طه","Ta-Ha","Ta-Ha",135,1353,5399,0,16,8,0],
[21,"الأنبياء","Al-Anbiya","The Prophets",112,1174,5094,0,17,7,0],
[22,"الحج","Al-Hajj","The Pilgrimage",78,1279,5314,1,17,10,1],
[23,"المؤمنون","Al-Mu'minun","The Believers",118,1052,4483,0,18,6,0],
[24,"النور","An-Nur","The Light",64,1319,5754,1,18,9,0],
[25,"الفرقان","Al-Furqan","The Criterion",77,896,3878,0,18,6,1],
[26,"الشعراء","Ash-Shu'ara","The Poets",227,1320,5630,0,19,11,0],
[27,"النمل","An-Naml","The Ant",93,1159,4790,0,19,7,1],
[28,"القصص","Al-Qasas","The Stories",88,1438,5930,0,20,9,0],
[29,"العنكبوت","Al-'Ankabut","The Spider",69,978,4317,0,20,7,0],
[30,"الروم","Ar-Rum","The Romans",60,817,3472,0,21,6,0],
[31,"لقمان","Luqman","Luqman",34,550,2171,0,21,4,0],
[32,"السجدة","As-Sajdah","The Prostration",30,372,1563,0,21,3,1],
[33,"الأحزاب","Al-Ahzab","The Combined Forces",73,1303,5788,1,21,9,0],
[34,"سبإ","Saba","Sheba",54,884,3594,0,22,6,0],
[35,"فاطر","Fatir","Originator",45,778,3238,0,22,5,0],
[36,"يس","Ya-Sin","Ya-Sin",83,730,3068,0,22,5,0],
[37,"الصافات","As-Saffat","Those Ranged in Ranks",182,865,3899,0,23,5,0],
[38,"ص","Sad","The Letter Sad",88,735,3065,0,23,5,1],
[39,"الزمر","Az-Zumar","The Troops",75,1177,4869,0,23,8,0],
[40,"غافر","Ghafir","The Forgiver",85,1226,5108,0,24,9,0],
[41,"فصلت","Fussilat","Explained in Detail",54,794,3365,0,24,6,1],
[42,"الشورى","Ash-Shura","The Consultation",53,860,3522,0,25,5,0],
[43,"الزخرف","Az-Zukhruf","The Gold Adornments",89,836,3609,0,25,7,0],
[44,"الدخان","Ad-Dukhan","The Smoke",59,346,1474,0,25,3,0],
[45,"الجاثية","Al-Jathiyah","The Crouching",37,488,2085,0,25,4,0],
[46,"الأحقاف","Al-Ahqaf","The Wind-Curved Sandhills",35,645,2667,0,26,4,0],
[47,"محمد","Muhammad","Muhammad",38,542,2423,1,26,4,0],
[48,"الفتح","Al-Fath","The Victory",29,560,2510,1,26,4,0],
[49,"الحجرات","Al-Hujurat","The Rooms",18,353,1533,1,26,2,0],
[50,"ق","Qaf","The Letter Qaf",45,373,1507,0,26,3,0],
[51,"الذاريات","Adh-Dhariyat","The Winnowing Winds",60,360,1546,0,26,3,0],
[52,"الطور","At-Tur","The Mount",49,312,1324,0,27,2,0],
[53,"النجم","An-Najm","The Star",62,360,1433,0,27,3,1],
[54,"القمر","Al-Qamar","The Moon",55,342,1469,0,27,3,0],
[55,"الرحمن","Ar-Rahman","The Most Merciful",78,352,1647,1,27,3,0],
[56,"الواقعة","Al-Waqi'ah","The Inevitable",96,379,1756,0,27,3,0],
[57,"الحديد","Al-Hadid","The Iron",29,575,2545,1,27,4,0],
[58,"المجادلة","Al-Mujadila","The Pleading Woman",22,475,2046,1,28,3,0],
[59,"الحشر","Al-Hashr","The Exile",24,447,1970,1,28,3,0],
[60,"الممتحنة","Al-Mumtahanah","She That Is Examined",13,352,1560,1,28,2,0],
[61,"الصف","As-Saff","The Ranks",14,226,966,1,28,2,0],
[62,"الجمعة","Al-Jumu'ah","Friday",11,177,768,1,28,2,0],
[63,"المنافقون","Al-Munafiqun","The Hypocrites",11,181,801,1,28,2,0],
[64,"التغابن","At-Taghabun","The Mutual Disillusion",18,242,1091,1,28,2,0],
[65,"الطلاق","At-Talaq","The Divorce",12,289,1203,1,28,2,0],
[66,"التحريم","At-Tahrim","The Prohibition",12,254,1105,1,28,2,0],
[67,"الملك","Al-Mulk","The Sovereignty",30,333,1347,0,29,2,0],
[68,"القلم","Al-Qalam","The Pen",52,301,1289,0,29,2,0],
[69,"الحاقة","Al-Haqqah","The Reality",52,260,1133,0,29,2,0],
[70,"المعارج","Al-Ma'arij","The Ascending Stairways",44,217,971,0,29,2,0],
[71,"نوح","Nuh","Noah",28,227,965,0,29,2,0],
[72,"الجن","Al-Jinn","The Jinn",28,286,1109,0,29,2,0],
[73,"المزمل","Al-Muzzammil","The Enshrouded One",20,200,854,0,29,2,0],
[74,"المدثر","Al-Muddaththir","The Cloaked One",56,256,1035,0,29,2,0],
[75,"القيامة","Al-Qiyamah","The Resurrection",40,164,676,0,29,2,0],
[76,"الانسان","Al-Insan","The Human",31,243,1087,1,29,2,0],
[77,"المرسلات","Al-Mursalat","The Emissaries",50,181,841,0,29,2,0],
[78,"النبإ","An-Naba","The Tidings",40,174,796,0,30,2,0],
[79,"النازعات","An-Nazi'at","Those Who Drag Forth",46,179,785,0,30,2,0],
[80,"عبس","'Abasa","He Frowned",42,133,552,0,30,1,0],
[81,"التكوير","At-Takwir","The Overthrowing",29,104,435,0,30,1,0],
[82,"الإنفطار","Al-Infitar","The Cleaving",19,81,333,0,30,1,0],
[83,"المطففين","Al-Mutaffifin","The Defrauding",36,169,750,0,30,1,0],
[84,"الإنشقاق","Al-Inshiqaq","The Splitting Open",25,108,445,0,30,1,1],
[85,"البروج","Al-Buruj","The Great Stars",22,109,469,0,30,1,0],
[86,"الطارق","At-Tariq","The Morning Star",17,61,254,0,30,1,0],
[87,"الأعلى","Al-A'la","The Most High",19,72,296,0,30,1,0],
[88,"الغاشية","Al-Ghashiyah","The Overwhelming",26,92,382,0,30,1,0],
[89,"الفجر","Al-Fajr","The Dawn",30,139,584,0,30,1,0],
[90,"البلد","Al-Balad","The City",20,82,342,0,30,1,0],
[91,"الشمس","Ash-Shams","The Sun",15,54,253,0,30,1,0],
[92,"الليل","Al-Layl","The Night",21,71,314,0,30,1,0],
[93,"الضحى","Ad-Duha","The Morning Hours",11,40,165,0,30,1,0],
[94,"الشرح","Ash-Sharh","The Relief",8,27,102,0,30,1,0],
[95,"التين","At-Tin","The Fig",8,34,162,0,30,1,0],
[96,"العلق","Al-'Alaq","The Clot",19,72,288,0,30,1,1],
[97,"القدر","Al-Qadr","The Night of Power",5,30,115,0,30,1,0],
[98,"البينة","Al-Bayyinah","The Clear Evidence",8,94,404,1,30,1,0],
[99,"الزلزلة","Az-Zalzalah","The Earthquake",8,36,158,1,30,1,0],
[100,"العاديات","Al-'Adiyat","The Chargers",11,40,169,0,30,1,0],
[101,"القارعة","Al-Qari'ah","The Striking Hour",11,36,160,0,30,1,0],
[102,"التكاثر","At-Takathur","Competition in Increase",8,28,123,0,30,1,0],
[103,"العصر","Al-'Asr","The Declining Day",3,14,73,0,30,1,0],
[104,"الهمزة","Al-Humazah","The Traducer",9,33,134,0,30,1,0],
[105,"الفيل","Al-Fil","The Elephant",5,23,97,0,30,1,0],
[106,"قريش","Quraysh","Quraysh",4,17,77,0,30,1,0],
[107,"الماعون","Al-Ma'un","Small Kindnesses",7,25,114,0,30,1,0],
[108,"الكوثر","Al-Kawthar","Abundance",3,10,43,0,30,1,0],
[109,"الكافرون","Al-Kafirun","The Disbelievers",6,27,99,0,30,1,0],
[110,"النصر","An-Nasr","The Divine Support",3,19,80,1,30,1,0],
[111,"المسد","Al-Masad","The Palm Fiber",5,23,81,0,30,1,0],
[112,"الإخلاص","Al-Ikhlas","Sincerity",4,15,47,0,30,1,0],
[113,"الفلق","Al-Falaq","The Daybreak",5,23,73,0,30,1,0],
[114,"الناس","An-Nas","Mankind",6,20,80,0,30,1,0],
];

function toSurah(r: R): SurahInfo {
  return {
    id: r[0], nameAr: r[1], nameEn: r[2], meaningEn: r[3],
    verses: r[4], words: r[5], chars: r[6],
    revelation: r[7] === 0 ? "Meccan" : "Medinan",
    juz: r[8], rukus: r[9], sajdah: r[10] === 1,
  };
}

/** All 114 surahs indexed by chapter number (1-based) */
export const SURAHS: SurahInfo[] = D.map(toSurah);

/** Lookup by ID */
export function getSurahById(id: number): SurahInfo | undefined {
  return SURAHS.find(s => s.id === id);
}

/** Surahs sorted by verse count (ascending), then word count */
export function getSurahsSortedByDifficulty(): SurahInfo[] {
  return [...SURAHS].sort((a, b) => a.verses - b.verses || a.words - b.words);
}

/** Surahs for the picker: excludes Al-Fatiha (always first), sorted by difficulty */
export function getPickerSurahs(): SurahInfo[] {
  return getSurahsSortedByDifficulty().filter(s => s.id !== 1);
}
