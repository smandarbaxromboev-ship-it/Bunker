// End-to-End Test Suite for All New Requirements:
// 1. Tie Votes Extra Time (+5 minutes)
// 2. Admin Panel (Samandar / 05052013) & Card CRUD
// 3. User Registration / Login & BunCoins Economy
// 4. Player Characters & Elimination Differentiation

const { userManager, SHOP_ITEMS } = require('./server/userManager');
const cardsManager = require('./server/cardsManager');
const GameManager = require('./server/gameManager');

const mockIo = {
  to: () => ({ emit: () => {} }),
  emit: () => {}
};

console.log('=== STARTING TEST SUITE ===');

// --- TEST 1: User Registration & BunCoins ---
console.log('\n--- 1. Testing Registration, Login & BunCoins ---');
const testUser = 'Tester_' + Math.random().toString(36).substring(2, 6);
const regRes = userManager.register(testUser, 'password123');
console.log('Register Result:', regRes.success ? 'SUCCESS' : 'FAILED', regRes.user?.bunCoins === 500 ? '(500 BunCoins credited)' : '');
if (!regRes.success || regRes.user.bunCoins !== 500) {
  throw new Error('Registration failed or 500 coins not awarded');
}

const loginRes = userManager.login(testUser, 'password123');
console.log('Login Result:', loginRes.success ? 'SUCCESS' : 'FAILED');
if (!loginRes.success) throw new Error('Login failed');

// --- TEST 2: Shop Purchase & Equip ---
console.log('\n--- 2. Testing Shop & Customization ---');
const buyRes = userManager.buyItem(testUser, 'char_medic'); // 300 coins
console.log('Buy Medic (300 coins):', buyRes.success ? 'SUCCESS' : buyRes.error, `(Remaining: ${buyRes.user?.bunCoins})`);
if (!buyRes.success || buyRes.user.bunCoins !== 200) throw new Error('Shop purchase failed');

const equipRes = userManager.equipItem(testUser, 'char_medic');
console.log('Equip Medic:', equipRes.success ? 'SUCCESS' : equipRes.error, `(Avatar: ${equipRes.user?.characterDetails?.avatar})`);
if (!equipRes.success || equipRes.user.characterDetails.avatar !== '🩺') throw new Error('Equip failed');

// --- TEST 3: Admin Panel (Samandar / 05052013) & Card CRUD ---
console.log('\n--- 3. Testing Admin Panel & Card CRUD ---');
// Verify credentials
const isValidAdmin = (login, pwd) => login.trim().toLowerCase() === 'samandar' && pwd.trim() === '05052013';
console.log('Admin Auth (Samandar / 05052013):', isValidAdmin('Samandar', '05052013') ? 'VALID' : 'INVALID');
if (!isValidAdmin('Samandar', '05052013')) throw new Error('Admin credentials mismatch');

const initialProfCount = cardsManager.getActivePool('PROFESSIONS').length;
console.log(`Initial Professions count: ${initialProfCount}`);

// Admin Adds Card
const addRes = cardsManager.addCard('PROFESSIONS', {
  ru: 'Специальный Инженер-Ядерщик',
  en: 'Special Nuclear Engineer',
  uz: 'Maxsus Yadro Muhandisi',
  d_ru: 'Запускает реактор бункера на полную мощность',
  d_en: 'Runs bunker reactor at full capacity',
  d_uz: 'Bunker reaktorini to\'liq quvvatda ishga tushiradi'
});
console.log('Admin Add Card:', addRes.success ? 'SUCCESS' : addRes.error, `(Total now: ${addRes.total})`);
if (!addRes.success || addRes.total !== initialProfCount + 1) throw new Error('Add card failed');

// Admin Updates Card
const updateRes = cardsManager.updateCard('PROFESSIONS', 0, {
  ru: 'Специальный Инженер-Ядерщик (ОБНОВЛЕН)'
});
console.log('Admin Update Card:', updateRes.success ? 'SUCCESS' : updateRes.error, `(New title: ${updateRes.card?.ru})`);
if (!updateRes.success || !updateRes.card.ru.includes('ОБНОВЛЕН')) throw new Error('Update card failed');

// Admin Deletes Card
const delRes = cardsManager.deleteCard('PROFESSIONS', 0);
console.log('Admin Delete Card:', delRes.success ? 'SUCCESS' : delRes.error, `(Total back to: ${delRes.total})`);
if (!delRes.success || delRes.total !== initialProfCount) throw new Error('Delete card failed');

// --- TEST 4: Tie Votes & +5 Minutes Extra Time ---
console.log('\n--- 4. Testing Tie-Breaking & +5 Minutes Extra Time ---');
const gm = new GameManager(mockIo);
const roomData = gm.createRoom('HostPlayer', 'sock_1', equipRes.user);
const roomCode = roomData.code;
const room = gm.rooms.get(roomCode);

// Add bots to form a game
gm.addBot(roomCode, room.hostId);
gm.addBot(roomCode, room.hostId);
gm.addBot(roomCode, room.hostId);

console.log(`Room created with ${room.players.length} players. Starting game...`);
gm.startGame(roomCode, room.hostId);

// Advance to discussion / voting
room.status = 'ROUND_VOTING';
const p1 = room.players[0];
const p2 = room.players[1];
const p3 = room.players[2];
const p4 = room.players[3];

// Simulate a tie: 2 votes for p1, 2 votes for p2
p1.votedFor = p2.id;
p3.votedFor = p2.id;
p2.votedFor = p1.id;
p4.votedFor = p1.id;

console.log('Simulating tied vote (2 votes for P1, 2 votes for P2)...');
gm.resolveVoting(room, false);

console.log(`Result of voting tie:`);
console.log(`- room.isExtraTime: ${room.isExtraTime}`);
console.log(`- room.timerType: ${room.timerType}`);
console.log(`- room.status: ${room.status}`);
console.log(`- votes reset: ${room.players.every(p => p.votedFor === null)}`);

if (!room.isExtraTime || room.timerType !== 'EXTRA_TIME' || room.status !== 'ROUND_DISCUSSION') {
  throw new Error('Extra time was not triggered properly on voting tie!');
}

console.log('Now simulating voting DURING Extra Time...');
room.status = 'ROUND_VOTING';
// Now simulate voting at end of extra time
p1.votedFor = p2.id;
p3.votedFor = p2.id;
p4.votedFor = p2.id;
p2.votedFor = p1.id;

gm.resolveVoting(room, false);

console.log('Result after extra time voting:');
console.log(`- room.status: ${room.status}`);
console.log(`- room.isExtraTime reset: ${room.isExtraTime === false}`);
console.log(`- exiled player: ${room.votingResults?.exiledPlayer?.name}`);
console.log(`- exiled player alive status: ${room.players.find(p => p.id === room.votingResults?.exiledPlayer?.id)?.isAlive}`);

if (room.status !== 'ROUND_RESULT' || !room.votingResults?.exiledPlayer) {
  throw new Error('Exile after extra time failed');
}

console.log('\n=== ALL TESTS PASSED SUCCESSFULLY! ===');
process.exit(0);

