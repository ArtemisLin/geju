/* 格局鉴定所的规则。
 * 口径和 `AI提示词-八字格局.md` 一致，改规则时两边一起改：
 *   定格：有杀先论杀（年干、月干、时干透七杀就是七杀格）；没有七杀看月令：本气是比肩、劫财叫建禄格、羊刃格，
 *         本气透干取本气，本气没透取透出的中气、余气（比劫不取），都没透取本气。
 *   强弱：直接用五行喜忌卡的 wuxing.js（Wuxing.judge），两张卡的强弱永远一样；偏强及以上算身强。
 *   喜忌：身强喜官杀、食伤、财，身弱喜印、比劫；再按格局改四处（正官格怕伤官、伤官格怕正官、
 *         食神格怕偏印、偏印格怕食神，印格身弱官杀算喜）。从格反过来：从强喜印比，从弱喜克泄耗。
 *   大运流年：只看最近三年。大运天干管前五年、地支管后五年；运和年合成五档：
 *         运喜年喜好运年、运忌年喜机会年、运喜年忌小坎年、运忌年忌差运年、流年一喜一忌平常年。
 * 文案（格的特征、怎么做、解析）是 Claude 的草稿，等谷雨改。 */
(function (global) {
  const GAN = '甲乙丙丁戊己庚辛壬癸';
  const ZHI = '子丑寅卯辰巳午未申酉戌亥';
  const GAN_WX = { 甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土', 己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水' };
  const CG = { 子: '癸', 丑: '己癸辛', 寅: '甲丙戊', 卯: '乙', 辰: '戊乙癸', 巳: '丙庚戊', 午: '丁己', 未: '己丁乙', 申: '庚壬戊', 酉: '辛', 戌: '戊辛丁', 亥: '壬甲' };
  const BQ = Object.fromEntries(Object.entries(CG).map(([z, s]) => [z, s[0]]));
  const SHENG = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };
  const KE = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };
  const CHONG = ['子午', '丑未', '寅申', '卯酉', '辰戌', '巳亥'];
  const WUHE = { 甲己: '土', 乙庚: '金', 丙辛: '水', 丁壬: '木', 戊癸: '火' };
  const POS = ['年', '月', '日', '时'];
  const QI = ['本气', '中气', '余气'];

  // 十神：以日主为「我」
  function ss(dm, c) {
    const a = GAN_WX[dm], b = GAN_WX[c], same = GAN.indexOf(dm) % 2 === GAN.indexOf(c) % 2;
    if (a === b) return same ? '比肩' : '劫财';
    if (SHENG[a] === b) return same ? '食神' : '伤官';
    if (KE[a] === b) return same ? '偏财' : '正财';
    if (KE[b] === a) return same ? '七杀' : '正官';
    return same ? '偏印' : '正印';
  }
  const ssZ = (dm, z) => ss(dm, BQ[z]);           // 地支只看本气
  const BIG = { 比肩: '比劫', 劫财: '比劫', 食神: '食伤', 伤官: '食伤', 正财: '财', 偏财: '财', 正官: '官杀', 七杀: '官杀', 正印: '印', 偏印: '印' };
  const BIG_MEMBERS = { 印: ['正印', '偏印'], 比劫: ['比肩', '劫财'], 食伤: ['食神', '伤官'], 财: ['正财', '偏财'], 官杀: ['正官', '七杀'] };
  const BIG_ORDER = ['印', '比劫', '食伤', '财', '官杀'];
  const ALL_SS = ['正印', '偏印', '比肩', '劫财', '食神', '伤官', '正财', '偏财', '正官', '七杀'];
  const SS_WORD = { 比肩: '朋友、同伴', 劫财: '竞争、合伙', 食神: '才华、享受', 伤官: '表达、创新', 正财: '稳定收入', 偏财: '机会、人脉', 正官: '规则、职位', 七杀: '压力、魄力', 正印: '学习、贵人', 偏印: '直觉、偏门学问' };
  const BIG_WORD = { 印: '学习、贵人', 比劫: '朋友、同伴', 食伤: '表达、作品', 财: '钱、资源', 官杀: '规则、责任' };
  const ART = { 正官: 'zhengguan', 七杀: 'qisha', 正财: 'zhengcai', 偏财: 'piancai', 正印: 'zhengyin', 偏印: 'pianyin', 食神: 'shishen', 伤官: 'shangguan', 比肩: 'bijian', 劫财: 'jiecai' };

  function parse(s) {
    s = String(s || '').replace(/\s/g, '');
    if (s.length !== 6 && s.length !== 8) return null;
    const P = [];
    for (let i = 0; i < s.length; i += 2) {
      const g = s[i], z = s[i + 1], gi = GAN.indexOf(g), zi = ZHI.indexOf(z);
      if (gi < 0 || zi < 0 || gi % 2 !== zi % 2) return null;
      P.push(g + z);
    }
    return P;
  }
  const yearGZ = y => GAN[((y - 4) % 10 + 10) % 10] + ZHI[((y - 4) % 12 + 12) % 12];

  /* ---------- 十个格：文案草稿 ---------- */
  // no：牌号；ss：配图用的十神（建禄用比肩、羊刃用劫财）；tag：一句话；feat：特征；jobs：职业
  const GE = {
    正官格: { no: 1, ss: '正官', tag: '心里有把尺', feat: '你可能是群里最讲规矩的那个，答应的事一定办到。在有章法的地方你最能发挥，也最容易被领导看见；越是正规的平台，越显出你的稳。', jobs: ['公务员', '事业单位', '管理岗', '人事行政', '法务合规', '教育行政'] },
    七杀格: { no: 2, ss: '七杀', tag: '越难越来劲', feat: '压力越大你越清醒，别人往后退的时候你往前冲。你适合扛硬仗、拍板做决定，平平稳稳的日子反而让你闲得发慌。', jobs: ['创业者', '带团队的领导', '警察军人', '外科医生', '律师', '运动员'] },
    正财格: { no: 3, ss: '正财', tag: '稳稳把日子过富', feat: '你踏实、会算账，钱来得不一定快，但守得住。一步一个脚印，把手里的资源慢慢变成看得见的结果。', jobs: ['会计财务', '银行', '实体店', '采购', '做生意'] },
    偏财格: { no: 4, ss: '偏财', tag: '机会嗅觉满格', feat: '你对机会特别敏感，朋友多、路子广，钱喜欢流动着来。适合周转、对接、做生意，让你守着一份死工资会憋坏。', jobs: ['投资理财', '金融证券', '贸易电商', '直播带货', '商务营销', '中介'] },
    正印格: { no: 5, ss: '正印', tag: '天生的好学生', feat: '你学东西快，也愿意照顾人，身边总有长辈、贵人愿意拉你一把。学历、资质、口碑，是你最硬的底气。', jobs: ['教师', '学者研究', '出版编辑', '文书行政', '医护', '顾问'] },
    偏印格: { no: 6, ss: '偏印', tag: '脑回路自带天线', feat: '你的想法跟别人不一样，对冷门学问、看不见的东西特别有感觉。直觉准、悟性高，适合钻研别人搞不懂的领域。', jobs: ['研究发明', '策划', '高科技', '心理咨询', '命理玄学', '中医', '设计'] },
    食神格: { no: 7, ss: '食神', tag: '会吃会玩会生活', feat: '你有手艺、有品味，会享受，也让身边的人舒服。做自己喜欢的事最出彩，越放松越有灵感。', jobs: ['餐饮厨师', '艺术设计', '演讲培训', '服务业', '幼教', '技术'] },
    伤官格: { no: 8, ss: '伤官', tag: '才华带刺', feat: '你聪明、嘴快、眼光毒，看到不合理的地方就想改。才华藏不住，适合靠作品和表达出头，不适合憋屈地听话。', jobs: ['演讲主持', '歌唱绘画', '翻译语言', '律师', '技术人才', '创意广告'] },
    建禄格: { no: 9, ss: '比肩', tag: '靠自己打下江山', feat: '你独立，习惯自己扛事，很少开口求人。路是一步步自己打出来的，越能自己做主，越顺。', jobs: ['自由职业', '合伙创业', '服务业', '健身教练', '运动员', '演员'] },
    羊刃格: { no: 10, ss: '劫财', tag: '狠起来自己都怕', feat: '你有狠劲和冲劲，想要的就去争，竞争越激烈越兴奋。行动力强，适合冲在最前面。', jobs: ['自由职业', '销售', '运动员', '军警', '酒水食品', '化妆品'] },
  };
  const GE_LIST = Object.keys(GE);
  // 按定格那个字的五行补两个职业（出自谷雨手写笔记「事业与财运」）
  const WX_JOBS = {
    木: ['教育', '出版', '服装设计', '园林园艺', '中药', '茶饮'],
    火: ['传媒', '演艺摄影', '美容化妆', '品牌营销', '培训讲师', '餐饮'],
    土: ['建筑', '房地产', '仓储', '农业', '保险', '古董文玩'],
    金: ['珠宝首饰', '金融银行', '律师法官', '外科牙医', '机械五金', '裁缝'],
    水: ['销售', '旅游', '交通运输', '酒店', '娱乐', '流动性行业'],
  };

  // 最需要的那一类（用神）：格 × 强弱
  const USE = {
    正官格: { s: ['财', '财生官：钱和资源撑起你的位置'], w: ['印', '官印相生：有资质、有靠山，名正言顺往上走'] },
    七杀格: { s: ['食伤', '食神制杀：用真本事降服压力'], w: ['印', '杀印相生：找靠山、拿资质，把压力化成权威'] },
    正财格: { s: ['食伤', '食伤生财：才华和手艺变成钱'], w: ['比劫', '比劫帮身：找人一起扛，钱才拿得住'] },
    偏财格: { s: ['食伤', '食伤生财：才华和手艺变成钱'], w: ['比劫', '比劫帮身：找人一起扛，钱才拿得住'] },
    正印格: { s: ['食伤', '印旺要泄：学到的东西要讲出来、做出来'], w: ['官杀', '官印相生：进组织、扛责任，靠山自然来'] },
    偏印格: { s: ['财', '偏财制枭：把奇思妙想落到能赚钱的事上'], w: ['官杀', '杀印相生：在压力和规则里，你的悟性最值钱'] },
    食神格: { s: ['财', '食伤生财：手艺和品味变成钱'], w: ['比劫', '比劫生食伤：有底气、有伙伴，才华才有力气'] },
    伤官格: { s: ['财', '伤官生财：锋芒用在赚钱上最划算'], w: ['印', '伤官配印：才华有了分寸，最厉害'] },
    建禄格: { s: ['官杀', '建禄用官：找个好平台，把一身力气用对地方'], w: ['印', '印生比劫：有贵人托着，底气更足'] },
    羊刃格: { s: ['官杀', '羊刃驾杀：有对手、有规矩，狠劲才不乱用'], w: ['印', '印生比劫：有贵人托着，底气更足'] },
  };
  // 你需要怎么做：喜的那一类多做，怕的那一类少碰
  const DO = {
    印: '多学习、考证书、找靠谱的前辈带你；累了允许自己停下来充电。',
    比劫: '找搭子一起干，别什么都一个人扛；同辈和朋友就是你的运气。',
    食伤: '多输出：写、讲、做作品，让别人看见你的才华。',
    财: '去碰钱：谈价格、接项目、做副业，把想法落成结果。',
    官杀: '进一个好平台，接有挑战的担子，压力会把你推上去。',
  };
  const CARE = {
    印: '别一直准备、一直学，迟迟不出手。',
    比劫: '合伙、借钱要谨慎，别为了面子硬撑。',
    食伤: '话说三分，少跟规则和领导硬顶。',
    财: '别为了钱透支自己，投资别贪多。',
    官杀: '别什么担子都接，学会说不。',
  };
  const CARE_OVR = {
    伤官: '伤官见官：有意见换个说法讲，别当众顶上司。',
    正官: '少待在规矩死板的地方，跟规则硬碰硬，吃亏的是你。',
    偏印: '枭神夺食：别想太多，计划定了就一口气做完。',
    食神: '枭神夺食：想法多是好事，别一边想一边把开心的事都放下。',
  };

  /* ---------- 组合（课件里的常见格局） ---------- */
  const isBig = (x, b) => BIG[x] === b;
  const COMBOS = [
    { n: '食伤生财', good: 1, t: (a, b) => isBig(a, '食伤') && isBig(b, '财'), say: '才华、手艺变成钱' },
    { n: '杀印相生', good: 1, t: (a, b) => a === '七杀' && isBig(b, '印'), say: '压力化成权威' },
    { n: '官印相生', good: 1, t: (a, b) => a === '正官' && isBig(b, '印'), say: '有规矩、有靠山，往上走' },
    { n: '食神制杀', good: 1, t: (a, b) => a === '食神' && b === '七杀', say: '用真本事摆平难题' },
    { n: '伤官配印', good: 1, t: (a, b) => a === '伤官' && isBig(b, '印'), say: '锋芒有了分寸，才华成器' },
    { n: '比劫生食伤', good: 1, t: (a, b) => isBig(a, '比劫') && isBig(b, '食伤'), say: '有底气，敢表达' },
    { n: '印生比劫', good: 1, t: (a, b) => isBig(a, '印') && isBig(b, '比劫'), say: '有贵人托着，底气足' },
    { n: '伤官见官', good: 0, t: (a, b) => a === '伤官' && b === '正官', say: '跟领导、规则容易顶上' },
    { n: '枭神夺食', good: 0, t: (a, b) => a === '偏印' && b === '食神', say: '计划容易被打断，想得多' },
    { n: '比劫夺财', good: 0, t: (a, b) => isBig(a, '比劫') && isBig(b, '财'), say: '合伙、借钱容易吃亏' },
    { n: '财坏印', good: 0, t: (a, b) => isBig(a, '财') && isBig(b, '印'), say: '为了钱放下学习和靠山' },
    { n: '财滋官杀', good: 0, t: (a, b) => isBig(a, '财') && b === '七杀', say: '钱养出了压力' },
  ];
  // pairs：[[来的字, 配的字], ...]；single：来的十神（七杀攻身用）。good＝true 只要好的组合，false 只要要留意的
  function combosOf(pairs, single, geSS, good) {
    const out = [];
    for (const [a, b] of pairs) for (const c of COMBOS) {
      if (!!c.good !== good) continue;
      if ((c.t(a, b) || c.t(b, a)) && !out.some(o => o.n === c.n)) out.push({ n: c.n, say: c.say });
    }
    if (!good && single.includes('七杀') && BIG[geSS] !== '印' && !out.some(o => o.n === '七杀攻身')) out.push({ n: '七杀攻身', say: '压力和事情都多' });
    return out;
  }

  /* ---------- 定格 ---------- */
  function geOf(P) {
    const g = P.map(p => p[0]), z = P.map(p => p[1]), dm = g[2];
    const tou = [[1, '月'], [3, '时'], [0, '年']].filter(([i]) => i < g.length);   // 透干只看年、月、时干
    const steps = [];
    const sha = tou.find(([i]) => ss(dm, g[i]) === '七杀');
    if (sha) {
      steps.push(sha[1] + '干' + g[sha[0]] + '是七杀 → 有杀先论杀');
      return { name: '七杀格', ss: '七杀', ch: g[sha[0]], steps };
    }
    steps.push('天干上没有七杀 → 看月令');
    const mz = z[1], cg = [...CG[mz]];
    steps.push('月支' + mz + '，藏' + cg.map((c, k) => c + '（' + ss(dm, c) + (cg.length > 1 ? '·' + QI[k] : '') + '）').join('、'));
    const where = c => tou.filter(([i]) => g[i] === c).map(([, n]) => n + '干');
    const ben = ss(dm, cg[0]);
    let ch, why;
    if (ben === '比肩' || ben === '劫财') {
      const name = ben === '比肩' ? '建禄格' : '羊刃格';
      steps.push('本气' + cg[0] + '是' + ben + ' → ' + name);
      // 力气往哪送：月干、时干、年干里第一个官、财、食伤
      const to = tou.map(([i]) => ss(dm, g[i])).find(x => ['正官', '正财', '偏财', '食神', '伤官'].includes(x)) || '';
      return { name, ss: ben, ch: cg[0], steps, liqi: to };
    }
    if (where(cg[0]).length) { ch = cg[0]; why = '本气' + ch + '透在' + where(ch).join('、') + ' → 取本气'; }
    else {
      const t = cg.slice(1).find(c => where(c).length && !['比肩', '劫财'].includes(ss(dm, c)));
      if (t) { ch = t; why = '本气没透，' + QI[cg.indexOf(t)] + t + '透在' + where(t).join('、') + ' → 取' + t; }
      else { ch = cg[0]; why = '天干上' + (cg.slice(1).some(c => where(c).length) ? '只透了比劫' : '一个都没透') + ' → 取本气' + ch; }
    }
    steps.push(why);
    const s = ss(dm, ch);
    steps.push(ch + '是' + s + ' → ' + s + '格');
    return { name: s + '格', ss: s, ch, steps };
  }

  /* ---------- 喜忌 ---------- */
  function xijiOf(geName, strongSide, cong) {
    const xi = {}, notes = [];
    for (const s of ALL_SS) xi[s] = strongSide ? ['官杀', '食伤', '财'].includes(BIG[s]) : ['印', '比劫'].includes(BIG[s]);
    if (cong) return { xi, notes };
    const set = (s, v, why) => { if (xi[s] !== v) { xi[s] = v; notes.push(why); } };
    if (geName === '正官格') set('伤官', false, '你是正官格，伤官来了就是伤官见官，所以伤官算忌');
    if (geName === '伤官格') set('正官', false, '你是伤官格，正官来了就是伤官见官，所以正官算忌');
    if (geName === '食神格') set('偏印', false, '你是食神格，偏印来了就是枭神夺食，所以偏印算忌');
    if (geName === '偏印格') set('食神', false, '你是偏印格，食神来了就是枭神夺食，所以食神算忌');
    if ((geName === '正印格' || geName === '偏印格') && !strongSide) {
      set('正官', true, '你是印格又偏弱，官杀来生印就是官印相生，所以官杀算喜');
      set('七杀', true, '你是印格又偏弱，官杀来生印就是官印相生，所以官杀算喜');
    }
    return { xi, notes: [...new Set(notes)] };
  }

  /* ---------- 大运流年：只看最近三年 ---------- */
  const RES = {
    好运: { n: '好运年', say: '运和年都站在你这边，适合主动出手。' },
    机会: { n: '机会年', say: '大运一般，这一年开了个窗口，抓住就往前走一步。' },
    平常: { n: '平常年', say: '一半顺一半磨，按自己的节奏来就好。' },
    小坎: { n: '小坎年', say: '流年有点磨人，好在大运托着你，扛得过去。' },
    差运: { n: '差运年', say: '运和年都不太顺，适合休整、补基础，给自己留余地。' },
  };
  const YEAR_DO = { 印: '进修、考证、找贵人', 比劫: '找搭子、结伴做事', 食伤: '输出作品、表达自己', 财: '谈钱、接项目、做生意', 官杀: '争取职位、接大担子' };
  const YEAR_CARE = { 印: '别一直准备不出手', 比劫: '合伙借钱先说清楚', 食伤: '话说三分，作品先打磨', 财: '花钱和投资收一收', 官杀: '事情别一口气全接' };

  function luckOf(P, geo, xi, opt) {
    const dm = P[2][0], dz = P[2][1];
    const y0 = opt.year;
    const years = [y0, y0 + 1, y0 + 2];
    const dy = (opt.dayun || []).filter(d => d && d.gz && d.startYear);
    const stepOf = y => { let s = null; for (const d of dy) if (d.startYear <= y) s = d; return s; };
    const mark = s => (xi[s] ? '喜' : '忌');
    const rows = years.map(y => {
      const gz = yearGZ(y), a = ss(dm, gz[0]), b = ssZ(dm, gz[1]);
      const nian = xi[a] && xi[b] ? '喜' : !xi[a] && !xi[b] ? '忌' : '平';
      const st = stepOf(y);
      let yun = null, half = '', yunCh = '', yunSS = '';
      if (st) { half = y - st.startYear < 5 ? '前' : '后'; yunCh = half === '前' ? st.gz[0] : st.gz[1]; yunSS = half === '前' ? ss(dm, st.gz[0]) : ssZ(dm, st.gz[1]); yun = xi[yunSS]; }
      let res;
      if (nian === '平') res = '平常';
      else if (yun === null) res = nian === '喜' ? '好运' : '差运';
      else res = yun ? (nian === '喜' ? '好运' : '小坎') : (nian === '喜' ? '机会' : '差运');
      const good = res === '好运' || res === '机会', bad = res === '小坎' || res === '差运';
      const combos = good || bad ? combosOf([[a, geo.ss], [b, geo.ss], [a, b]], [a, b], geo.ss, good) : [];
      const pickBig = (good ? [a, b].find(s => xi[s]) : [a, b].find(s => !xi[s])) || a;
      const tip = good ? '适合' + YEAR_DO[BIG[pickBig]] + '。' : bad ? YEAR_CARE[BIG[pickBig]] + '。' : '';
      const chong = CHONG.some(p => (p[0] === gz[1] && p[1] === dz) || (p[1] === gz[1] && p[0] === dz));
      return { y, gz, a, b, ma: mark(a), mb: mark(b), nian, step: st, half, yunCh, yunSS, yun, res, resName: RES[res].n, say: RES[res].say, tip, combos, chong, dz };
    });
    // 按大运分组
    const groups = [];
    for (const r of rows) {
      const key = r.step ? r.step.gz + r.step.startYear : 'none';
      let gp = groups.find(x => x.key === key);
      if (!gp) {
        gp = { key, step: r.step, rows: [] };
        if (r.step) {
          const s = r.step, gS = ss(dm, s.gz[0]), zS = ssZ(dm, s.gz[1]);
          const label = xi[gS] && xi[zS] ? '好运' : !xi[gS] && !xi[zS] ? '坏运' : (r.half === '前' ? xi[gS] : xi[zS]) ? '好运' : '坏运';
          const lead = r.half === '前' ? s.gz[0] : s.gz[1], leadSS = r.half === '前' ? gS : zS;
          Object.assign(gp, {
            gz: s.gz, from: s.startYear, to: s.startYear + 9, gS, zS, mg: mark(gS), mz: mark(zS), label, firstHalf: r.half, firstYear: r.y,
            combos: combosOf([[leadSS, geo.ss]], [leadSS], geo.ss, label === '好运'),
            lead, leadSS,
          });
        }
        groups.push(gp);
      }
      gp.rows.push(r);
    }
    return { years, groups, hasDayun: dy.length > 0 };
  }

  /* ---------- 特殊格局：只提醒 ---------- */
  function specialOf(P, W) {
    const g = P.map(p => p[0]), z = P.map(p => p[1]), dm = g[2], me = GAN_WX[dm];
    const out = [];
    if (W.cong === '从强') out.push(W.sum.同我 > W.sum.生我 ? { n: '专旺格', say: '一种五行一家独大' } : { n: '从格（从强）', say: '日主极强，顺着盘里最旺的那股力量走' });
    if (W.cong === '从弱') out.push({ n: '从格（从弱）', say: '日主极弱，顺着盘里最旺的那股力量走' });
    const noRoot = !z.some(b => [...CG[b]].some(c => GAN_WX[c] === me));
    for (const i of [1, 3]) {
      if (i >= g.length) continue;
      const k = Object.keys(WUHE).find(p => p.includes(dm) && p.includes(g[i]) && dm !== g[i]);
      if (k && GAN_WX[BQ[z[1]]] === WUHE[k] && noRoot) { out.push({ n: '化格', say: '日主和' + POS[i] + '干' + g[i] + '合在一起，化成了' + WUHE[k] }); break; }
    }
    return out;
  }

  /* ---------- 总入口 ---------- */
  // opt：{ year：今年（按立春算）, dayun：[{gz, startYear}] }
  function judge(s, opt) {
    opt = opt || {};
    const P = parse(s);
    if (!P || !global.Wuxing) return { error: true };
    const has4 = P.length === 4, dm = P[2][0];
    const geo = geOf(P);
    const info = GE[geo.name];
    const W = global.Wuxing.judge(P.join(''));
    const cong = W.cong || '';
    const strongSide = cong === '从强' ? false : cong === '从弱' ? true : W.strong;
    const { xi, notes } = xijiOf(geo.name, strongSide, cong);
    const luck = luckOf(P, geo, xi, opt);
    const special = specialOf(P, W);

    // 喜好：按大类列，一类里两个十神喜忌不一样的就拆开写
    const like = [], dislike = [];
    for (const b of BIG_ORDER) {
      const [m1, m2] = BIG_MEMBERS[b];
      if (xi[m1] === xi[m2]) (xi[m1] ? like : dislike).push({ n: b, w: BIG_WORD[b] });
      else for (const m of [m1, m2]) (xi[m] ? like : dislike).push({ n: m, w: SS_WORD[m] });
    }
    // 怎么做：先用神那一类，再补一类喜的，最后一句要留意的
    const use = cong ? null : USE[geo.name][strongSide ? 's' : 'w'];
    const xiBig = BIG_ORDER.filter(b => BIG_MEMBERS[b].some(m => xi[m]));
    const first = use ? use[0] : xiBig[0];
    const second = xiBig.find(b => b !== first);
    const todo = [DO[first], ...(second ? [DO[second]] : [])];
    const ovr = ['伤官', '正官', '偏印', '食神'].find(m => notes.some(t => t.includes(m + '算忌')));
    const careBig = BIG_ORDER.find(b => b === BIG[geo.ss] && BIG_MEMBERS[b].every(m => !xi[m])) || BIG_ORDER.find(b => BIG_MEMBERS[b].every(m => !xi[m]));
    todo.push(ovr ? CARE_OVR[ovr] : CARE[careBig]);

    // 解析
    const seed = P.reduce((a, p) => a + GAN.indexOf(p[0]) * 7 + ZHI.indexOf(p[1]) * 3, 0);
    const wx = GAN_WX[geo.ch];
    const wxJobs = WX_JOBS[wx].filter(j => !info.jobs.includes(j));
    const extra = [wxJobs[seed % wxJobs.length], wxJobs[(seed + 3) % wxJobs.length]].filter((x, i, a) => a.indexOf(x) === i);
    const jobs = [...info.jobs.slice(0, 4), ...extra];

    return {
      pillars: P, has4, dm, me: GAN_WX[dm],
      tg: P.map((p, i) => (i === 2 ? '日主' : ss(dm, p[0]))), zg: P.map(p => ssZ(dm, p[1])),
      ge: geo.name, geSS: geo.ss, geCh: geo.ch, geWx: wx, steps: geo.steps, liqi: geo.liqi || null,
      no: info.no, tag: info.tag, feat: info.feat, art: ART[info.ss], artSS: info.ss,
      index: W.index, level: W.level, strong: W.strong, strongSide, cong, special,
      xi, notes, like, dislike, use, todo, jobs, luck,
    };
  }

  global.Geju = { judge, parse, yearGZ, GAN, ZHI, GAN_WX, BQ, GE, GE_LIST, ss, ssZ };
})(typeof window !== 'undefined' ? window : globalThis);
