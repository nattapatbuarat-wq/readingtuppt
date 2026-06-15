// ═══════════════════════════════════════════════
// DATABASE (localStorage)
// ═══════════════════════════════════════════════
const DB = (() => {
  const P = 'rr_';
  const ga = k => { try { return JSON.parse(localStorage.getItem(P+k)) || []; } catch { return []; } };
  const sa = (k,d) => localStorage.setItem(P+k, JSON.stringify(d));
  const gid = () => Date.now().toString(36) + Math.random().toString(36).substr(2,8);

  const getStudents = () => ga('stu');
  const getStudent = id => ga('stu').find(s=>s.id===id);
  const getStudentByCode = c => ga('stu').find(s=>s.studentCode===c);
  const saveStudent = s => { const l=ga('stu'); const i=l.findIndex(x=>x.id===s.id); if(i>=0)l[i]=s; else l.push(s); sa('stu',l); return s; };
  const delStudent = id => sa('stu', ga('stu').filter(s=>s.id!==id));

  const getTeachers = () => ga('tea');
  const getTeacherByPwd = p => ga('tea').find(t=>t.password===p);
  const saveTeacher = t => { const l=ga('tea'); const i=l.findIndex(x=>x.id===t.id); if(i>=0)l[i]=t; else l.push(t); sa('tea',l); return t; };
  const delTeacher = id => sa('tea', ga('tea').filter(t=>t.id!==id));

  const getClasses = () => ga('cls');
  const getClass = id => ga('cls').find(c=>c.id===id);
  const saveClass = c => { const l=ga('cls'); const i=l.findIndex(x=>x.id===c.id); if(i>=0)l[i]=c; else l.push(c); sa('cls',l); return c; };
  const delClass = id => sa('cls', ga('cls').filter(c=>c.id!==id));

  const getAllLogs = () => ga('logs');
  const getLogs = sid => ga('logs').filter(l=>!sid||l.studentId===sid);
  const getLog = id => ga('logs').find(l=>l.id===id);
  const saveLog = l => { if(!l.id)l.id=gid(); if(!l.createdAt)l.createdAt=new Date().toISOString(); l.updatedAt=new Date().toISOString(); const ls=ga('logs'); const i=ls.findIndex(x=>x.id===l.id); if(i>=0)ls[i]=l; else ls.push(l); sa('logs',ls); return l; };
  const delLog = id => sa('logs', ga('logs').filter(l=>l.id!==id));

  const getScore = lid => ga('scores').find(s=>s.logId===lid);
  const saveScore = s => { if(!s.id)s.id=gid(); s.scoredAt=new Date().toISOString(); const l=ga('scores'); const i=l.findIndex(x=>x.id===s.id); if(i>=0)l[i]=s; else l.push(s); sa('scores',l); return s; };


  const getSettings = () => JSON.parse(localStorage.getItem(P+'cfg')||'null') || {schoolName:'โรงเรียนเตรียมอุดมศึกษาพัฒนาการ ปทุมธานี',academicYear:'2569'};
  const saveSettings = s => localStorage.setItem(P+'cfg', JSON.stringify(s));
  const getNotifySettings = () => {
    const saved = JSON.parse(localStorage.getItem(P+'notify')||'null') || {};
    const levels = ['ม.1','ม.2','ม.3','ม.4','ม.5','ม.6'];
    const out = {};
    levels.forEach(lv => {
      const old = saved[lv] || {};
      const hidden = old.hiddenRooms || [];
      const savedRooms = Array.isArray(old.rooms) ? old.rooms : [];
      const classRooms = getClasses()
        .filter(c=>c.level===lv)
        .map(c=>({id:c.id,room:String(c.room),name:`${lv}/${c.room}`,telegramBotToken:'',telegramWebhook:'',telegramChatId:''}));
      const merged = [...classRooms, ...savedRooms]
        .filter(r=>r && !hidden.includes(String(r.room)))
        .reduce((acc,r)=>{
          const key=String(r.room||r.name||r.id);
          acc[key]={
            id:r.id||`${lv}_${key}`,room:key,name:r.name||`${lv}/${key}`,
            telegramBotToken:r.telegramBotToken||'',
            telegramWebhook:r.telegramWebhook||'',
            telegramChatId:r.telegramChatId||''
          };
          return acc;
        },{});
      out[lv] = {
        telegramBotToken: old.telegramBotToken || '',
        telegramWebhook: old.telegramWebhook || '',
        telegramChatId: old.telegramChatId || '',
        hiddenRooms: hidden,
        rooms: Object.values(merged).sort((a,b)=>parseInt(a.room||0)-parseInt(b.room||0))
      };
    });
    return out;
  };
  const saveNotifySettings = s => localStorage.setItem(P+'notify', JSON.stringify(s));

  const getSession = () => JSON.parse(sessionStorage.getItem(P+'sess')||'null');
  const setSession = d => sessionStorage.setItem(P+'sess', JSON.stringify(d));
  const clearSession = () => sessionStorage.removeItem(P+'sess');

  const getAnnounce = () => localStorage.getItem(P+'ann') || 'ยินดีต้อนรับนักเรียนทุกคนเข้าสู่ระบบบันทึกรักการอ่าน ร่วมสร้างนิสัยรักการอ่านเพื่ออนาคตที่สดใส';
  const saveAnnounce = txt => localStorage.setItem(P+'ann', txt);

  const computeBadges = sid => {
    const logs = getLogs(sid).filter(l=>l.status==='approved');
    const n = logs.length, pg = logs.reduce((s,l)=>s+(parseInt(l.pages)||0),0);
    const b = [];
    if(n>=1) b.push({icon:'📚',label:'นักอ่านหน้าใหม่'});
    if(n>=5) b.push({icon:'📖',label:'นักอ่านดีเด่น'});
    if(n>=10) b.push({icon:'🏆',label:'นักอ่านทองคำ'});
    if(n>=20) b.push({icon:'👑',label:'นักอ่านยอดเยี่ยม'});
    if(pg>=1000) b.push({icon:'🔥',label:'อ่านต่อเนื่อง 1,000 หน้า'});
    return b;
  };

  const seedDefaults = () => {
    if(!ga('cls').length) {
      const cs=[];
      ['ม.1','ม.2','ม.3','ม.4','ม.5','ม.6'].forEach((lv,li)=>{
        for(let r=1;r<=15;r++) cs.push({id:`C${li+1}_${r}`,level:lv,room:r,name:`${lv}/${r}`});
      });
      sa('cls',cs);
    }
  };
  return {gid,getStudents,getStudent,getStudentByCode,saveStudent,delStudent,getTeachers,getTeacherByPwd,saveTeacher,delTeacher,getClasses,getClass,saveClass,delClass,getAllLogs,getLogs,getLog,saveLog,delLog,getScore,saveScore,getSettings,saveSettings,getNotifySettings,saveNotifySettings,getSession,setSession,clearSession,computeBadges,seedDefaults,getAnnounce,saveAnnounce};
})();

// ═══════════════════════════════════════════════
// UTILS
// ═══════════════════════════════════════════════
const esc = s => (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const fmtDate = iso => { if(!iso) return '-'; try { return new Date(iso).toLocaleDateString('th-TH',{year:'numeric',month:'long',day:'numeric'}); } catch { return iso; } };
const fitText = (s, max=480) => {
  const t = String(s||'').replace(/\s+/g,' ').trim();
  return esc(t.length>max ? t.slice(0,max-1)+'…' : t);
};
function splitReadTime(t){
  const txt = String(t||'');
  const nums = txt.match(/\d+/g)||[];
  if(nums.length>=2) return {hours:nums[0],minutes:nums[1]};
  if(/นาที/.test(txt)) return {hours:'0',minutes:nums[0]||''};
  if(/ชั่วโมง/.test(txt)) return {hours:nums[0]||'',minutes:'0'};
  return {hours:txt,minutes:''};
}

function toast(msg, type='ok') {
  const t = document.createElement('div');
  t.className = `toast t-${type}`;
  t.textContent = msg;
  document.getElementById('tc').appendChild(t);
  setTimeout(()=>t.classList.add('show'),10);
  setTimeout(()=>{ t.classList.remove('show'); setTimeout(()=>t.remove(),300); },3000);
}

let _modal = null;
function modal(title, html, onOk=null) {
  if(_modal) _modal.remove();
  const ov = document.createElement('div');
  ov.className = 'mo';
  ov.innerHTML = `<div class="mb"><div class="mh"><span class="mt2">${title}</span><button class="mc2" id="mc">✕</button></div><div class="mbody">${html}</div>${onOk?`<div class="mf"><button class="btn btn-ghost btn-sm" id="m-cancel">ยกเลิก</button><button class="btn btn-primary btn-sm" id="m-ok">ยืนยัน</button></div>`:''}</div>`;
  document.body.appendChild(ov);
  _modal = ov;
  setTimeout(()=>ov.classList.add('show'),10);
  const close = () => { ov.classList.remove('show'); setTimeout(()=>{ ov.remove(); _modal=null; },300); };
  ov.querySelector('#mc').onclick = close;
  ov.onclick = e => { if(e.target===ov) close(); };
  if(onOk) {
    ov.querySelector('#m-cancel').onclick = close;
    ov.querySelector('#m-ok').onclick = () => { if(onOk()!==false) close(); };
  }
  return { close };
}

function confirm2(msg, cb) {
  modal('ยืนยัน', `<p style="text-align:center;font-size:1rem;padding:.5rem 0">${msg}</p>`, () => { cb(); });
}

// TELEGRAM NOTIFICATION (BY CLASS LEVEL / ROOM)
function parseTelegramBotToken(v){
  const s=String(v||'').trim();
  if(!s) return '';
  const m=s.match(/bot([^/\s]+)/i);
  if(m) return m[1];
  if(!/^https?:\/\//i.test(s)) return s;
  return '';
}
function resolveNotifyConfig(st){
  const lv=st.classLevel||'ไม่ระบุ';
  const levelCfg=DB.getNotifySettings()[lv]||{};
  const roomNo=String(st.classRoom||'');
  const roomCfg=(levelCfg.rooms||[]).find(r=>String(r.room)===roomNo||r.name===`${lv}/${roomNo}`)||{};
  const pick=k=>(roomCfg[k]||levelCfg[k]||'').trim();
  return {
    telegramBotToken:parseTelegramBotToken(pick('telegramBotToken')||pick('telegramWebhook')),
    telegramChatId:pick('telegramChatId')
  };
}
function buildNotifyMessage(st, log, event='submit'){
  const name=st?.name||'ไม่ระบุชื่อ';
  const lv=st?.classLevel||'-';
  const room=st?.classRoom||'-';
  const num=st?.number||'-';
  const book=log?.bookTitle||'-';
  const date=log?.readDate?fmtDate(log.readDate):fmtDate(new Date().toISOString());
  if(event==='approved'){
    return `✅ ครูอนุมัติบันทึกแล้ว\nชื่อ-นามสกุล: ${name}\nชั้น ${lv}/${room} เลขที่ ${num}\nหนังสือ: ${book}\nวันที่ส่งงาน: ${date}`;
  }
  if(event==='rejected'){
    return `❌ บันทึกไม่ผ่านการตรวจ\nชื่อ-นามสกุล: ${name}\nชั้น ${lv}/${room} เลขที่ ${num}\nหนังสือ: ${book}\nวันที่ส่งงาน: ${date}`;
  }
  return `📚 ส่งบันทึกรักการอ่านแล้ว\nชื่อ-นามสกุล: ${name}\nชั้น ${lv}/${room} เลขที่ ${num}\nหนังสือ: ${book}\nวันที่อ่าน: ${date}\nสถานะ: รอครูตรวจ`;
}
async function sendTelegramMessage(botToken, chatId, text){
  if(!botToken||!chatId) return false;
  const url=`https://api.telegram.org/bot${encodeURIComponent(botToken)}/sendMessage?chat_id=${encodeURIComponent(chatId)}&text=${encodeURIComponent(text)}`;
  try{ await fetch(url,{method:'GET',mode:'no-cors'}); return true; }catch{ return false; }
}
async function sendNotifications(st, log, event='submit'){
  const cfg=resolveNotifyConfig(st);
  const msg=buildNotifyMessage(st,log,event);
  const telegram=!!(cfg.telegramBotToken&&cfg.telegramChatId)
    && await sendTelegramMessage(cfg.telegramBotToken,cfg.telegramChatId,msg);
  console.log('[Notify]',event,msg,{telegram},cfg);
  return {msg,telegram,cfg};
}
async function triggerNotification(st, log){
  const {telegram,cfg}=await sendNotifications(st,log,'submit');
  if(cfg.telegramBotToken&&cfg.telegramChatId){
    toast(`🔔 ส่งแจ้งเตือน Telegram แล้ว${telegram?' ✓':''}`,'ok');
  }else{
    toast(`🔔 บันทึกแล้ว (ยังไม่ตั้งค่า Telegram ห้อง ${st.classLevel}/${st.classRoom})`,'ok');
  }
}
async function testNotifyLevel(lv, room=''){
  saveNotifyForm(false);
  const cfgAll=DB.getNotifySettings()[lv]||{};
  const roomCfg=room?(cfgAll.rooms||[]).find(r=>String(r.room)===String(room)):null;
  const pick=k=>((roomCfg&&roomCfg[k])||cfgAll[k]||'').trim();
  const botToken=parseTelegramBotToken(pick('telegramBotToken')||pick('telegramWebhook'));
  const chatId=pick('telegramChatId');
  if(!botToken||!chatId){
    toast('กรุณากรอก Telegram Bot Token และ Chat ID แล้วบันทึกก่อนทดสอบ','er');
    return;
  }
  const sample={
    name:'เด็กชายทดสอบ ระบบแจ้งเตือน',
    classLevel:lv,classRoom:room||'1',number:'99'
  };
  const sampleLog={bookTitle:'หนังสือตัวอย่าง',readDate:new Date().toISOString().slice(0,10)};
  const msg=buildNotifyMessage(sample,sampleLog,'submit');
  const ok=await sendTelegramMessage(botToken,chatId,msg);
  toast(`ทดสอบ ${lv}${room?'/'+room:''} → Telegram${ok?' ✓':' ✗'}`, ok?'ok':'er');
}
function notifyFieldsHtml(cfg, clsPrefix){
  return `
    <div class="fr">
      <div class="fg"><label>Telegram Bot Token</label><input type="text" class="fi ${clsPrefix}-tg-token" value="${esc(cfg.telegramBotToken||parseTelegramBotToken(cfg.telegramWebhook||''))}" placeholder="123456789:ABC..."></div>
      <div class="fg"><label>Telegram Chat ID</label><input type="text" class="fi ${clsPrefix}-tg-chat" value="${esc(cfg.telegramChatId||'')}" placeholder="-100xxxxxxxxxx"></div>
    </div>`;
}

// ═══════════════════════════════════════════════
// ROUTER
// ═══════════════════════════════════════════════
const Router = (() => {
  const routes = {};
  const reg = (n,fn) => routes[n]=fn;
  const go = (n,p={}) => { const fn=routes[n]; if(!fn) return; document.getElementById('app').innerHTML=''; fn(p); window.scrollTo(0,0); };
  return { reg, go };
})();

// ═══════════════════════════════════════════════
// SIDEBAR
// ═══════════════════════════════════════════════
function sidebar(links, active) {
  const s = DB.getSession();
  const el = document.createElement('aside');
  el.className = 'sidebar';
  el.innerHTML = `
    <div class="sidebar-logo">
      <div style="font-size:2rem">📚</div>
      <div style="font-size:.78rem;color:var(--purple);font-weight:700;line-height:1.3">บันทึกรักการอ่าน</div>
    </div>
    <nav class="sidebar-nav">
      ${links.map(l=>`<button class="sl ${l.id===active?'active':''}" data-r="${l.id}">${l.icon} ${l.label}</button>`).join('')}
    </nav>
    <div class="sidebar-footer">
      <div style="margin-bottom:.4rem; font-weight:700;">${esc(s?.name||'')}</div>
      <button class="btn btn-ghost btn-sm" id="sb-logout" style="margin-bottom:0.5rem">ออกจากระบบ</button>
      <div style="font-size:11px; color:var(--gray-500); border-top:1px solid var(--gray-100); padding-top:5px; line-height:1.2;">
        สร้าง: นายณัฐภัทร บัวราช ม.5/5
      </div>
    </div>`;
  document.getElementById('app').appendChild(el);
  el.querySelectorAll('.sl').forEach(b=>b.onclick=()=>Router.go(b.dataset.r));
  el.querySelector('#sb-logout').onclick = () => confirm2('ต้องการออกจากระบบ?',()=>{ DB.clearSession(); Router.go('home'); });
  return el;
}

function layout(links, active) {
  const app = document.getElementById('app');
  app.innerHTML=''; app.className='layout';
  sidebar(links, active);
  const m = document.createElement('main');
  m.className='main'; m.id='main';
  app.appendChild(m);
  return m;
}

// ═══════════════════════════════════════════════
// HOME + LOGIN
// ═══════════════════════════════════════════════
function pageHome() {
  const app = document.getElementById('app');
  app.className=''; app.innerHTML=`
    <div class="home-wrap">
      <div class="home-bg" style="background-image:url('https://cdn.phototourl.com/free/2026-06-09-ab181203-5158-4080-9124-effda93a4aa1.jpg')"></div>
      <div class="home-ov"></div>
      <div class="home-cnt">
        <img src="https://cdn.phototourl.com/free/2026-06-09-2b536f99-b460-4dd1-948f-8603932c1318.jpg" class="home-logo" alt="โลโก้" onerror="this.style.display='none'">
        <h1 class="home-t1" style="font-size:2.2rem">บันทึกรักการอ่าน</h1>
        <p class="home-t2">กลุ่มสาระการเรียนรู้ภาษาไทย</p>
        <p class="home-t3">โรงเรียนเตรียมอุดมศึกษาพัฒนาการ ปทุมธานี</p>
        <button class="btn-home" id="h-stu">📚 คลิกเพื่อเข้าสู่ระบบ</button>
        <div class="home-row">
          <button class="btn-gw" id="h-tea">👩‍🏫 ครูเข้าสู่ระบบ</button>
          <button class="btn-gw" id="h-adm">⚙️ ผู้ดูแลระบบ</button>
        </div>
        <div style="margin-top: 2rem; color: rgba(255,255,255,0.7); font-size: 0.85rem; font-weight:500;">
                  </div>
      </div>
    </div>`;
  document.getElementById('h-stu').onclick = () => Router.go('student-login');
  document.getElementById('h-tea').onclick = () => {
    modal('👩‍🏫 ครูเข้าสู่ระบบ',`<div class="fg"><label>รหัสผ่าน</label><input class="fi" type="password" id="tp" placeholder="passwords"></div><div id="te" class="err" style="display:none"></div>`,()=>{
      const p=document.getElementById('tp').value.trim();
      const t=DB.getTeacherByPwd(p);
      if(t){ DB.setSession({role:'teacher',id:t.id,name:t.name}); toast('ยินดีต้อนรับ '+t.name); Router.go('teacher-review'); }
      else{ document.getElementById('te').textContent='รหัสผ่านไม่ถูกต้อง'; document.getElementById('te').style.display='block'; return false; }
    });
  };
  document.getElementById('h-adm').onclick = () => {
    modal('⚙️ ผู้ดูแลระบบ',`<div class="fg"><label>รหัสผ่าน</label><input class="fi" type="password" id="ap" placeholder="passwords"></div><div id="ae" class="err" style="display:none"></div>`,()=>{
      const p=document.getElementById('ap').value.trim();
      if(p===DB.getSettings().adminPassword){ DB.setSession({role:'admin',name:'ผู้ดูแลระบบ'}); toast('ยินดีต้อนรับ'); Router.go('admin-dashboard'); }
      else{ document.getElementById('ae').textContent='รหัสผ่านไม่ถูกต้อง'; document.getElementById('ae').style.display='block'; return false; }
    });
  };
}

function pageStudentLogin() {
  const app=document.getElementById('app'); app.className=''; app.innerHTML=`
    <div class="login-wrap">
      <div class="login-card">
        <div class="login-icon">📚</div>
        <h2 class="login-title">เข้าสู่ระบบนักเรียน</h2>
        <p class="login-desc">กรอกรหัสนักเรียน 5 หลัก</p>
        <div class="level-chips">
          ${['ม.1','ม.2','ม.3','ม.4','ม.5','ม.6'].map((l,i)=>{const cs=['c-pk','c-bl','c-gr','c-pu','c-or','c-tl'];return `<span class="lchip ${cs[i]}">${l}</span>`}).join('')}
        </div>
        <div class="fg"><input type="text" id="sc" class="fi fi-lg" maxlength="5" placeholder="เช่น 12345" inputmode="numeric"></div>
        <div id="se" class="err" style="display:none"></div>
        <button class="btn btn-primary btn-block" id="s-login">เข้าสู่ระบบ →</button>
        <button class="btn btn-ghost btn-block" onclick="Router.go('home')">← กลับ</button>
      </div>
    </div>`;
  const inp = document.getElementById('sc');
  inp.focus();
  inp.oninput = () => inp.value = inp.value.replace(/\D/g,'').slice(0,5);
  document.getElementById('s-login').onclick = () => {
    const code = inp.value.trim();
    const err = document.getElementById('se');
    if(!/^\d{5}$/.test(code)){ err.textContent='รหัสต้องเป็นตัวเลข 5 หลัก'; err.style.display='block'; return; }
    
    let st = DB.getStudentByCode(code);
    if(!st || !st.name || st.name.startsWith('นักเรียน ') || !st.classLevel || !st.classRoom){
      // First Login or incomplete registration data -> enforce Profile Form Wizard
      openFirstTimeSetupForm(code);
    } else {
      DB.setSession({role:'student',id:st.id,studentCode:code,name:st.name});
      toast('ยินดีต้อนรับ 👋');
      Router.go('student-notebook');
    }
  };
}

function openFirstTimeSetupForm(code) {
  const classes = DB.getClasses();
  const levels = [...new Set(classes.map(c=>c.level))];
  let currentStudent = DB.getStudentByCode(code) || { id: DB.gid(), studentCode: code };

  const html = `
    <p style="color:var(--purple); font-weight:700; margin-bottom:1rem; font-size:0.9rem;">
      ✅ เข้าระบบครั้งแรก กรุณากรอกข้อมูลส่วนตัวเพื่อเปิดใช้งานสมุดบันทึก
    </p>
    <div class="fg"><label>รหัสนักเรียน</label><input class="fi" value="${code}" disabled></div>
    <div class="fg"><label>✅ กรอกชื่อ-นามสกุล *</label><input type="text" id="f-reg-name" class="fi" value="${esc(currentStudent.name||'')}" placeholder="เด็กชาย / เด็กหญิง / นาย / นางสาว"></div>
    <div class="fr">
      <div class="fg"><label>✅ เลือกระดับชั้น *</label>
        <select id="f-reg-lv" class="fs">
          <option value="">เลือกชั้น</option>
          ${levels.map(l=>`<option value="${l}"${currentStudent.classLevel===l?' selected':''}>${l}</option>`).join('')}
        </select>
      </div>
      <div class="fg"><label>✅ เลือกห้อง *</label>
        <select id="f-reg-rm" class="fs">
          <option value="">เลือกห้อง</option>
          ${classes.filter(c=>c.level===currentStudent.classLevel).map(c=>`<option value="${c.id}"${currentStudent.classId===c.id?' selected':''}>${c.room}</option>`).join('')}
        </select>
      </div>
      <div class="fg"><label>✅ เลขที่ *</label><input type="number" id="f-reg-num" class="fi" min="1" max="60" value="${esc(currentStudent.number||'')}" placeholder="เช่น 1"></div>
    </div>
    <div id="f-reg-err" class="err" style="display:none"></div>
  `;

  modal('✨ ลงทะเบียนใช้งานระบบครั้งแรก', html, () => {
    const name = document.getElementById('f-reg-name').value.trim();
    const lv = document.getElementById('f-reg-lv').value;
    const cid = document.getElementById('f-reg-rm').value;
    const num = document.getElementById('f-reg-num').value.trim();
    const regErr = document.getElementById('f-reg-err');

    if(!name || !lv || !cid || !num) {
      regErr.textContent = 'กรุณากรอกข้อมูลส่วนตัวให้ครบถ้วนทุกช่องเพื่อบันทึกระบบ';
      regErr.style.display = 'block';
      return false;
    }

    const cls = DB.getClass(cid);
    currentStudent.name = name;
    currentStudent.classId = cid;
    currentStudent.classLevel = lv;
    currentStudent.classRoom = cls ? cls.room : '';
    currentStudent.number = num;
    currentStudent.academicYear = DB.getSettings().academicYear;
    currentStudent.createdAt = new Date().toISOString();

    DB.saveStudent(currentStudent);
    DB.setSession({role:'student',id:currentStudent.id,studentCode:code,name:name});
    toast('ลงทะเบียนและเข้าสู่ระบบสำเร็จ! 🎉');
    Router.go('student-notebook');
  });

  setTimeout(() => {
    document.getElementById('f-reg-lv').onchange = function() {
      const rm = document.getElementById('f-reg-rm');
      rm.innerHTML = '<option value="">เลือกห้อง</option>' + classes.filter(c=>c.level===this.value).map(c=>`<option value="${c.id}">${c.room}</option>`).join('');
    };
  }, 150);
}

// ═══════════════════════════════════════════════
// STUDENT PAGES
// ═══════════════════════════════════════════════
const STU_LINKS = [{id:'student-notebook',icon:'📓',label:'สมุดบันทึก'},{id:'student-dashboard',icon:'📊',label:'สถิติของฉัน'},{id:'student-history',icon:'📋',label:'ประวัติการอ่าน'},{id:'student-profile',icon:'👤',label:'ข้อมูลของฉัน'}];
const CATS = [{c:'000',l:'ความรู้ทั่วไป/คอมพิวเตอร์'},{c:'100',l:'ปรัชญาและจิตวิทยา'},{c:'200',l:'ศาสนา'},{c:'300',l:'สังคมศาสตร์'},{c:'400',l:'ภาษา'},{c:'500',l:'วิทยาศาสตร์'},{c:'600',l:'เทคโนโลยี'},{c:'700',l:'ศิลปะ/นันทนาการ'},{c:'800',l:'วรรณกรรม'},{c:'900',l:'ประวัติศาสตร์/ภูมิศาสตร์'}];

function pageNotebook() {
  const sess = DB.getSession(); if(!sess||sess.role!=='student'){Router.go('home');return;}
  const st = DB.getStudent(sess.id);
  const m = layout(STU_LINKS,'student-notebook');
  const cfg = DB.getSettings();
  const cls = st.classId ? DB.getClass(st.classId) : null;
  const prAnnounce = DB.getAnnounce();

  m.innerHTML = `
    <!-- PR Public Announcement Area -->
    <div class="pc" style="background: linear-gradient(135deg, var(--orange-light), #fffbeb); border: 1.5px dashed var(--orange); padding: 1rem; border-radius: var(--radius); margin-bottom: 1.2rem;">
      <h4 style="color: var(--orange); font-weight: 800; display:flex; align-items:center; gap:0.3rem; font-size:0.95rem;">📢 ประชาสัมพันธ์จากคุณครู</h4>
      <p style="font-size: 0.88rem; color: var(--gray-700); font-weight: 500; margin-top: 0.2rem;">${esc(prAnnounce)}</p>
    </div>

    <div class="ph">
      <div class="pt">📓 สมุดบันทึกรักการอ่าน ✨</div>
      <div class="pm">
        <span class="mc">👤 ${esc(st.name)}</span>
        <span class="mc">🏫 ชั้น ${cls?cls.name:'ยังไม่ระบุชั้นเรียน'}</span>
        ${st.number?`<span class="mc">เลขที่ ${st.number}</span>`:''}
        <span class="mc">📅 ปีการศึกษา ${cfg.academicYear}</span>
      </div>
    </div>
    <div class="acc-group">
      <div class="acc-item" id="a1"><button class="acc-btn" onclick="toggleAcc('a1')"><span>📌 คำนำ</span><span class="acc-arr">▼</span></button><div class="acc-body">โครงการบันทึกรักการอ่านมุ่งส่งเสริมนิสัยรักการอ่านให้แก่นักเรียน โดยให้นักเรียนบันทึกหนังสือที่อ่านในแต่ละครั้ง เพื่อพัฒนาทักษะการอ่าน การคิดวิเคราะห์ และการสรุปความ อันเป็นพื้นฐานสำคัญของการเรียนรู้ตลอดชีวิต</div></div>
      <div class="acc-item" id="a2"><button class="acc-btn" onclick="toggleAcc('a2')"><span>📖 โครงการส่งเสริมนิสัยรักการอ่าน</span><span class="acc-arr">▼</span></button><div class="acc-body">กลุ่มสาระการเรียนรู้ภาษาไทย โรงเรียนเตรียมอุดมศึกษาพัฒนาการ ปทุมธานี ได้จัดทำโครงการนี้เพื่อปลูกฝังให้นักเรียนมีนิสัยรักการอ่าน อ่านหนังสืออย่างสม่ำเสมอ และสามารถนำความรู้จากการอ่านมาปรับใช้ในชีวิตประจำวัน</div></div>
      <div class="acc-item" id="a3"><button class="acc-btn" onclick="toggleAcc('a3')"><span>💡 เทคนิคการเป็นนักอ่านที่ดี</span><span class="acc-arr">▼</span></button><div class="acc-body"><ul style="padding-left:1.2rem;line-height:2"><li>ระบุเล่มที่ ๑–๓๐ เรียงตามลำดับ</li><li>ระบุ วันเดือน ปีที่บันทึก</li><li>ระบุแหล่งที่มาของหนังสือ</li><li>บันทึกการอ่านสรุปเป็นข้อความ</li><li>ใช้คำบอกภาษาของผู้บันทึกเอง</li><li>เลือกหนังสือที่ไม่ใช่หนังสือเรียน</li></ul></div></div>
    </div>
    <div id="logs-area"></div>
    <div style="text-align:center;margin:1.2rem 0"><button class="btn btn-success btn-lg" id="add-log-btn">➕ บันทึกการอ่าน</button></div>
    <div class="pc c-pk" style="margin-top:.5rem">
      <h3 style="font-weight:800;margin-bottom:.3rem">❤️ หนังสือเล่มโปรด ✨</h3>
      <p id="fav-disp" style="margin-bottom:.6rem">${esc(st.favoriteBook||'ยังไม่ได้ระบุ')}</p>
      <button class="btn btn-sm btn-outline" id="fav-btn">แก้ไข</button>
    </div>
    `;
  loadLogs();
  document.getElementById('add-log-btn').onclick = () => openLogForm();
  document.getElementById('fav-btn').onclick = () => {
    modal('❤️ หนังสือเล่มโปรด',`<div class="fg"><label>หนังสือที่ชอบที่สุด</label><input class="fi" type="text" id="fav-in" value="${esc(st.favoriteBook||'')}" placeholder="ชื่อหนังสือ"></div>`,()=>{
      const v=document.getElementById('fav-in').value.trim();
      st.favoriteBook=v; DB.saveStudent(st);
      document.getElementById('fav-disp').textContent=v||'ยังไม่ได้ระบุ';
      toast('บันทึกแล้ว');
    });
  };
}

function loadLogs() {
  const sess = DB.getSession();
  const logs = DB.getLogs(sess.id).sort((a,b)=>(a.order||0)-(b.order||0));
  const el = document.getElementById('logs-area'); if(!el) return;
  if(!logs.length){ el.innerHTML=`<div class="empty">📭 ยังไม่มีบันทึกการอ่าน</div>`; return; }
  el.innerHTML = logs.map((l,i)=>{
    const sc = DB.getScore(l.id);
    const badge = l.status==='approved'?'<span class="badge b-ok">✅ อนุมัติ</span>':l.status==='rejected'?'<span class="badge b-no">❌ ไม่อนุมัติ</span>':'<span class="badge b-wait">⏳ รอตรวจ</span>';
    return `<div class="log-card">
      <div class="lc-head">
        <span class="lc-num">ครั้งที่ ${l.order||i+1}</span>
        ${badge}
        <div class="lc-acts">
          <button class="btn btn-sm btn-outline" onclick="editLog('${l.id}')">✏️ แก้ไข</button>
          <button class="btn btn-sm btn-do" onclick="delLogBtn('${l.id}')">🗑️</button>
        </div>
      </div>
      <div class="lc-body">
        ${l.coverImage?`<img src="${esc(l.coverImage)}" class="book-cov" alt="ปก" onerror="this.style.display='none'">`:'' }
        <div style="flex:1;min-width:0">
          <div class="log-title">${esc(l.bookTitle||'-')}</div>
          <div class="log-meta">
            <span>👤 ${esc(l.author||'-')}</span>
            <span>📅 ${fmtDate(l.readDate)}</span>
            <span>📄 ${l.pages||0} หน้า</span>
            <span>⏱ ${esc(l.readTime||'-')}</span>
          </div>
          ${sc?`<div class="score-sec"><span style="font-size:1rem">${'⭐'.repeat(sc.stars||0)}</span><span style="font-size:.82rem">คะแนน: <strong>${sc.points}/10</strong></span>${sc.comment?`<div class="score-cmt">💬 ${esc(sc.comment)}</div>`:''}</div>`:''}
        </div>
      </div>
    </div>`;
  }).join('');
}

function openLogForm(logId=null) {
  const sess = DB.getSession();
  const log = logId ? DB.getLog(logId) : null;
  const logs = DB.getLogs(sess.id);
  const st = DB.getStudent(sess.id);
  const nextN = logs.length ? Math.max(...logs.map(l=>l.order||0))+1 : 1;
  
  const html = `
    <p style="color:var(--red); font-size:11px; margin-bottom:0.5rem; font-weight:700;">⚠️ แก้ไขบันทึกการอ่าน: ต้องใส่ข้อมูลให้ครบถ้วนสมบูรณ์ทุกช่อง</p>
    <div class="fr">
      <div class="fg"><label>ครั้งที่ *</label><input type="number" id="f-ord" class="fi" value="${log?.order||nextN}" min="1"></div>
      <div class="fg"><label>วันที่อ่าน *</label><input type="date" id="f-date" class="fi" value="${log?.readDate||''}"></div>
    </div>
    <div class="fg"><label>ชื่อหนังสือ *</label><input type="text" id="f-title" class="fi" value="${esc(log?.bookTitle||'')}" placeholder="ชื่อหนังสือ"></div>
    <div class="fr">
      <div class="fg"><label>ผู้แต่ง *</label><input type="text" id="f-auth" class="fi" value="${esc(log?.author||'')}" placeholder="ระบุชื่อผู้แต่ง"></div>
      <div class="fg"><label>สำนักพิมพ์ *</label><input type="text" id="f-pub" class="fi" value="${esc(log?.publisher||'')}" placeholder="ระบุสำนักพิมพ์"></div>
    </div>
    <div class="fg"><label>ประเภทหนังสือ *</label>
      <div class="cat-grid">${CATS.map(c=>`<label class="cat-chip${log?.categoryCode===c.c?' sel':''}" data-c="${c.c}"><input type="radio" name="catR" value="${c.c}" style="display:none"${log?.categoryCode===c.c?' checked':''}><span class="cat-code">${c.c}</span><span>${c.l}</span></label>`).join('')}</div>
    </div>
    <div class="fr">
      <div class="fg"><label>จำนวนหน้า *</label><input type="number" id="f-pg" class="fi" value="${log?.pages||''}" min="1" placeholder="เช่น 120"></div>
      <div class="fg"><label>เวลาที่ใช้ *</label><input type="text" id="f-time" class="fi" value="${esc(log?.readTime||'')}" placeholder="เช่น 2 ชั่วโมง 15 นาที"></div>
    </div>
    <div class="fg"><label>แหล่งที่มาของหนังสือ *</label><input type="text" id="f-src" class="fi" value="${esc(log?.source||'')}" placeholder="เช่น ห้องสมุดโรงเรียน, เว็บไซต์, ยืมเพื่อน..."></div>
    <div class="fg"><label>เนื้อหาโดยสรุปใจความสำคัญ *</label><textarea id="f-sum" class="ft" rows="4" placeholder="สรุปรายละเอียดเนื้อหาเรื่องราวที่อ่าน...">${esc(log?.summary||'')}</textarea></div>
    <div class="fg"><label>ข้อคิดที่ได้รับจากการอ่าน *</label><textarea id="f-les" class="ft" rows="3" placeholder="ระบุข้อคิดหรือสิ่งที่สามารถนำไปปรับใช้ในชีวิตประจำวัน...">${esc(log?.lesson||'')}</textarea></div>
    <div class="fg"><label>คำศัพท์ใหม่ที่ได้รับ *</label><textarea id="f-voc" class="ft" rows="2" placeholder="ระบุคำศัพท์และความหมายอย่างน้อย 1-3 คำ...">${esc(log?.vocabulary||'')}</textarea></div>
    <div class="fg"><label>URL รูปภาพหรือไฟล์รูปปกหนังสือ (จำเป็นต้องใส่) *</label><input type="url" id="f-img" class="fi" value="${esc(log?.coverImage||'')}" placeholder="https://images.unsplash.com/photo-..."></div>`;

  modal(logId?'✏️ แก้ไขบันทึกการอ่าน':'➕ เพิ่มบันทึกรักการอ่านเล่มใหม่', html, () => {
    const order=document.getElementById('f-ord').value;
    const date=document.getElementById('f-date').value;
    const title=document.getElementById('f-title').value.trim();
    const auth=document.getElementById('f-auth').value.trim();
    const pub=document.getElementById('f-pub').value.trim();
    const cat = document.querySelector('input[name="catR"]:checked');
    const pg=document.getElementById('f-pg').value;
    const time=document.getElementById('f-time').value.trim();
    const src=document.getElementById('f-src').value.trim();
    const sum=document.getElementById('f-sum').value.trim();
    const les=document.getElementById('f-les').value.trim();
    const voc=document.getElementById('f-voc').value.trim();
    const img=document.getElementById('f-img').value.trim();

    // STRICT VALIDATION
    if(!order || !date || !title || !auth || !pub || !cat || !pg || !time || !src || !sum || !les || !voc || !img){ 
      toast('❌ บันทึกไม่สำเร็จ! กรุณากรอกข้อมูลให้ครบถ้วนทุกช่องห้ามปล่อยว่าง','er'); 
      return false; 
    }

    const logData = {
      id:logId||DB.gid(), studentId:sess.id,
      order:parseInt(order)||nextN,
      readDate:date, bookTitle:title,
      author:auth, publisher:pub,
      categoryCode:cat.value, pages:pg,
      readTime:time, source:src, summary:sum,
      lesson:les, vocabulary:voc, coverImage:img,
      status:log?.status||'pending'
    };

    DB.saveLog(logData);
    toast('บันทึกรักการอ่านเสร็จสิ้น ✅');
    
    triggerNotification(st, logData);

    loadLogs();
  });

  setTimeout(()=>{
    document.querySelectorAll('.cat-chip').forEach(c=>{
      c.onclick=()=>{ document.querySelectorAll('.cat-chip').forEach(x=>x.classList.remove('sel')); c.classList.add('sel'); c.querySelector('input').checked=true; };
    });
  },100);
}

function editLog(id){ openLogForm(id); }
function delLogBtn(id){ confirm2('ต้องการลบบันทึกนี้?',()=>{ DB.delLog(id); toast('ลบแล้ว'); loadLogs(); }); }
function toggleAcc(id){ document.getElementById(id).classList.toggle('open'); }

function pageStudentProfile() {
  const sess = DB.getSession(); if(!sess||sess.role!=='student'){Router.go('home');return;}
  const st = DB.getStudent(sess.id);
  const m = layout(STU_LINKS,'student-profile');
  const classes = DB.getClasses();
  const levels = [...new Set(classes.map(c=>c.level))];
  m.innerHTML = `<div class="pc"><h2 class="sec-t">👤 ข้อมูลของฉัน</h2>
    <div class="fg"><label>รหัสนักเรียน</label><input class="fi" value="${esc(st.studentCode)}" disabled></div>
    <div class="fg"><label>ชื่อ-นามสกุล *</label><input type="text" id="p-name" class="fi" value="${esc(st.name)}" required></div>
    <div class="fr">
      <div class="fg"><label>ระดับชั้น</label>
        <select id="p-lv" class="fs">
          <option value="">เลือกชั้น</option>
          ${levels.map(l=>`<option value="${l}"${st.classLevel===l?' selected':''}>${l}</option>`).join('')}
        </select>
      </div>
      <div class="fg"><label>ห้อง</label>
        <select id="p-rm" class="fs">
          <option value="">เลือกห้อง</option>
          ${classes.filter(c=>c.level===st.classLevel).map(c=>`<option value="${c.id}"${st.classId===c.id?' selected':''}>${c.room}</option>`).join('')}
        </select>
      </div>
      <div class="fg"><label>เลขที่</label><input type="number" id="p-num" class="fi" value="${esc(st.number||'')}" min="1" max="60"></div>
    </div>
    <button class="btn btn-primary" id="p-save">💾 บันทึกข้อมูล</button>
  </div>
  `;
  document.getElementById('p-lv').onchange = function(){
    const rm=document.getElementById('p-rm');
    rm.innerHTML='<option value="">เลือกห้อง</option>'+classes.filter(c=>c.level===this.value).map(c=>`<option value="${c.id}">${c.room}</option>`).join('');
  };
  document.getElementById('p-save').onclick = () => {
    const name=document.getElementById('p-name').value.trim();
    if(!name){ toast('กรุณากรอกชื่อ','er'); return; }
    const cid=document.getElementById('p-rm').value;
    const cls=cid?DB.getClass(cid):null;
    st.name=name; st.classId=cid; st.classLevel=document.getElementById('p-lv').value;
    st.classRoom=cls?cls.room:''; st.number=document.getElementById('p-num').value;
    DB.saveStudent(st); DB.setSession({...DB.getSession(),name});
    toast('บันทึกสำเร็จ ✅');
  };
}

function pageStudentHistory() {
  const sess = DB.getSession(); if(!sess||sess.role!=='student'){Router.go('home');return;}
  const m = layout(STU_LINKS,'student-history');
  const logs = DB.getLogs(sess.id).sort((a,b)=>(b.order||0)-(a.order||0));
  m.innerHTML = `<div class="pc">
    <div class="sec-h"><h2 class="sec-t">📋 ประวัติการอ่าน</h2><span class="badge b-info">${logs.length} รายการ</span></div>
    <div class="sb"><input type="text" id="sh" class="fi" placeholder="🔍 ค้นหาชื่อหนังสือ..."></div>
    <div class="tw"><table class="dt"><thead><tr><th>ครั้งที่</th><th>วันที่</th><th>ชื่อหนังสือ</th><th>ผู้แต่ง</th><th>หน้า</th><th>คะแนน</th><th>สถานะ</th></tr></thead>
    <tbody id="hist-tb">${histRows(logs)}</tbody></table></div></div>
    `;
  document.getElementById('sh').oninput = function(){
    const q=this.value.toLowerCase();
    document.getElementById('hist-tb').innerHTML=histRows(logs.filter(l=>(l.bookTitle||'').toLowerCase().includes(q)));
  };
}

function histRows(logs){
  if(!logs.length) return `<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--gray-500)">ไม่พบรายการ</td></tr>`;
  const sm={approved:'<span class="badge b-ok">✅</span>',rejected:'<span class="badge b-no">❌</span>',pending:'<span class="badge b-wait">⏳</span>'};
  return logs.map(l=>{ const sc=DB.getScore(l.id); return `<tr><td>${l.order||'-'}</td><td>${fmtDate(l.readDate)}</td><td>${esc(l.bookTitle)}</td><td>${esc(l.author||'-')}</td><td>${l.pages||'-'}</td><td>${sc?`${sc.points}/10`:'-'}</td><td>${sm[l.status]||'-'}</td></tr>`; }).join('');
}

function pageStudentDashboard() {
  const sess = DB.getSession(); if(!sess||sess.role!=='student'){Router.go('home');return;}
  const m = layout(STU_LINKS,'student-dashboard');
  const logs = DB.getLogs(sess.id);
  const appr = logs.filter(l=>l.status==='approved');
  const pg = logs.reduce((s,l)=>s+(parseInt(l.pages)||0),0);
  const scs = appr.map(l=>DB.getScore(l.id)).filter(Boolean);
  const avg = scs.length?(scs.reduce((s,x)=>s+(x.points||0),0)/scs.length).toFixed(1):'-';
  const badges = DB.computeBadges(sess.id);
  m.innerHTML = `<h2 class="sec-t">📊 สถิติของฉัน</h2>
    <div class="sg">
      <div class="sc c-bl"><div class="si">📚</div><div class="sv">${logs.length}</div><div class="sl2">เล่มที่อ่านแล้ว</div></div>
      <div class="sc c-gr"><div class="si">📄</div><div class="sv">${pg.toLocaleString()}</div><div class="sl2">หน้าสะสม</div></div>
      <div class="sc c-pu"><div class="si">⭐</div><div class="sv">${avg}</div><div class="sl2">คะแนนเฉลี่ย</div></div>
      <div class="sc c-pk"><div class="si">✅</div><div class="sv">${appr.length}</div><div class="sl2">อนุมัติแล้ว</div></div>
    </div>
    <div class="pc"><h3 class="sec-t">🏅 Badge ของฉัน</h3>
      ${badges.length?`<div class="bg-grid">${badges.map(b=>`<div class="bg-card"><div class="bg-icon">${b.icon}</div><div class="bg-label">${b.label}</div></div>`).join('')}</div>`:'<p style="color:var(--gray-500)">ยังไม่มี Badge — เริ่มบันทึกการอ่านเลย!</p>'}
    </div>
    `;
}

// ═══════════════════════════════════════════════
// TEACHER PAGES
// ═══════════════════════════════════════════════
const TEA_LINKS = [{id:'teacher-review',icon:'📋',label:'รอตรวจ'},{id:'teacher-classrooms',icon:'🏫',label:'ห้องเรียน'},{id:'teacher-dashboard',icon:'📊',label:'สถิติ/ข่าวสาร'}];

function pageTeacherReview() {
  const sess = DB.getSession(); if(!sess||sess.role!=='teacher'){Router.go('home');return;}
  const m = layout(TEA_LINKS,'teacher-review');
  const logs = DB.getAllLogs().filter(l=>l.status==='pending');
  const stus = DB.getStudents();
  m.innerHTML = `<div class="sec-h"><h2 class="sec-t">📋 รายการรอตรวจ</h2><span class="badge b-wait">${logs.length} รายการ</span></div>
    <div class="sb"><input type="text" id="srch" class="fi" placeholder="🔍 ค้นหาชื่อนักเรียนหรือหนังสือ..."></div>
    <div class="tw"><table class="dt"><thead><tr><th>ห้อง</th><th>เลขที่</th><th>ชื่อ</th><th>วันที่</th><th>ชื่อหนังสือ</th><th>แหล่งที่มา</th><th></th></tr></thead>
    <tbody id="rev-tb">${revRows(logs,stus)}</tbody></table></div>
    `;
  document.getElementById('srch').oninput = function(){
    const q=this.value.toLowerCase();
    document.getElementById('rev-tb').innerHTML=revRows(logs.filter(l=>{ const s=stus.find(x=>x.id===l.studentId); return (s?.name||'').toLowerCase().includes(q)||(l.bookTitle||'').toLowerCase().includes(q); }),stus);
  };
}

function revRows(logs,stus){
  if(!logs.length) return `<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--gray-500)">ไม่มีรายการรอตรวจ 🎉</td></tr>`;
  return logs.map(l=>{ const st=stus.find(s=>s.id===l.studentId); const cls=st?.classId?DB.getClass(st.classId):null; return `<tr><td>${cls?.name||'-'}</td><td>${st?.number||'-'}</td><td>${esc(st?.name||'-')}</td><td>${fmtDate(l.readDate)}</td><td>${esc(l.bookTitle||'-')}</td><td>${esc(l.source||'-')}</td><td><button class="btn btn-sm btn-primary" onclick="openGrade('${l.id}')">📝 ตรวจ</button> <button class="btn btn-sm btn-outline" onclick="exportStudentReadingForm('${l.id}')">📄 Export</button></td></tr>`; }).join('');
}

function openGrade(lid) {
  const log=DB.getLog(lid); if(!log) return;
  const st=DB.getStudent(log.studentId);
  const ex=DB.getScore(lid);
  const html = `
    <div style="font-weight:700;margin-bottom:.5rem">${esc(st?.name||'-')} · ครั้งที่ ${log.order}</div>
    <div style="display:flex;gap:.8rem;align-items:flex-start;margin-bottom:.8rem">
      ${log.coverImage?`<img src="${esc(log.coverImage)}" style="width:80px;height:110px;object-fit:cover;border-radius:var(--radius-sm);box-shadow:0 4px 12px rgba(0,0,0,.12)" onerror="this.style.display='none'" alt="ปก">`:'' }
      <div><div style="font-size:1rem;font-weight:700">${esc(log.bookTitle)}</div>
      <div style="font-size:.82rem;color:var(--gray-500);margin-top:.3rem">👤 ${esc(log.author||'-')} · 📅 ${fmtDate(log.readDate)} · 📄 ${log.pages||0} หน้า</div></div>
    </div>
    ${log.summary?`<div class="det-sec"><label>📝 เนื้อหาโดยสรุป</label><div class="det-txt">${esc(log.summary)}</div></div>`:''}
    ${log.lesson?`<div class="det-sec"><label>💡 ข้อคิดที่ได้รับ</label><div class="det-txt">${esc(log.lesson)}</div></div>`:''}
    ${log.vocabulary?`<div class="det-sec"><label>📖 คำศัพท์ใหม่</label><div class="det-txt">${esc(log.vocabulary)}</div></div>`:''}
    <hr style="margin:.8rem 0;border:none;border-top:1px solid var(--gray-200)">
    <div class="fr">
      <div class="fg"><label>คะแนน (0–10)</label><input type="number" id="g-pt" class="fi" value="${ex?.points??8}" min="0" max="10" step="0.5"></div>
      <div class="fg"><label>ดาว</label><div class="star-row" id="stars">${[1,2,3,4,5].map(n=>`<span class="star${(ex?.stars||3)>=n?' on':''}" data-v="${n}">⭐</span>`).join('')}</div><input type="hidden" id="g-st" value="${ex?.stars||3}"></div>
    </div>
    <div class="fg"><label>ข้อเสนอแนะ</label><textarea id="g-cm" class="ft" rows="3">${esc(ex?.comment||'')}</textarea></div>
    <div class="appr-btns">
      <button class="btn btn-success" onclick="doGrade('${lid}','approved')">✅ อนุมัติ</button>
      <button class="btn btn-danger" onclick="doGrade('${lid}','rejected')">❌ ไม่อนุมัติ</button>
    </div>`;
  modal('📝 ตรวจบันทึกการอ่าน', html);
  setTimeout(()=>{
    document.querySelectorAll('#stars .star').forEach(s=>{
      s.onclick=()=>{ const v=parseInt(s.dataset.v); document.getElementById('g-st').value=v; document.querySelectorAll('#stars .star').forEach((x,i)=>x.classList.toggle('on',i<v)); };
    });
  },100);
}

function doGrade(lid,status){
  const pt=parseFloat(document.getElementById('g-pt')?.value)||0;
  const stars=parseInt(document.getElementById('g-st')?.value)||3;
  const cm=document.getElementById('g-cm')?.value||'';
  const log=DB.getLog(lid); if(!log) return;
  log.status=status; DB.saveLog(log);
  const ex=DB.getScore(lid);
  DB.saveScore({id:ex?.id,logId:lid,studentId:log.studentId,points:Math.min(10,Math.max(0,pt)),stars,comment:cm});
  toast(status==='approved'?'อนุมัติแล้ว ✅':'ไม่อนุมัติ ❌',status==='approved'?'ok':'er');
  const student=DB.getStudent(log.studentId);
  if(student) sendNotifications(student,log,status==='approved'?'approved':'rejected');
  if(_modal){_modal.classList.remove('show');setTimeout(()=>{_modal.remove();_modal=null;},300);}
  Router.go('teacher-review');
}

function pageTeacherClassrooms() {
  const sess = DB.getSession(); if(!sess||sess.role!=='teacher'){Router.go('home');return;}
  const m = layout(TEA_LINKS,'teacher-classrooms');
  const classes = DB.getClasses();
  const levels = [...new Set(classes.map(c=>c.level))];
  m.innerHTML = `<h2 class="sec-t">🏫 ห้องเรียน</h2>
    <p style="font-size:0.84rem; color:var(--gray-500); margin-bottom:1rem;">ระบบจะแสดงออกแบบรายงานโครงสร้างห้องเรียนและจัดเรียงเลขที่ก่อนแบบรูปภาพโมเดล</p>
    <div class="sb"><input type="text" id="sc" class="fi" style="max-width:280px" placeholder="🔍 ค้นหาห้องเรียน..."></div>
    ${levels.map(lv=>`<div class="cls-lv"><div class="lv-t">🎓 ระดับชั้น ${lv}</div><div class="cls-cards">${
      classes.filter(c=>c.level===lv).map(c=>{ const cnt=DB.getStudents().filter(s=>s.classId===c.id).length; return `<div class="cc" onclick="viewClass('${c.id}')"><div class="cc-n">${c.name}</div><div class="cc-c">${cnt} คน</div></div>`; }).join('')
    }</div></div>`).join('')}
    `;
  document.getElementById('sc').oninput=function(){const q=this.value.toLowerCase(); document.querySelectorAll('.cc').forEach(c=>c.style.display=c.querySelector('.cc-n').textContent.toLowerCase().includes(q)?'':'none'); };
}

// VIEW CLASS WITH EXPORT REPORT ALIGNED WITH FILE S__19619886.jpg AND S__19619878.jpg
function viewClass(cid){
  const cls=DB.getClass(cid); if(!cls) return;
  // SORT LOGIC: SORTED BY STUDENT NUMBER (เรียงเลขที่จากน้อยไปมากก่อน)
  const stus=DB.getStudents().filter(s=>s.classId===cid).sort((a,b)=>parseInt(a.number||0)-parseInt(b.number||0));

  const html=`
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.8rem;">
      <p style="color:var(--purple);font-weight:800;">ชั้นเรียนห้อง ${cls.name} · นักเรียนทั้งหมด ${stus.length} คน</p>
      <div style="display:flex;gap:.4rem;flex-wrap:wrap;justify-content:flex-end">
        <button class="btn btn-outline btn-sm" onclick="exportClassExcel('${cid}')">📊 Export Excel</button>
        <button class="btn btn-outline btn-sm" onclick="window.print()">📄 Export PDF/พิมพ์</button>
      </div>
    </div>
    <div class="tw"><table class="dt"><thead><tr><th>เลขที่</th><th>ชื่อ-นามสกุล</th><th>บันทึกทั้งหมด</th><th>อนุมัติแล้ว</th><th>คะแนนเฉลี่ย</th><th>เล่มรายงานการอ่าน</th></tr></thead><tbody>${
    stus.map(st=>{ 
      const ls=DB.getLogs(st.id); 
      const ap=ls.filter(l=>l.status==='approved'); 
      const sc=ap.map(l=>DB.getScore(l.id)).filter(Boolean); 
      const avg=sc.length?(sc.reduce((s,x)=>s+(x.points||0),0)/sc.length).toFixed(1):'-'; 
      return `<tr>
        <td style="font-weight:700; color:var(--purple);">${st.number||'-'}</td>
        <td style="font-weight:600;">${esc(st.name)}</td>
        <td>${ls.length} เล่ม</td>
        <td><span class="badge b-ok">${ap.length} เล่ม</span></td>
        <td><strong>${avg}</strong></td>
        <td>
          <button class="btn btn-primary btn-sm" style="font-size:11px; padding:2px 8px;" onclick="openStudentFullReportLayout('${st.id}')">📄 ดูรายงาน</button>
          <button class="btn btn-outline btn-sm" style="font-size:11px; padding:2px 8px;" onclick="openStudentFullReportLayout('${st.id}', true)">Export PDF</button>
        </td>
      </tr>`; 
    }).join('')
    }</tbody></table></div>`;
  modal(`🏫 สรุปรายงานรายห้องเรียน (${cls.name})`, html);
}

// DETAILED COMPREHENSIVE REPORT POPUP ALIGNED WITH S__19619878.jpg
function openStudentFullReportLayout(sid, autoPrint=false) {
  const st = DB.getStudent(sid);
  const logs = DB.getLogs(sid).filter(l=>l.status==='approved');
  const cfg = DB.getSettings();

  let reportContent = '';
  if(!logs.length) {
    reportContent = `<div class="empty">📭 นักเรียนคนนี้ยังไม่มีประวัติบันทึกการอ่านที่ผ่านการอนุมัติ</div>`;
  } else {
    reportContent = logs.map((l, i) => {
      const rt = splitReadTime(l.readTime);
      return `
      <div class="tpl-report">
        <div class="tpl-field tpl-pos-school">${esc(cfg.schoolName)}</div>
        <div class="tpl-field tpl-pos-office tpl-mid">สำนักงานเขตพื้นที่การศึกษามัธยมศึกษาปทุมธานี</div>
        <div class="tpl-field tpl-pos-book">${fitText(l.bookTitle,90)}</div>
        <div class="tpl-field tpl-pos-author">${fitText(l.author || '-',90)}</div>
        <div class="tpl-field tpl-pos-pages">${esc(l.pages || '0')} หน้า</div>
        <div class="tpl-field tpl-pos-time">${esc(rt.hours)}</div>
        <div class="tpl-field tpl-pos-min">${esc(rt.minutes)}</div>
        <div class="tpl-field tpl-pos-summary tpl-small">${fitText(l.summary,720)}</div>
        <div class="tpl-field tpl-pos-lesson tpl-small">${fitText(l.lesson || '-',220)}</div>
        <div class="tpl-field tpl-pos-apply tpl-small">${fitText(l.vocabulary || '-',220)}</div>
        <div class="tpl-field tpl-pos-reason tpl-small">${fitText(l.source || `ครั้งที่ ${l.order||i+1} วันที่อ่าน ${fmtDate(l.readDate)}`,220)}</div>
        <div class="tpl-field tpl-pos-sign tpl-name">${esc(st.name)}</div>
        <div class="tpl-field tpl-pos-fullname tpl-name">${esc(st.name)}</div>
        <div class="tpl-field tpl-pos-position tpl-name">นักเรียน ${esc(st.classLevel||'')}/${esc(st.classRoom||'')} เลขที่ ${esc(st.number||'-')}</div>
      </div>
    `}).join('');
  }

  const html = `
    <div style="max-height: 75vh; overflow-y:auto; padding-right:5px;">
      <div style="text-align:right; margin-bottom:0.5rem;">
        <button class="btn btn-outline btn-sm" onclick="window.print()">🖨️ Print รายงานสรุป</button>
      </div>
      ${reportContent}
    </div>
  `;
  modal(`📄 รูปแบบเล่มรายงานประวัติการอ่าน: ${st.name}`, html);
  if(autoPrint) setTimeout(()=>window.print(),450);
}

function pageTeacherDashboard() {
  const sess = DB.getSession(); if(!sess||sess.role!=='teacher'){Router.go('home');return;}
  const m = layout(TEA_LINKS,'teacher-dashboard');
  const all=DB.getAllLogs(); const stus=DB.getStudents();
  const appr=all.filter(l=>l.status==='approved'); const pend=all.filter(l=>l.status==='pending');
  const pg=all.reduce((s,l)=>s+(parseInt(l.pages)||0),0);
  
  m.innerHTML = `
    <!-- PR SETTING AREA FOR TEACHERS -->
    <div class="pc" style="border: 1.5px solid var(--purple-light);">
      <h3 class="sec-t">📢 ตั้งค่า/แก้ไข ข่าวประชาสัมพันธ์โรงเรียน</h3>
      <div class="fg">
        <label>ข้อความประชาสัมพันธ์ (จะไปปรากฏบนสมุดบันทึกของนักเรียนทุกคน)</label>
        <textarea id="t-pr-msg" class="ft" rows="2" placeholder="ใส่ข้อความแจ้งเตือนที่นี่...">${esc(DB.getAnnounce())}</textarea>
      </div>
      <button class="btn btn-primary btn-sm" id="btn-save-announce">💾 อัปเดตข่าวประชาสัมพันธ์</button>
    </div>

    <h2 class="sec-t" style="margin-top:1.5rem;">📊 สถิติภาพรวมข้อมูล</h2>
    <div class="sg">
      <div class="sc c-bl"><div class="si">👥</div><div class="sv">${stus.length}</div><div class="sl2">นักเรียนใช้งาน</div></div>
      <div class="sc c-gr"><div class="si">📚</div><div class="sv">${all.length}</div><div class="sl2">บันทึกทั้งหมด</div></div>
      <div class="sc c-pu"><div class="si">📄</div><div class="sv">${pg.toLocaleString()}</div><div class="sl2">จำนวนหน้าสะสม</div></div>
      <div class="sc c-pk"><div class="si">⏳</div><div class="sv">${pend.length}</div><div class="sl2">รายการรอตรวจ</div></div>
    </div>
    `;

  document.getElementById('btn-save-announce').onclick = () => {
    const txt = document.getElementById('t-pr-msg').value.trim();
    if(!txt) { toast('กรุณากรอกข้อความ','er'); return; }
    DB.saveAnnounce(txt);
    toast('📢 อัปเดตบอร์ดประชาสัมพันธ์เสร็จสิ้น!');
  };
}

// ═══════════════════════════════════════════════
// ADMIN PAGES
// ═══════════════════════════════════════════════
const ADM_LINKS = [{id:'admin-dashboard',icon:'📊',label:'ภาพรวม'},{id:'admin-students',icon:'👤',label:'นักเรียน'},{id:'admin-teachers',icon:'👩‍🏫',label:'ครู'},{id:'admin-classes',icon:'🏫',label:'ชั้นเรียน'},{id:'admin-settings',icon:'⚙️',label:'ตั้งค่า'}];

function pageAdminDashboard() {
  const sess=DB.getSession(); if(!sess||sess.role!=='admin'){Router.go('home');return;}
  const m=layout(ADM_LINKS,'admin-dashboard');
  const stus=DB.getStudents(),tea=DB.getTeachers(),cls=DB.getClasses(),logs=DB.getAllLogs();
  const appr=logs.filter(l=>l.status==='approved'),pend=logs.filter(l=>l.status==='pending');
  const cfg=DB.getSettings();
  m.innerHTML=`<h2 class="sec-t">📊 ภาพรวมทั้งโรงเรียน</h2>
    <p style="color:var(--gray-500);margin-bottom:1.2rem">ปีการศึกษาที่มีผลบังคับใช้ระบบ: พ.ศ. ${cfg.academicYear}</p>
    <div class="sg">
      <div class="sc c-bl"><div class="si">👤</div><div class="sv">${stus.length}</div><div class="sl2">นักเรียน</div></div>
      <div class="sc c-pu"><div class="si">👩‍🏫</div><div class="sv">${tea.length}</div><div class="sl2">ครู</div></div>
      <div class="sc c-gr"><div class="si">📚</div><div class="sv">${logs.length}</div><div class="sl2">บันทึกทั้งหมด</div></div>
      <div class="sc c-pk"><div class="si">✅</div><div class="sv">${appr.length}</div><div class="sl2">อนุมัติแล้ว</div></div>
      <div class="sc c-or"><div class="si">⏳</div><div class="sv">${pend.length}</div><div class="sl2">รอตรวจ</div></div>
      <div class="sc c-tl"><div class="si">📄</div><div class="sv">${logs.reduce((s,l)=>s+(parseInt(l.pages)||0),0).toLocaleString()}</div><div class="sl2">หน้าสะสมรวม</div></div>
    </div>
    <div class="pc"><h3 class="sec-t">📥 ส่งออกข้อมูลชุดรายงาน</h3>
      <div style="display:flex;gap:.8rem;flex-wrap:wrap">
        <button class="btn btn-outline" onclick="exportCSV()">📊 Export CSV</button>
        <button class="btn btn-outline" onclick="exportJSON()">📦 Export JSON</button>
        <button class="btn btn-primary" onclick="window.print()">🖨️ พิมพ์รายงาน</button>
      </div>
    </div>
    `;
}

function pageAdminStudents() {
  const sess=DB.getSession(); if(!sess||sess.role!=='admin'){Router.go('home');return;}
  const m=layout(ADM_LINKS,'admin-students');
  renderStuList(m);
}

function renderStuList(m){
  const stus=DB.getStudents();
  m.innerHTML=`<div class="sec-h"><h2 class="sec-t">👤 จัดการนักเรียน</h2><button class="btn btn-primary" onclick="openStuForm()">➕ เพิ่มนักเรียน</button></div>
    <div class="sb"><input type="text" id="ss" class="fi" placeholder="🔍 ค้นหารหัสหรือชื่อ..."></div>
    <div class="tw"><table class="dt"><thead><tr><th>รหัส</th><th>ชื่อ</th><th>ชั้น</th><th>เลขที่</th><th>บันทึก</th><th></th></tr></thead>
    <tbody id="stu-tb">${stuRows(stus)}</tbody></table></div>
    `;
  document.getElementById('ss').oninput=function(){ document.getElementById('stu-tb').innerHTML=stuRows(DB.getStudents().filter(s=>s.studentCode.includes(this.value)||(s.name||'').toLowerCase().includes(this.value.toLowerCase()))); };
}

function stuRows(stus){
  if(!stus.length) return `<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--gray-500)">ไม่พบนักเรียน</td></tr>`;
  return stus.map(st=>{ const cls=st.classId?DB.getClass(st.classId):null; return `<tr><td>${esc(st.studentCode)}</td><td>${esc(st.name)}</td><td>${cls?.name||'-'}</td><td>${st.number||'-'}</td><td>${DB.getLogs(st.id).length}</td><td><button class="btn btn-sm btn-outline" onclick="openStuForm('${st.id}')">✏></button> <button class="btn btn-sm btn-do" onclick="delStu('${st.id}')">🗑️</button></td></tr>`; }).join('');
}

function openStuForm(sid=null){
  const st=sid?DB.getStudent(sid):null;
  const classes=DB.getClasses();
  const levels=[...new Set(classes.map(c=>c.level))];
  const html=`<div class="fr">
    <div class="fg"><label>รหัส (5 หลัก) *</label><input type="text" id="sf-c" class="fi" value="${esc(st?.studentCode||'')}" maxlength="5"${sid?' disabled':''}></div>
    <div class="fg"><label>ชื่อ-นามสกุล *</label><input type="text" id="sf-n" class="fi" value="${esc(st?.name||'')}"></div>
  </div>
  <div class="fr">
    <div class="fg"><label>ชั้น</label><select id="sf-lv" class="fs"><option value="">เลือก</option>${levels.map(l=>`<option value="${l}"${st?.classLevel===l?' selected':''}>${l}</option>`).join('')}</select></div>
    <div class="fg"><label>ห้อง</label><select id="sf-rm" class="fs"><option value="">เลือก</option>${classes.filter(c=>c.level===st?.classLevel).map(c=>`<option value="${c.id}"${st?.classId===c.id?' selected':''}>${c.room}</option>`).join('')}</select></div>
    <div class="fg"><label>เลขที่</label><input type="number" id="sf-nm" class="fi" value="${esc(st?.number||'')}" min="1" max="60"></div>
  </div>`;
  modal(sid?'✏️ แก้ไขนักเรียน':'➕ เพิ่มนักเรียน',html,()=>{
    const code=sid?st.studentCode:document.getElementById('sf-c').value.trim();
    const name=document.getElementById('sf-n').value.trim();
    if(!code||!name){ toast('กรุณากรอกข้อมูลที่จำเป็น','er'); return false; }
    if(!sid&&!/^\d{5}$/.test(code)){ toast('รหัสต้องเป็นตัวเลข 5 หลัก','er'); return false; }
    const cid=document.getElementById('sf-rm').value;
    const cls=cid?DB.getClass(cid):null;
    DB.saveStudent({id:sid||DB.gid(),studentCode:code,name,classId:cid,classLevel:document.getElementById('sf-lv').value,classRoom:cls?.room||'',number:document.getElementById('sf-nm').value,academicYear:DB.getSettings().academicYear,createdAt:st?.createdAt||new Date().toISOString()});
    toast('บันทึกสำเร็จ'); Router.go('admin-students');
  });
  setTimeout(()=>{ document.getElementById('sf-lv').onchange=function(){ const el=document.getElementById('sf-rm'); el.innerHTML='<option value="">เลือก</option>'+DB.getClasses().filter(c=>c.level===this.value).map(c=>`<option value="${c.id}">${c.room}</option>`).join(''); }; },100);
}

function delStu(id){ confirm2('ลบนักเรียนคนนี้?',()=>{ DB.delStudent(id); toast('ลบแล้ว'); Router.go('admin-students'); }); }

function pageAdminTeachers() {
  const sess=DB.getSession(); if(!sess||sess.role!=='admin'){Router.go('home');return;}
  const m=layout(ADM_LINKS,'admin-teachers');
  const tea=DB.getTeachers();
  m.innerHTML=`<div class="sec-h"><h2 class="sec-t">👩‍🏫 จัดการครู</h2><button class="btn btn-primary" onclick="openTeaForm()">➕ เพิ่มครู</button></div>
    <div class="tw"><table class="dt"><thead><tr><th>รหัสผ่าน</th><th>ชื่อ</th><th></th></tr></thead><tbody>${
    tea.map(t=>`<tr><td><code>${esc(t.password)}</code></td><td>${esc(t.name)}</td><td><button class="btn btn-sm btn-outline" onclick="openTeaForm('${t.id}')">✏️</button> <button class="btn btn-sm btn-do" onclick="delTea('${t.id}')">🗑️</button></td></tr>`).join('')}</tbody></table></div>
    `;
}

function openTeaForm(tid=null){
  const t=tid?DB.getTeachers().find(x=>x.id===tid):null;
  const html=`<div class="fg"><label>ชื่อครู *</label><input type="text" id="tf-n" class="fi" value="${esc(t?.name||'')}"></div><div class="fg"><label>รหัสผ่าน *</label><input type="text" id="tf-p" class="fi" value="${esc(t?.password||'')}" placeholder="passwords"></div>`;
  modal(tid?'✏️ แก้ไขครู':'➕ เพิ่มครู',html,()=>{
    const n=document.getElementById('tf-n').value.trim(),p=document.getElementById('tf-p').value.trim();
    if(!n||!p){ toast('กรุณากรอกข้อมูล','er'); return false; }
    DB.saveTeacher({id:tid||DB.gid(),name:n,password:p}); toast('บันทึกสำเร็จ'); Router.go('admin-teachers');
  });
}

// MANAGEMENT OF CLASSES
function pageAdminClasses() {
  const sess=DB.getSession(); if(!sess||sess.role!=='admin'){Router.go('home');return;}
  const m=layout(ADM_LINKS,'admin-classes');
  const classes=DB.getClasses();
  const levels=[...new Set(classes.map(c=>c.level))];
  m.innerHTML=`<div class="sec-h"><h2 class="sec-t">🏫 จัดการชั้นเรียน</h2><button class="btn btn-primary" onclick="openClsForm()">➕ เพิ่มห้อง</button></div>
    ${levels.map(lv=>`<div class="cls-lv"><div class="lv-t">🎓 ${lv}</div><div class="cls-cards">${
      classes.filter(c=>c.level===lv).map(c=>{ const cnt=DB.getStudents().filter(s=>s.classId===c.id).length; return `<div class="cc"><div class="cc-n">${c.name}</div><div class="cc-c">${cnt} คน</div><div class="cc-acts"><button class="btn btn-sm btn-outline" onclick="openClsForm('${c.id}')">✏️</button><button class="btn btn-sm btn-do" onclick="delCls('${c.id}')">🗑️</button></div></div>`; }).join('')
    }</div></div>`).join('')}
    `;
}

function openClsForm(cid=null){
  const cls=cid?DB.getClass(cid):null;
  const html=`<div class="fr">
    <div class="fg"><label>ชั้น *</label><select id="cf-lv" class="fs">${['ม.1','ม.2','ม.3','ม.4','ม.5','ม.6'].map(l=>`<option value="${l}"${cls?.level===l?' selected':''}>${l}</option>`).join('')}</select></div>
    <div class="fg"><label>ห้อง *</label><input type="number" id="cf-rm" class="fi" value="${cls?.room||''}" min="1" max="30"></div>
  </div>`;
  modal(cid?'✏️ แก้ไขห้อง':'➕ เพิ่มห้องเรียน',html,()=>{
    const lv=document.getElementById('cf-lv').value,rm=document.getElementById('cf-rm').value;
    if(!lv||!rm){ toast('กรุณากรอกข้อมูล','er'); return false; }
    DB.saveClass({id:cid||DB.gid(),level:lv,room:parseInt(rm),name:`${lv}/${rm}`}); toast('บันทึกสำเร็จ'); Router.go('admin-classes');
  });
}

function delCls(id){ confirm2('ลบห้องเรียนนี้?',()=>{ DB.delClass(id); toast('ลบแล้ว'); Router.go('admin-classes'); }); }

function renderNotifyLevel(lv, cfg){
  const rooms = cfg.rooms || [];
  return `<details class="notify-level">
    <summary><span>🔔 ${lv}</span><span style="font-size:.78rem;color:var(--gray-500)">${rooms.length} ห้อง</span></summary>
    <div class="notify-body">
      <div class="notify-room" style="background:var(--purple-pale)">
        <div class="notify-room-head"><span>ค่าเริ่มต้นทั้งระดับชั้น ${lv}</span><span class="badge b-info">fallback</span></div>
        ${notifyFieldsHtml(cfg,'notify-level')}
        <div class="notify-actions"><button type="button" class="btn btn-outline btn-sm" onclick="testNotifyLevel('${lv}')">📨 ทดสอบส่ง ${lv}</button></div>
      </div>
      ${rooms.length ? rooms.map(r=>`<div class="notify-room" data-lv="${lv}" data-room="${esc(r.room)}">
        <div class="notify-room-head">
          <span>ห้อง ${esc(r.name||`${lv}/${r.room}`)}</span>
          <button type="button" class="btn btn-sm btn-do" onclick="removeNotifyRoom('${encodeURIComponent(lv)}','${encodeURIComponent(r.room)}')">ลบห้อง</button>
        </div>
        ${notifyFieldsHtml(r,'notify-room')}
        <div class="notify-actions"><button type="button" class="btn btn-outline btn-sm" onclick="testNotifyLevel('${lv}','${esc(r.room)}')">📨 ทดสอบห้อง ${esc(r.room)}</button></div>
      </div>`).join('') : '<div class="empty" style="padding:1.2rem">ยังไม่มีห้องในระดับชั้นนี้</div>'}
      <div class="notify-actions"><button type="button" class="btn btn-outline btn-sm" onclick="addNotifyRoom('${encodeURIComponent(lv)}')">➕ เพิ่มห้องใน ${lv}</button></div>
    </div>
  </details>`;
}

function collectNotifySettingsFromForm(){
  const data = DB.getNotifySettings();
  document.querySelectorAll('.notify-level').forEach(details=>{
    const lv=details.querySelector('summary span')?.textContent?.replace('🔔 ','').trim();
    if(!lv||!data[lv]) return;
    const body=details.querySelector('.notify-body > .notify-room');
    if(!body) return;
    data[lv].telegramBotToken=body.querySelector('.notify-level-tg-token')?.value.trim()||'';
    data[lv].telegramWebhook=data[lv].telegramBotToken;
    data[lv].telegramChatId=body.querySelector('.notify-level-tg-chat')?.value.trim()||'';
  });
  document.querySelectorAll('.notify-room[data-lv]').forEach(box=>{
    const lv=box.dataset.lv, room=box.dataset.room;
    if(!lv || !room) return;
    const cfg=data[lv];
    const item=(cfg.rooms||[]).find(r=>String(r.room)===String(room));
    if(!item) return;
    item.telegramBotToken=box.querySelector('.notify-room-tg-token')?.value.trim()||'';
    item.telegramWebhook=item.telegramBotToken;
    item.telegramChatId=box.querySelector('.notify-room-tg-chat')?.value.trim()||'';
  });
  return data;
}

function saveNotifyForm(showToast=true){
  DB.saveNotifySettings(collectNotifySettingsFromForm());
  if(showToast) toast('บันทึกการตั้งค่าแจ้งเตือนสำเร็จ');
}

function addNotifyRoom(lv){
  lv=decodeURIComponent(lv);
  saveNotifyForm(false);
  modal(`➕ เพิ่มห้องใน ${lv}`, `<div class="fg"><label>เลขห้องหรือชื่อห้อง</label><input class="fi" id="new-notify-room" placeholder="เช่น 16 หรือ ห้องโครงการพิเศษ"></div><div id="new-notify-room-err" class="err" style="display:none"></div>`, ()=>{
    const room=document.getElementById('new-notify-room').value.trim();
    const err=document.getElementById('new-notify-room-err');
    if(!room){ err.textContent='กรุณากรอกห้อง'; err.style.display='block'; return false; }
    const data=DB.getNotifySettings();
    data[lv].hiddenRooms=(data[lv].hiddenRooms||[]).filter(x=>String(x)!==String(room));
    if((data[lv].rooms||[]).some(r=>String(r.room)===String(room))){ err.textContent='มีห้องนี้แล้ว'; err.style.display='block'; return false; }
    data[lv].rooms.push({id:DB.gid(),room:String(room),name:`${lv}/${room}`,telegramBotToken:'',telegramWebhook:'',telegramChatId:''});
    DB.saveNotifySettings(data);
    toast('เพิ่มห้องแล้ว');
    Router.go('admin-settings');
  });
}

function removeNotifyRoom(lv, room){
  lv=decodeURIComponent(lv);
  room=decodeURIComponent(room);
  confirm2(`ลบห้อง ${lv}/${room} ออกจากเมนูแจ้งเตือน?`,()=>{
    saveNotifyForm(false);
    const data=DB.getNotifySettings();
    data[lv].rooms=(data[lv].rooms||[]).filter(r=>String(r.room)!==String(room));
    data[lv].hiddenRooms=[...(data[lv].hiddenRooms||[]).filter(x=>String(x)!==String(room)), String(room)];
    DB.saveNotifySettings(data);
    toast('ลบห้องออกจากเมนูแจ้งเตือนแล้ว','er');
    Router.go('admin-settings');
  });
}

function pageAdminSettings() {
  const sess=DB.getSession(); if(!sess||sess.role!=='admin'){Router.go('home');return;}
  const m=layout(ADM_LINKS,'admin-settings');
  const cfg=DB.getSettings();
  const notify=DB.getNotifySettings();
  const levels=['ม.1','ม.2','ม.3','ม.4','ม.5','ม.6'];
  m.innerHTML=`<div class="pc"><h2 class="sec-t">⚙️ ตั้งค่าระบบ</h2>
    <div class="fg"><label>ชื่อโรงเรียน</label><input type="text" id="cfg-sch" class="fi" value="${esc(cfg.schoolName)}"></div>
    <div class="fg"><label>ปีการศึกษา (พ.ศ.) *ปรับเป็น 2569 แล้ว</label><input type="text" id="cfg-yr" class="fi" value="${esc(cfg.academicYear)}"></div>
    <div class="fg"><label>รหัสผ่านผู้ดูแล</label><input type="text" id="cfg-pw" class="fi" value="${esc(cfg.adminPassword)}"></div>
    <button class="btn btn-primary" id="cfg-save">💾 บันทึกการตั้งค่า</button>
  </div>
  <div class="pc"><h2 class="sec-t">🔔 ตั้งค่าแจ้งเตือน Telegram แยกกลุ่ม ม.1-ม.6</h2>
    <p style="color:var(--gray-500);font-size:.84rem;margin-bottom:.6rem">เมื่อนักเรียนส่งบันทึก ระบบจะส่งข้อความไปกลุ่ม Telegram ของห้องนักเรียนคนนั้นก่อน แล้วค่อยใช้ค่า fallback ของระดับชั้น</p>
    <div style="background:var(--blue-pale);border:1px solid var(--blue-light);border-radius:var(--radius-sm);padding:.85rem 1rem;margin-bottom:1rem;font-size:.84rem;line-height:1.7">
      <strong>วิธีตั้งค่า:</strong> สร้าง Bot ที่ @BotFather → เพิ่ม Bot เข้ากลุ่ม Telegram ของห้อง → ใส่ Bot Token + Chat ID → บันทึก → กด "ทดสอบส่ง"
    </div>
    ${levels.map(lv=>renderNotifyLevel(lv, notify[lv])).join('')}
    <button class="btn btn-primary" id="notify-save">💾 บันทึกการแจ้งเตือน</button>
  </div>
  <div class="pc" style="margin-top:.8rem;border:1.5px solid var(--red-light)">
    <h3 style="color:var(--red);margin-bottom:.6rem">⚠️ โซนอันตราย</h3>
    <button class="btn btn-danger" id="cls-all">🗑️ ล้างข้อมูลทั้งหมด</button>
  </div>
  `;
  document.getElementById('cfg-save').onclick=()=>{ DB.saveSettings({schoolName:document.getElementById('cfg-sch').value,academicYear:document.getElementById('cfg-yr').value,adminPassword:document.getElementById('cfg-pw').value}); toast('บันทึกการตั้งค่าสำเร็จ'); };
  document.getElementById('notify-save').onclick=()=>saveNotifyForm(true);
  document.getElementById('cls-all').onclick=()=>confirm2('⚠️ ล้างข้อมูลทั้งหมด? ไม่สามารถกู้คืนได้',()=>{ localStorage.clear(); DB.seedDefaults(); toast('ล้างข้อมูลแล้ว','er'); DB.clearSession(); Router.go('home'); });
}

function delTea(id){ confirm2('ลบครูคนนี้?',()=>{ DB.delTeacher(id); toast('ลบแล้ว'); Router.go('admin-teachers'); }); }

// ═══════════════════════════════════════════════
// EXPORT DATA SETS
// ═══════════════════════════════════════════════
function exportCSV(){
  const logs=DB.getAllLogs(),stus=DB.getStudents();
  const rows=[['รหัส','ชื่อ','ห้อง','ครั้งที่','วันที่','ชื่อหนังสือ','ผู้แต่ง','หน้า','สถานะ']];
  logs.forEach(l=>{ const st=stus.find(s=>s.id===l.studentId); const cls=st?.classId?DB.getClass(st.classId):null; rows.push([st?.studentCode||'',st?.name||'',cls?.name||'',l.order||'',l.readDate||'',l.bookTitle||'',l.author||'',l.pages||'',l.status||'']); });
  const csv=rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  dl('\uFEFF'+csv,'reading-logs-2569.csv','text/csv;charset=utf-8;');
}

function exportJSON(){
  dl(JSON.stringify({students:DB.getStudents(),logs:DB.getAllLogs(),settings:DB.getSettings()},null,2),'reading-data-backup.json','application/json');
}

function exportClassExcel(cid){
  const cls=DB.getClass(cid); if(!cls) return;
  const stus=DB.getStudents().filter(s=>s.classId===cid).sort((a,b)=>parseInt(a.number||0)-parseInt(b.number||0));
  const rows=stus.map(st=>{
    const logs=DB.getLogs(st.id);
    const approved=logs.filter(l=>l.status==='approved');
    const scores=approved.map(l=>DB.getScore(l.id)).filter(Boolean);
    const avg=scores.length?(scores.reduce((s,x)=>s+(x.points||0),0)/scores.length).toFixed(1):'-';
    return `<tr><td>${esc(st.number||'-')}</td><td>${esc(st.studentCode||'')}</td><td>${esc(st.name||'')}</td><td>${logs.length}</td><td>${approved.length}</td><td>${avg}</td><td>${approved.reduce((s,l)=>s+(parseInt(l.pages)||0),0)}</td></tr>`;
  }).join('');
  const html=`<html><head><meta charset="UTF-8"></head><body><h2>รายงานบันทึกรักการอ่าน ห้อง ${esc(cls.name)}</h2><table border="1"><thead><tr><th>เลขที่</th><th>รหัสนักเรียน</th><th>ชื่อ-นามสกุล</th><th>บันทึกทั้งหมด</th><th>อนุมัติแล้ว</th><th>คะแนนเฉลี่ย</th><th>หน้าอ่านสะสม</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
  dl('\uFEFF'+html,`reading-report-${cls.name}-2569.xls`,'application/vnd.ms-excel;charset=utf-8;');
}

function dl(content,name,type){ const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([content],{type})); a.download=name; a.click(); }

function exportStudentReadingForm(logId){
  const log=DB.getLog(logId); if(!log) return alert('ไม่พบบันทึก');
  const st=DB.getStudent(log.studentId); if(!st) return alert('ไม่พบข้อมูลนักเรียน');
  const cls=st.classId?DB.getClass(st.classId):null;
  const cfg=DB.getSettings();
  
  const html=`<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>บันทึกรักการอ่าน</title>
  <style>
    body {
      font-family: 'Sarabun', Arial, sans-serif;
      margin: 1cm;
      line-height: 1.5;
      color: #000;
    }
    .header {
      text-align: center;
      margin-bottom: 1.5cm;
      border: 2px solid #000;
      padding: 1cm;
    }
    .header h2 {
      margin: 0.3cm 0;
      font-size: 18px;
    }
    .header p {
      margin: 0.2cm 0;
      font-size: 13px;
    }
    .section {
      margin-bottom: 1cm;
    }
    .section-label {
      font-weight: bold;
      margin-bottom: 0.3cm;
    }
    .form-group {
      display: flex;
      margin-bottom: 0.5cm;
    }
    .form-label {
      font-weight: 500;
      width: 35%;
      word-break: break-word;
    }
    .form-value {
      width: 65%;
      border-bottom: 1px dotted #000;
      padding: 0.2cm;
      min-height: 0.5cm;
      word-break: break-word;
    }
    .form-value-large {
      min-height: 2cm;
      border: 1px solid #ccc;
      padding: 0.3cm;
      page-break-inside: avoid;
    }
    .date-section {
      display: flex;
      gap: 1cm;
      margin-top: 1.5cm;
    }
    .date-field {
      flex: 1;
    }
    .sign-section {
      display: flex;
      gap: 2cm;
      justify-content: center;
      margin-top: 2cm;
      text-align: center;
    }
    .sign-box {
      width: 150px;
    }
    .sign-line {
      border-bottom: 1px solid #000;
      margin: 0.8cm 0 0.2cm 0;
      min-height: 1.5cm;
    }
    .sign-label {
      font-size: 12px;
    }
    @media print {
      body { margin: 0.5cm; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h2>บันทึกรักการอ่านของบุคคลากรทางการศึกษา</h2>
    <p>โรงเรียน: ${esc(cfg.schoolName||'')}</p>
    <p>สังกัด: ${esc(cfg.academicYear?'สำนักงานเขตพื้นที่การศึกษา':'')}</p>
  </div>

  <div class="section">
    <div class="form-group">
      <div class="form-label">ชื่อหนังสือ:</div>
      <div class="form-value">${esc(log.bookTitle||'')}</div>
    </div>
    <div class="form-group">
      <div class="form-label">ผู้แต่ง:</div>
      <div class="form-value">${esc(log.author||'')}</div>
    </div>
    <div class="form-group">
      <div class="form-label">จำนวนหน้า:</div>
      <div class="form-value">${esc(log.pages||'')}</div>
    </div>
    <div class="form-group">
      <div class="form-label">สำนักพิมพ์:</div>
      <div class="form-value">${esc(log.publisher||'')}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-label">สรุปเนื้อหาโดยสรุปใจความสำคัญ</div>
    <div class="form-value form-value-large">${esc(log.summary||'')}</div>
  </div>

  <div class="section">
    <div class="section-label">ข้อคิดที่ได้รับ</div>
    <div class="form-value form-value-large">${esc(log.lesson||'')}</div>
  </div>

  <div class="section">
    <div class="section-label">สิ่งที่จะนำปรับใช้ในชีวิตประจำวัน</div>
    <div class="form-value form-value-large">${esc(log.lesson||'')}</div>
  </div>

  <div class="section">
    <div class="section-label">เหตุผลที่อ่านหนังสือเล่มนี้</div>
    <div class="form-value form-value-large">${esc(log.source||'')}</div>
  </div>

  <div class="section">
    <div class="form-group">
      <div class="form-label">ชื่อ-นามสกุล นักเรียน:</div>
      <div class="form-value">${esc(st.name||'')} เลขที่ ${esc(st.number||'')}</div>
    </div>
    <div class="form-group">
      <div class="form-label">ชั้น / ห้อง:</div>
      <div class="form-value">${esc(cls?.name||'')}</div>
    </div>
    <div class="form-group">
      <div class="form-label">วันที่อ่าน:</div>
      <div class="form-value">${fmtDate(log.readDate||'')}</div>
    </div>
  </div>

  <div class="sign-section">
    <div class="sign-box">
      <div class="sign-line"></div>
      <div class="sign-label">ลายเซนต์นักเรียน</div>
    </div>
    <div class="sign-box">
      <div class="sign-line"></div>
      <div class="sign-label">ลายเซนต์ครูผู้สอน</div>
    </div>
    <div class="sign-box">
      <div class="sign-line"></div>
      <div class="sign-label">ลายเซนต์ผู้บริหาร</div>
    </div>
  </div>

  <script>
    window.print();
  </script>
</body>
</html>`;
  
  const blob=new Blob([html],{type:'text/html;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;
  a.download=`reading-form-${st.studentCode||st.id}-${fmtDate(log.readDate).replace(/\\//g,'-')}.html`;
  a.click();
  URL.revokeObjectURL(url);
}


// ═══════════════════════════════════════════════
// REGISTER ROUTES & INIT
// ═══════════════════════════════════════════════
Router.reg('home', pageHome);
Router.reg('student-login', pageStudentLogin);
Router.reg('student-notebook', pageNotebook);
Router.reg('student-profile', pageStudentProfile);
Router.reg('student-history', pageStudentHistory);
Router.reg('student-dashboard', pageStudentDashboard);
Router.reg('teacher-review', pageTeacherReview);
Router.reg('teacher-classrooms', pageTeacherClassrooms);
Router.reg('teacher-dashboard', pageTeacherDashboard);
Router.reg('admin-dashboard', pageAdminDashboard);
Router.reg('admin-students', pageAdminStudents);
Router.reg('admin-teachers', pageAdminTeachers);
Router.reg('admin-classes', pageAdminClasses);
Router.reg('admin-settings', pageAdminSettings);

DB.seedDefaults();
const _sess = DB.getSession();
if(_sess){
  if(_sess.role==='student') Router.go('student-notebook');
  else if(_sess.role==='teacher') Router.go('teacher-review');
  else if(_sess.role==='admin') Router.go('admin-dashboard');
  else Router.go('home');
} else { Router.go('home'); }
