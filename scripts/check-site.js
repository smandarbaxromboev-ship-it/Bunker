// Script for `npm run dev` - checks the game server and opens the browser
const http = require('http');
const { exec, spawn } = require('child_process');
const os = require('os');
const path = require('path');

function getLocalIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return '127.0.0.1';
}

function probeServer(url, timeout = 3000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const req = http.get(url, { timeout }, (res) => {
      resolve({
        statusCode: res.statusCode,
        timeMs: Date.now() - start
      });
    });
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
    req.on('error', (err) => reject(err));
  });
}

function ensureServerRunning() {
  return new Promise(async (resolve) => {
    try {
      const res = await probeServer('http://localhost:3000', 1500);
      resolve(res);
    } catch (e) {
      // Server not running, launch it in background
      console.log('[-] Сервер еще не запущен. Запускаем в фоновом режиме...');
      const serverPath = path.join(__dirname, '..', 'server', 'server.js');
      const child = spawn('node', [serverPath], {
        detached: true,
        stdio: 'ignore',
        cwd: path.join(__dirname, '..')
      });
      child.unref();

      // Wait a moment for server to listen
      for (let i = 0; i < 10; i++) {
        await new Promise(r => setTimeout(r, 600));
        try {
          const res = await probeServer('http://localhost:3000', 1500);
          resolve(res);
          return;
        } catch (err) {}
      }
      resolve(null);
    }
  });
}

async function main() {
  console.log('\n===============================================================');
  console.log('   ☢️ ПРОВЕРКА СТАТУСА: "БУНКЕР: 7 РАУНДОВ ОТКРОВЕНИЙ"');
  console.log('===============================================================');

  const check = await ensureServerRunning();
  const localIp = getLocalIp();

  if (check && (check.statusCode === 200 || check.statusCode === 304)) {
    console.log(` [✔] Статус сервера:         АКТИВЕН И РАБОТАЕТ В ФОНЕ`);
    console.log(` [✔] HTTP Код:               ${check.statusCode} OK`);
    console.log(` [✔] Время отклика:          ${check.timeMs} мс`);
    console.log(` [✔] Локальный адрес (ПК):   http://localhost:3000`);
    console.log(` [✔] Адрес для телефонов:    http://${localIp}:3000`);
    console.log('===============================================================');
    console.log(' [→] Открываю сайт в вашем браузере...');

    // Open browser on Windows
    exec('cmd /c start http://localhost:3000');
    console.log(' [✔] Сайт открыт. Приятной игры в Бункер!\n');
  } else {
    console.log(' [✘] Ошибка: сервер не отвечает на порту 3000.');
    console.log(' [!] Попробуйте запустить вручную: npm start');
    console.log('===============================================================\n');
  }
}

main();

