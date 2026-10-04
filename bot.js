const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');

const TOKEN = '8823868085:AAHCHzchHrz5BKT61qJzQRXnocYH29HuWwY';
const ADMIN = 7452757475;
const bot = new TelegramBot(TOKEN, { polling: true });

let db = {};
try { db = JSON.parse(fs.readFileSync('db.json')) } catch(e){ db = {} }
const save = () => fs.writeFileSync('db.json', JSON.stringify(db,null,2));

bot.onText(/\/start/, (m) => {
  let id = m.from.id;
  if(!db[id]) { db[id] = { pts: 0, num: "", hist: [] }; save(); }
  bot.sendMessage(m.chat.id, `🇱🇰 *ReloadLKR Bot* 🇱🇰

Hello ${m.from.first_name}!

💰 Rate: 10 PTS = Rs 1
🎯 1000 PTS = Rs 100

Commands:
/balance - Check points
/withdraw - Withdraw
/addme POINTS - Add points from website
/history - Withdraw history
/help - Help

Website: reloadlkr.lk`, {parse_mode:"Markdown"});
});

bot.onText(/\/balance/, (m) => {
  let u = db[m.from.id] || { pts: 0 };
  let lkr = Math.floor(u.pts/10);
  bot.sendMessage(m.chat.id, `💰 *BALANCE*

ID: \`${m.from.id}\`
Points: *${u.pts} PTS*
Value: *Rs ${lkr}*

${u.pts>=1000?'✅ You can /withdraw':'❌ Need '+ (1000-u.pts) +' more PTS' }`, {parse_mode:"Markdown"});
});

bot.onText(/\/addme (\d+)/, (m, match) => {
  let pts = parseInt(match[1]);
  let id = m.from.id;
  if(!db[id]) db[id] = { pts:0, hist:[] };
  db[id].pts += pts;
  save();
  bot.sendMessage(m.chat.id, `✅ Added ${pts} PTS! New: ${db[id].pts} PTS = Rs ${Math.floor(db[id].pts/10)}`);
});

bot.onText(/\/withdraw/, (m) => {
  let id = m.from.id;
  let u = db[id];
  if(!u || u.pts < 1000) return bot.sendMessage(m.chat.id, `❌ Need 1000 PTS! You have ${u?u.pts:0}`);

  bot.sendMessage(m.chat.id, `💸 Send your number: 077XXXXXXXX`);

  bot.once('message', (msg) => {
    if(msg.from.id!= id) return;
    let num = msg.text.trim();
    if(!/^0\d{9}$/.test(num)) return bot.sendMessage(id, `❌ Invalid number! Send again with /withdraw`);

    let need = u.pts >= 8000? 8000 : u.pts >= 4000? 4000 : u.pts >= 2000? 2000 : 1000;
    let lkr = need/10;
    u.pts -= need;
    u.hist.push({ num, lkr, date: new Date().toLocaleDateString() });
    save();

    bot.sendMessage(id, `✅ Request Received!\n📱 ${num}\n💰 Rs ${lkr}\n⏳ Will be sent within 24h`);
    bot.sendMessage(ADMIN, `🔥 NEW ORDER\nID: ${id}\nName: ${m.from.first_name}\nNumber: ${num}\nAmount: Rs ${lkr}\nPoints: ${need}`);
  });
});

bot.onText(/\/history/, (m) => {
  let u = db[m.from.id];
  if(!u ||!u.hist.length) return bot.sendMessage(m.chat.id, `No history yet`);
  let t = `📜 History:\n`;
  u.hist.forEach((h,i)=> t+= `${i+1}. Rs${h.lkr} -> ${h.num} (${h.date})\n`);
  bot.sendMessage(m.chat.id, t);
});

bot.onText(/\/addpoints (\d+) (\d+)/, (m, match) => {
  if(m.from.id!= ADMIN) return;
  let uid = match[1], pts = parseInt(match[2]);
  if(!db[uid]) db[uid] = { pts:0, hist:[] };
  db[uid].pts += pts; save();
  bot.sendMessage(m.chat.id, `✅ Added ${pts} to ${uid}. New: ${db[uid].pts}`);
  try{ bot.sendMessage(uid, `🎉 Admin added ${pts} PTS! Total: ${db[uid].pts}`) }catch(e){}
});

bot.onText(/\/setpoints (\d+) (\d+)/, (m, match) => {
  if(m.from.id!= ADMIN) return;
  db[match[1]] = { pts: parseInt(match[2]), hist: [] }; save();
  bot.sendMessage(m.chat.id, `✅ Set ${match[1]} = ${match[2]}`);
});

bot.onText(/\/help/, (m) => {
  bot.sendMessage(m.chat.id, `/balance - Check points\n/withdraw - Withdraw\n/addme POINTS - Add website points\n/history - History`);
});

console.log("BOT RUNNING");