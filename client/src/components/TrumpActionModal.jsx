import React, { useState } from 'react';
import { 
  ShieldAlert, Sparkles, Check, X, Edit3, HeartPulse, 
  Briefcase, Calendar, Backpack, FileText, UserCheck, Shield, Eye, RefreshCw
} from 'lucide-react';
import { getLocalized, translations } from '../utils/translations';
import { soundManager } from '../utils/audio';

const QUICK_PRESETS = {
  ru: {
    age: [
      "21 год (молодой, выносливый)",
      "25 лет (в расцвете сил)",
      "28 лет (отличная физическая форма)",
      "32 года (зрелый и опытный)"
    ],
    health: [
      "Идеальное здоровье космонавта (100%)",
      "Природный иммунитет к радиации и вирусам",
      "Богатырское здоровье, атлетическое тело",
      "Абсолютно здоров, железная нервная система"
    ],
    profession: [
      "Главный хирург-реаниматолог",
      "Инженер ядерных реакторов и энергосистем",
      "Агроном гидропоники и селекционер",
      "Командир отряда спецназа по безопасности"
    ],
    luggage: [
      "Большой ящик хирургических медикаментов и антибиотиков",
      "Тактический автомат с запасом 500 патронов",
      "Дизель-генератор с запасом топлива на месяц",
      "Система фильтрации воды на 100 000 литров и запас еды"
    ],
    hobby: [
      "Спортивная пулевая стрельба (10 из 10)",
      "Таежное выживание и добыча воды",
      "Пайка электроники и ремонт раций",
      "Рукопашный бой и самооборона"
    ],
    fact: [
      "Спас 15 человек из горящего здания",
      "Почетный донор крови (редкая 1-я группа)",
      "Успешно выживал 60 дней в дикой тайге",
      "Знает тайные шифры и резервные склады бункера"
    ]
  },
  en: {
    age: [
      "21 years old (young, strong, high endurance)",
      "25 years old (prime physical condition)",
      "28 years old (athlete stamina)",
      "32 years old (mature and highly experienced)"
    ],
    health: [
      "100% Astronaut Health (zero diseases)",
      "Natural radiation & viral immunity",
      "Iron constitution & Olympic athletic body",
      "Completely healthy, resilient nervous system"
    ],
    profession: [
      "Chief Trauma Surgeon & Resuscitator",
      "Nuclear Reactor & Power Systems Engineer",
      "Hydroponics Agronomist & Seed Breeder",
      "Special Forces Commander & Tactics Specialist"
    ],
    luggage: [
      "Large crate of antibiotics & surgical tools",
      "Tactical assault rifle with 500 rounds",
      "Heavy diesel generator & 1-month fuel cache",
      "100,000L water purification station & MREs"
    ],
    hobby: [
      "Precision target marksmanship (10/10)",
      "Wilderness survival & firecraft",
      "Circuit board soldering & radio repair",
      "Hand-to-hand martial arts combat"
    ],
    fact: [
      "Rescued 15 people from burning building",
      "Honorary emergency blood donor",
      "Survived 60 days alone in wilderness",
      "Knows master passcodes to bunker supply vaults"
    ]
  },
  uz: {
    age: [
      "21 yosh (yosh, baquvvat, kuchli)",
      "25 yosh (kuchga to'lgan davri)",
      "28 yosh (sportcha chidamli tana)",
      "32 yosh (tajribali va yetuk)"
    ],
    health: [
      "100% Fazogirdek a'lo salomatlik (kasalliksiz)",
      "Radiatsiya va viruslarga tabiiy immunitet",
      "Baquvvat salomatlik va atletik tana",
      "Mutlaqo sog'lom, po'latdek asab tizimi"
    ],
    profession: [
      "Bosh jarroh-reanimatolog shifokor",
      "Atom reaktori va energiya tizimlari muhandisi",
      "Gidroponika agronomi va seleksioner",
      "Maxsus xavfsizlik kuchlari komandiri"
    ],
    luggage: [
      "Katta jarrohlik dori-darmonlari va antibiotiklar qutisi",
      "500 ta o'qi bo'lgan taktik avtomat",
      "Bir oylik yonilg'i zaxirasi bo'lgan dizel generatori",
      "100 000 litr suv tozalash filtri va oziq-ovqat"
    ],
    hobby: [
      "Mo'ljalga aniq o'q otish (10 dan 10)",
      "Yovvoyi tabiatda omon qolish va olov yoqish",
      "Elektronika kavsharlash va ratsiya tuzatish",
      "Qo'l jangi va o'zini himoya qilish"
    ],
    fact: [
      "Yonayotgan binodan 15 kishini qutqargan",
      "Faxriy qon donori (kamyob 1-guruh)",
      "Taygada 60 kun bir o'zi omon qolgan",
      "Bunkerning maxfiy kodlari va omborlarini biladi"
    ]
  }
};

export default function TrumpActionModal({ 
  specialCard, 
  myDeck = [], 
  otherPlayers = [], 
  onClose, 
  onApplyTrump, 
  lang = 'ru' 
}) {
  const t = translations[lang] || translations.ru;
  const ability = specialCard?.ability || 'swap_card';

  // Detect if this trump card is restricted to a single specific category (e.g. only hobby, only health, only age, etc.)
  const detectRestrictedCategory = (sc) => {
    if (!sc) return null;
    if (sc.targetCard) return sc.targetCard;
    const text = `${sc.value?.ru || ''} ${sc.value?.en || ''} ${sc.description?.ru || ''}`.toLowerCase();
    if (text.includes('возраст') || text.includes('age') || text.includes('yosh')) return 'age';
    if (text.includes('болезн') || text.includes('здоровь') || text.includes('health') || text.includes('medical') || text.includes('медицинский сканер') || text.includes('salomatlik')) return 'health';
    if (text.includes('професси') || text.includes('profession') || text.includes('kasb')) return 'profession';
    if (text.includes('багаж') || text.includes('груз') || text.includes('luggage') || text.includes('supply') || text.includes('yuk')) return 'luggage';
    if (text.includes('факт') || text.includes('fact') || text.includes('биографи')) return 'fact';
    if (text.includes('хобби') || text.includes('hobby') || text.includes('xobbi')) return 'hobby';
    return null; // null = universal (can rewrite any card)
  };

  const restrictedCategory = detectRestrictedCategory(specialCard);

  // For swap_card / rewrite_card: if restrictedCategory is set, ONLY show that single card!
  const allNonSpecialCards = myDeck.filter(c => c.type !== 'special');
  const otherCards = restrictedCategory
    ? allNonSpecialCards.filter(c => c.id === restrictedCategory)
    : allNonSpecialCards;

  const [selectedCardId, setSelectedCardId] = useState(
    restrictedCategory || otherCards[0]?.id || 'age'
  );
  const [customValue, setCustomValue] = useState('');
  const [customDesc, setCustomDesc] = useState('');

  // For inspect / bodyguard
  const [selectedTargetId, setSelectedTargetId] = useState(otherPlayers[0]?.id || '');
  const [inspectedDeck, setInspectedDeck] = useState(null);
  const [inspectedName, setInspectedName] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const selectedCard = myDeck.find(c => c.id === selectedCardId);
  const presetsByLang = QUICK_PRESETS[lang] || QUICK_PRESETS.ru;

  const handleApply = () => {
    setIsLoading(true);
    setStatusMsg('');

    const payload = {
      ability,
      targetCardId: selectedCardId,
      customValue: customValue.trim(),
      customDesc: customDesc.trim(),
      targetPlayerId: selectedTargetId
    };

    onApplyTrump(payload, (res) => {
      setIsLoading(false);
      if (res?.error) {
        setStatusMsg(`❌ ${res.error}`);
        soundManager.playBeep(400, 0.15);
      } else {
        soundManager.playBeep(900, 0.15);
        if (res?.inspectedPlayer) {
          setInspectedDeck(res.inspectedPlayer.deck);
          setInspectedName(res.inspectedPlayer.name);
          setStatusMsg(lang === 'ru' ? `Досье игрока ${res.inspectedPlayer.name} успешно вскрыто!` : lang === 'uz' ? `${res.inspectedPlayer.name} dosyesi ochildi!` : `Dossier of ${res.inspectedPlayer.name} revealed!`);
        } else {
          setStatusMsg(`✅ ${res?.message || (lang === 'ru' ? 'Козырь успешно активирован!' : lang === 'uz' ? 'Kozir muvaffaqiyatli ishlatildi!' : 'Trump activated successfully!')}`);
          setTimeout(() => {
            onClose();
          }, 1400);
        }
      }
    });
  };

  const cardTitle = getLocalized(specialCard?.value, lang) || t.cardSpecial;
  const cardDescription = getLocalized(specialCard?.description, lang);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-zinc-900 border-2 border-amber-500/80 rounded-3xl max-w-xl w-full max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col justify-between p-4 sm:p-6 text-slate-800 dark:text-zinc-100">
        
        {/* Header */}
        <div>
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/30">
                <ShieldAlert className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-amber-600 dark:text-amber-400">
                  {t.trumpBadge}
                </span>
                <h3 className="text-base sm:text-lg font-display font-bold text-slate-900 dark:text-white leading-tight">
                  {cardTitle}
                </h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-600 dark:hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 text-xs sm:text-sm text-slate-700 dark:text-amber-200/90 leading-relaxed mb-4">
            {cardDescription || (lang === 'ru' ? "Позволяет лично переписать любую плохую характеристику или активировать суперспособность." : lang === 'uz' ? "Har qanday yomon kartani shaxsan qayta yozish yoki qobiliyatni ishlatish imkonini beradi." : "Allows you to rewrite any bad card attribute or activate special powers.")}
          </div>

          {/* ABILITY CONTENT: 1. SWAP / REWRITE CARD */}
          {(ability === 'swap_card' || ability === 'rewrite_card' || ability === 'reroll_self') && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-mono font-bold text-slate-600 dark:text-zinc-400 uppercase block mb-1.5">
                  {restrictedCategory
                    ? (lang === 'uz'
                        ? `1. Ushbu kozir faqat [${getLocalized(otherCards[0]?.name, lang)}] kartasini o'zgartiradi:`
                        : lang === 'en'
                        ? `1. This Trump card modifies ONLY your [${getLocalized(otherCards[0]?.name, lang)}] card:`
                        : `1. Этот козырь изменяет ТОЛЬКО вашу карту [${getLocalized(otherCards[0]?.name, lang)}]:`)
                    : t.trumpStep1}
                </label>
                <div className={`grid ${otherCards.length === 1 ? 'grid-cols-1' : 'grid-cols-2 sm:grid-cols-3'} gap-2`}>
                  {otherCards.map(c => {
                    const isSelected = selectedCardId === c.id;
                    const cTitle = getLocalized(c.name, lang);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          if (!restrictedCategory) {
                            setSelectedCardId(c.id);
                            setCustomValue('');
                          }
                        }}
                        className={`p-2.5 rounded-2xl border text-left transition font-mono text-xs flex flex-col justify-between ${
                          isSelected
                            ? 'bg-amber-500 text-black border-amber-600 font-bold shadow-md shadow-amber-500/20'
                            : 'bg-slate-50 dark:bg-zinc-850 hover:bg-slate-100 dark:hover:bg-zinc-800 border-slate-200 dark:border-zinc-750 text-slate-700 dark:text-zinc-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="truncate block font-semibold">{cTitle}</span>
                          {restrictedCategory && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-black/20 text-black font-mono uppercase">
                              {lang === 'uz' ? 'Qat\'iy' : lang === 'en' ? 'Locked to type' : 'Целевая карта'}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] opacity-75 truncate block mt-0.5">
                          {getLocalized(c.value, lang)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedCard && (
                <div className="p-3 rounded-2xl bg-slate-100 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 text-xs space-y-1">
                  <span className="text-slate-500 dark:text-zinc-400 font-mono block">{t.trumpCurrentVal}</span>
                  <p className="font-bold text-slate-800 dark:text-zinc-200 text-sm">
                    {getLocalized(selectedCard.value, lang)}
                  </p>
                  <p className="text-slate-500 dark:text-zinc-400 italic text-[11px]">
                    {getLocalized(selectedCard.description, lang)}
                  </p>
                </div>
              )}

              <div>
                <label className="text-xs font-mono font-bold text-slate-600 dark:text-zinc-400 uppercase block mb-1.5">
                  {t.trumpStep2}
                </label>
                <input
                  type="text"
                  value={customValue}
                  onChange={(e) => setCustomValue(e.target.value)}
                  placeholder={t.trumpPlaceholderValue}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />

                {/* Quick Presets Pills */}
                {presetsByLang[selectedCardId] && (
                  <div className="mt-2">
                    <span className="text-[10px] font-mono text-slate-400 block mb-1">
                      {t.trumpQuickPresetsLabel}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {presetsByLang[selectedCardId].map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setCustomValue(preset)}
                          className="text-[11px] px-2.5 py-1 rounded-xl bg-slate-200 dark:bg-zinc-800 hover:bg-amber-100 dark:hover:bg-amber-950/40 text-slate-700 dark:text-zinc-300 hover:text-amber-700 dark:hover:text-amber-300 border border-slate-300/60 dark:border-zinc-700 transition"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-mono font-bold text-slate-600 dark:text-zinc-400 uppercase block mb-1.5">
                  {t.trumpStep3}
                </label>
                <input
                  type="text"
                  value={customDesc}
                  onChange={(e) => setCustomDesc(e.target.value)}
                  placeholder={t.trumpPlaceholderDesc}
                  className="w-full px-3.5 py-2 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          )}

          {/* ABILITY CONTENT: 2. IMMUNITY */}
          {ability === 'immunity' && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Shield className="w-5 h-5 text-emerald-500" />
                <span>{lang === 'ru' ? "Абсолютная защита на раунд" : lang === 'uz' ? "Raund uchun to'liq daxlsizlik" : "Full Round Immunity"}</span>
              </div>
              <p className="text-xs leading-relaxed">
                {lang === 'ru' ? "При активации вы получите дипломатический иммунитет. Если на текущем голосовании большинство проголосует против вас, терминал аннулирует результат и вы останетесь в бункере!" : lang === 'uz' ? "Faollashtirilganda siz daxlsizlik olasiz. Agar ko'pchilik sizga qarshi ovoz bersa ham, natija bekor qilinadi va siz bunkerda qolasiz!" : "When activated, you gain diplomatic immunity. Even if the majority votes against you, terminal cancels the exile and you stay in the bunker!"}
              </p>
            </div>
          )}

          {/* ABILITY CONTENT: 3. DOUBLE VOTE */}
          {ability === 'double_vote' && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-800/40 text-amber-800 dark:text-amber-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span>{lang === 'ru' ? "Двойной вес голоса" : lang === 'uz' ? "Ikki barobar ovoz kuchi" : "Double Vote Power"}</span>
              </div>
              <p className="text-xs leading-relaxed">
                {lang === 'ru' ? "Ваш голос против любого кандидата будет посчитан за два полных голоса при подведении итогов раунда." : lang === 'uz' ? "Ovoz berish natijalari hisoblanganda sizning ovozingiz ikkita to'liq ovoz deb hisoblanadi." : "Your vote against any candidate will count as two full votes during this round resolution."}
              </p>
            </div>
          )}

          {/* ABILITY CONTENT: 4. VETO */}
          {ability === 'veto' && (
            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-300 dark:border-red-800/40 text-red-800 dark:text-red-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm">
                <ShieldAlert className="w-5 h-5 text-red-500" />
                <span>{lang === 'ru' ? "Право ВЕТО" : lang === 'uz' ? "Veto Huquqi" : "Veto Power"}</span>
              </div>
              <p className="text-xs leading-relaxed">
                {lang === 'ru' ? "Отменяет изгнание любого кандидата в текущем раунде. Ни один человек не покинет бункер в этот ход!" : lang === 'uz' ? "Joriy raundda istalgan kishining haydalishini bekor qiladi. Hech kim bu navbatda haydalmaydi!" : "Cancels the exile of any candidate in this round. No one will leave the bunker this turn!"}
              </p>
            </div>
          )}

          {/* ABILITY CONTENT: 5. INSPECT / BODYGUARD */}
          {(ability === 'inspect' || ability === 'bodyguard') && (
            <div className="space-y-3">
              <label className="text-xs font-mono font-bold text-slate-600 dark:text-zinc-400 uppercase block">
                {ability === 'inspect' 
                  ? (lang === 'ru' ? 'Выберите цель для взлома досье:' : lang === 'uz' ? "Dosye ko'rish uchun nishonni tanlang:" : "Choose a target to inspect:") 
                  : (lang === 'ru' ? 'Выберите союзника для защиты:' : lang === 'uz' ? "Himoya qilish uchun safdoshni tanlang:" : "Choose an ally to protect:")}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {otherPlayers.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedTargetId(p.id)}
                    className={`p-2.5 rounded-2xl border text-left font-mono text-xs transition flex items-center justify-between ${
                      selectedTargetId === p.id
                        ? 'bg-amber-500 text-black border-amber-600 font-bold'
                        : 'bg-slate-50 dark:bg-zinc-850 hover:bg-slate-100 dark:hover:bg-zinc-800 border-slate-200 dark:border-zinc-750 text-slate-700 dark:text-zinc-300'
                    }`}
                  >
                    <span>{p.name}</span>
                    {selectedTargetId === p.id && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>

              {/* Inspected results if inspect was executed */}
              {inspectedDeck && (
                <div className="mt-3 p-3 rounded-2xl bg-slate-100 dark:bg-zinc-800 border border-amber-500/40 space-y-2">
                  <span className="text-xs font-bold font-mono text-amber-500 block">
                    {lang === 'ru' ? `Досье игрока ${inspectedName}:` : lang === 'uz' ? `${inspectedName} dosyesi:` : `Dossier of ${inspectedName}:`}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                    {inspectedDeck.map((c, idx) => (
                      <div key={idx} className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700">
                        <span className="font-bold text-slate-500 block text-[10px]">{getLocalized(c.name, lang)}:</span>
                        <span className="font-semibold text-amber-600 dark:text-amber-400">{getLocalized(c.value, lang)}</span>
                        <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5">{getLocalized(c.description, lang)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ABILITY CONTENT: 6. REVOTE */}
          {ability === 'revote' && (
            <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/20 border border-purple-300 dark:border-purple-800/40 text-purple-800 dark:text-purple-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm">
                <RefreshCw className="w-5 h-5 text-purple-500" />
                <span>{lang === 'ru' ? "Приказ о немедленном переголосовании" : lang === 'uz' ? "Qayta ovoz berish buyrug'i" : "Order Immediate Revote"}</span>
              </div>
              <p className="text-xs leading-relaxed">
                {lang === 'ru' ? "Сбрасывает все сделанные голоса и начинает процедуру голосования заново с чистого листа." : lang === 'uz' ? "Barcha berilgan ovozlarni bekor qiladi va ovoz berish jarayonini qaytadan boshlaydi." : "Clears all submitted votes and starts the voting process afresh."}
              </p>
            </div>
          )}

          {statusMsg && (
            <div className="mt-3 p-2.5 rounded-xl text-center text-xs font-mono font-bold bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700">
              {statusMsg}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-200 dark:border-zinc-800 pt-4 mt-4 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-2xl text-xs font-bold font-mono text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
          >
            {t.btnCancel}
          </button>
          
          <button
            type="button"
            onClick={handleApply}
            disabled={isLoading || (ability === 'swap_card' && !customValue.trim())}
            className="px-5 py-2.5 rounded-2xl text-xs font-display font-bold bg-amber-500 hover:bg-amber-400 active:scale-95 text-black shadow-md shadow-amber-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>
              {ability === 'swap_card' || ability === 'rewrite_card'
                ? t.btnApplyTrumpSwap
                : t.btnActivateTrumpAbility}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
}
