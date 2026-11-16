import React, { useState } from 'react';
import { Smartphone, Download, CheckCircle2, X, Sparkles, ShieldCheck, ExternalLink } from 'lucide-react';
import { soundManager } from '../utils/audio';

export default function InstallAppModal({
  deferredPrompt,
  onInstalled,
  onClose,
  lang = 'ru'
}) {
  const [downloading, setDownloading] = useState(false);
  const [downloadDone, setDownloadDone] = useState(false);

  const handleNativeHomeScreenInstall = async () => {
    const promptObj = deferredPrompt || window.__deferredInstallPrompt;
    if (!promptObj) return false;

    try {
      soundManager.playBeep(1050, 0.08);
      promptObj.prompt();
      const choice = await promptObj.userChoice;
      window.__deferredInstallPrompt = null;
      if (choice && choice.outcome === 'accepted') {
        soundManager.playBeep(1300, 0.15);
        localStorage.setItem('bunker_app_installed', 'true');
        if (onInstalled) onInstalled();
        if (onClose) onClose();
        return true;
      }
    } catch (e) {}
    return false;
  };

  const handleDownloadApkAndInstall = async () => {
    soundManager.playBeep(950, 0.08);

    // 1. Если браузер поддерживает мгновенную установку WebAPK прямо на главный экран телефона — вызываем её сразу!
    const promptObj = deferredPrompt || window.__deferredInstallPrompt;
    if (promptObj) {
      const installedViaPrompt = await handleNativeHomeScreenInstall();
      if (installedViaPrompt) return;
    }

    // 2. Запускаем прямое скачивание подписанного Android-пакета Bunker7.apk (работает во всех мобильных браузерах!)
    setDownloading(true);
    const apkUrl = `${window.location.origin}/Bunker7.apk`;

    try {
      const a = document.createElement('a');
      a.href = apkUrl;
      a.setAttribute('download', 'Bunker7.apk');
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      window.location.href = apkUrl;
    }

    setTimeout(() => {
      setDownloading(false);
      setDownloadDone(true);
      soundManager.playBeep(1250, 0.14);
      // Сохраняем флаг установки, чтобы кнопка «Скачать APK» скрылась после скачивания/установки!
      localStorage.setItem('bunker_app_installed', 'true');
      if (onInstalled) onInstalled();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-zinc-950 border-2 border-emerald-500/70 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-[0_0_50px_rgba(16,185,129,0.3)] text-white relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold block">
                {lang === 'uz' ? 'ANDROID VA BOSHQARUV EKRANI' : lang === 'en' ? 'ANDROID & HOME SCREEN APP' : 'МОБИЛЬНОЕ ПРИЛОЖЕНИЕ • БУНКЕР 7'}
              </span>
              <h2 className="text-base sm:text-lg font-display font-bold text-white">
                {lang === 'uz'
                  ? "Ilovani telefonga o'rnatish"
                  : lang === 'en'
                  ? 'Install Bunker 7 to Phone'
                  : 'Установка на главный экран телефона'}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* App Preview Card */}
        <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-center gap-3.5 mb-4">
          <img
            src="/icon-192.png"
            alt="Бункер 7"
            className="w-14 h-14 rounded-2xl border-2 border-amber-500/60 shadow-lg shrink-0"
          />
          <div className="min-w-0">
            <div className="font-display font-black text-base text-amber-400 flex items-center gap-1.5">
              <span>БУНКЕР 7</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            </div>
            <div className="text-xs font-mono text-zinc-300 mt-0.5">
              {lang === 'uz'
                ? 'Rasmiy Android APK + Bosh ekran yorlig‘i (1.1 MB)'
                : lang === 'en'
                ? 'Official Signed Android APK + Home Screen App (1.1 MB)'
                : 'Официальный Android APK + ярлык на главный экран (1.1 МБ)'}
            </div>
          </div>
        </div>

        {!downloadDone ? (
          <div className="space-y-3">
            {/* Primary Button: Instant Install / Download APK */}
            <button
              type="button"
              onClick={handleDownloadApkAndInstall}
              disabled={downloading}
              className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-black font-display font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(16,185,129,0.4)] transition cursor-pointer"
            >
              <Download className={`w-4 h-4 stroke-[2.5] ${downloading ? 'animate-bounce' : ''}`} />
              <span>
                {downloading
                  ? lang === 'uz'
                    ? 'Yuklanmoqda...'
                    : lang === 'en'
                    ? 'Installing / Downloading...'
                    : 'Скачивание и установка...'
                  : lang === 'uz'
                  ? "📲 TELEFONGA YUKLASH VA O'RNATISH"
                  : lang === 'en'
                  ? '📲 DOWNLOAD APK & ADD TO HOME SCREEN'
                  : '📲 СКАЧАТЬ APK И ВЫВЕСТИ НА ГЛАВНЫЙ ЭКРАН'}
              </span>
            </button>

            <div className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 text-[11px] font-mono text-zinc-400 space-y-1">
              <div className="text-amber-400 font-bold">
                {lang === 'uz'
                  ? '📌 Qanday qilib asosiy ekranga chiqariladi:'
                  : lang === 'en'
                  ? '📌 How it appears on your Home Screen:'
                  : '📌 Как игра появится на главном экране телефона:'}
              </div>
              <div>
                {lang === 'uz'
                  ? "1. Tugmani bosing — «Bunker7.apk» yuklanadi yoki avtomatik o'rnatish oynasi chiqadi."
                  : lang === 'en'
                  ? '1. Tap the button above — either the native Home Screen prompt or Bunker7.apk download will start immediately.'
                  : '1. Нажмите кнопку выше — запустится установка на главный экран или скачивание файла «Bunker7.apk».'}
              </div>
              <div>
                {lang === 'uz'
                  ? "2. Yuklangan faylni ochib «O'rnatish» (Установить) tugmasini bosing — «Бункер 7» belgisi telefoningizning asosiy ekranida paydo bo'ladi!"
                  : lang === 'en'
                  ? '2. Open the downloaded APK and tap "Install" — the Bunker 7 icon will appear right on your phone Home Screen!'
                  : '2. Откройте скачанный файл в уведомлениях и нажмите «Установить» (или в меню браузера ⋮ ➔ «Добавить на гл. экран») — иконка «Бункер 7» сразу появится на главном экране телефона!'}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-emerald-950/50 border-2 border-emerald-500/60 text-center space-y-3 animate-fadeIn">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto animate-bounce" />
            <div className="font-display font-bold text-sm sm:text-base text-emerald-300">
              {lang === 'uz'
                ? "✅ Bunker7.apk yuklandi! Endi uni ochib «O'rnatish» tugmasini bosing!"
                : lang === 'en'
                ? '✅ Bunker7.apk downloaded! Open it from notifications and tap Install!'
                : '✅ Файл Bunker7.apk скачан! Откройте его в шторке уведомлений телефона и нажмите «Установить»!'}
            </div>
            <p className="text-xs font-mono text-zinc-300">
              {lang === 'uz'
                ? "O'rnatilgandan so'ng «Бункер 7» ilovasi telefoningizning asosiy ekranida (рабочий стол) paydo bo'ladi. Yuklash tugmasi menyudan yashirildi!"
                : lang === 'en'
                ? 'Once installed, the Bunker 7 icon will be on your phone Home Screen. The download button has now been hidden!'
                : 'После нажатия «Установить» иконка «Бункер 7» сразу появится на главном экране вашего телефона! Кнопка скачивания теперь скрыта.'}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-display font-bold text-xs uppercase cursor-pointer"
            >
              {lang === 'uz' ? 'Tushunarli' : lang === 'en' ? 'Got it!' : 'Отлично, закрыть'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
