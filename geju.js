/* 格局鉴定所的规则（第二版，10-23：喜忌由格定，以《子平真诠》取运篇为底子）。
 * 原文摘在 `素材库/子平真诠-取运原文.md`。
 *   定格：有杀先论杀（年干、月干、时干透七杀就是七杀格）；没有七杀看月令：本气是比肩、劫财叫建禄格、羊刃格，
 *         本气透干取本气，本气没透取透出的中气、余气（比劫不取），都没透取本气。
 *   成格（相神）：「即以某格所成之局，分而配之」。看原局里拿什么去配格的那个字（用神）。谷雨定的口径：
 *         天干对天干、地支对地支，相邻作用最大，隔开就弱；透干、通根要看。比如七杀透干、印只在地支，就用天干的食神制杀，
 *         没有食神，伤官也行（差一点）。
 *   轻重：按位置分算力量（天干没根打六折），七杀有财生就更重；比轻重定「助谁」。
 *   运和年：每个字查这一格、这一种成法、这个轻重下的喜忌（-2～+2，出自原文），天干对天干、地支对地支，隔层打七折；
 *         再算合（合去用神、相神）、冲（冲年月急、冲日时缓，运本忌又冲更重）、刑；
 *         原局本来就重的那一类，大运、流年又同时来，算过头（谷雨：原局没有的，运来了也行）。
 *   大运天干管前五年、地支管后五年；运和年合成五档：好运、机会、平常、小坎、差运。
 *   强弱直接用五行喜忌卡的 wuxing.js；从格另算。
 * 喜忌的分数、文案都是 Claude 按原文定的草稿，等谷雨拿案例校。 */
(function (global) {
  const GAN = '甲乙丙丁戊己庚辛壬癸';
  const ZHI = '子丑寅卯辰巳午未申酉戌亥';
  const GAN_WX = { 甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土', 己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水' };
  const CG = { 子: '癸', 丑: '己癸辛', 寅: '甲丙戊', 卯: '乙', 辰: '戊乙癸', 巳: '丙庚戊', 午: '丁己', 未: '己丁乙', 申: '庚壬戊', 酉: '辛', 戌: '戊辛丁', 亥: '壬甲' };
  const BQ = Object.fromEntries(Object.entries(CG).map(([z, s]) => [z, s[0]]));
  const SHENG = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };
  const KE = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };
  const CHONG = ['子午', '丑未', '寅申', '卯酉', '辰戌', '巳亥'];
  const XING = ['子卯', '寅巳', '巳申', '丑戌', '戌未', '辰辰', '午午', '酉酉', '亥亥'];   // 寅申、丑未已算冲
  const WUHE = { 甲己: '土', 乙庚: '金', 丙辛: '水', 丁壬: '木', 戊癸: '火' };
  const POS = ['年', '月', '日', '时'];
  const QI = ['本气', '中气', '余气'];
  const pairIn = (a, b, list) => list.some(p => (p[0] === a && p[1] === b) || (p[0] === b && p[1] === a));
  const heOf = (a, b) => a !== b && Object.keys(WUHE).some(k => k.includes(a) && k.includes(b));

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

  // 八类：喜忌按这八类给分
  const CATS = ['比劫', '食神', '伤官', '财', '正官', '七杀', '正印', '偏印'];
  const CAT = { 比肩: '比劫', 劫财: '比劫', 食神: '食神', 伤官: '伤官', 正财: '财', 偏财: '财', 正官: '正官', 七杀: '七杀', 正印: '正印', 偏印: '偏印' };
  const FAM = { 比劫: '比劫', 食神: '食伤', 伤官: '食伤', 财: '财', 正官: '官杀', 七杀: '官杀', 正印: '印', 偏印: '印' };
  const FAM_SHENG = { 比劫: '食伤', 食伤: '财', 财: '官杀', 官杀: '印', 印: '比劫' };
  const FAM_KE = { 比劫: '财', 财: '印', 印: '食伤', 食伤: '官杀', 官杀: '比劫' };
  const CAT_WORD = { 比劫: '朋友、同伴', 食神: '才华、享受', 伤官: '表达、锋芒', 财: '钱、资源', 正官: '规则、职位', 七杀: '压力、魄力', 正印: '学习、贵人', 偏印: '直觉、偏门学问' };
  const ART = { 正官: 'zhengguan', 七杀: 'qisha', 正财: 'zhengcai', 偏财: 'piancai', 正印: 'zhengyin', 偏印: 'pianyin', 食神: 'shishen', 伤官: 'shangguan', 比肩: 'bijian', 劫财: 'jiecai' };
  // 简写 → 八类：比 食 伤 食伤 财 官 杀 官杀 印 正印 枭（偏印）。后写的盖过先写的
  const SHORT = { 比: ['比劫'], 食: ['食神'], 伤: ['伤官'], 食伤: ['食神', '伤官'], 财: ['财'], 官: ['正官'], 杀: ['七杀'], 官杀: ['正官', '七杀'], 印: ['正印', '偏印'], 正印: ['正印'], 枭: ['偏印'] };
  function lv(o) {
    const L = Object.fromEntries(CATS.map(c => [c, 0]));
    for (const [k, v] of Object.entries(o)) SHORT[k].forEach(c => { L[c] = v; });
    return L;
  }

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
  // 你需要怎么做：最喜的那一类多做，最忌的那一类少碰
  const DO = {
    比劫: '找搭子一起干，别什么都一个人扛；同辈和朋友就是你的运气。',
    食神: '做喜欢的手艺和作品，慢慢磨出口碑。',
    伤官: '多表达：写、讲、做内容，让别人看见你的锋芒。',
    财: '去碰钱：谈价格、接项目、做副业，把想法落成结果。',
    正官: '进一个正规的平台，按规矩一步步往上走。',
    七杀: '接有挑战的担子，压力会把你推上去。',
    正印: '多学习、考证书、找靠谱的前辈带你。',
    偏印: '钻研冷门的学问，相信自己的直觉。',
  };
  const CARE = {
    比劫: '合伙、借钱要谨慎，别为了面子硬撑。',
    食神: '别光顾着舒服，该冲的时候要冲。',
    伤官: '话说三分，少跟规则和领导硬顶。',
    财: '别为了钱透支自己，投资别贪多。',
    正官: '别被规矩捆死，也别同时伺候两套规矩。',
    七杀: '别什么担子都接，学会说不。',
    正印: '别一直准备、一直学，迟迟不出手。',
    偏印: '别想太多，计划定了就一口气做完。',
  };
  const YEAR_DO = { 比劫: '找搭子、结伴做事', 食神: '做作品、磨手艺', 伤官: '表达自己、做内容', 财: '谈钱、接项目', 正官: '争取职位、考编考证', 七杀: '接大担子、闯一把', 正印: '进修、找贵人', 偏印: '钻研、学冷门本事' };
  const YEAR_CARE = { 比劫: '合伙借钱先说清楚', 食神: '别贪舒服误了正事', 伤官: '话说三分，别顶上司', 财: '花钱和投资收一收', 正官: '别被规矩和人情捆住', 七杀: '事情别一口气全接', 正印: '别一直准备不出手', 偏印: '别想太多、计划别半途放下' };

  /* ---------- 原局的字：位置、力量、远近 ---------- */
  // 天干只看年、月、时干（日干是自己）；地支看本气。力量＝位置分，天干没根打六折
  function instOf(P) {
    const dm = P[2][0], out = [];
    const rooted = c => P.some(p => [...CG[p[1]]].some(x => GAN_WX[x] === GAN_WX[c]));
    [0, 1, 3].forEach(i => {
      if (i >= P.length) return;
      const c = P[i][0], s = ss(dm, c);
      out.push({ l: 'g', i, ch: c, ss: s, cat: CAT[s], w: [1, 1.5, 0, 1.5][i] * (rooted(c) ? 1 : 0.6), root: rooted(c) });
    });
    P.forEach((p, i) => { const s = ssZ(dm, p[1]); out.push({ l: 'z', i, ch: p[1], ss: s, cat: CAT[s], w: [1, 3, 2, 1][i] }); });
    return out;
  }
  // 远近：同一层（天干对天干、地支对地支）相邻 1、隔一位 0.6、隔两位 0.35；同一柱上下 0.7；别的 0.2
  function prox(a, b) {
    if (a === b) return 0;
    if (a.l === b.l) { const d = Math.abs(a.i - b.i); return d === 1 ? 1 : d === 2 ? 0.6 : 0.35; }
    return a.i === b.i ? 0.7 : 0.2;
  }
  const inter = (A, B) => Math.max(0, ...A.flatMap(a => B.map(b => prox(a, b))));
  const force = A => A.reduce((s, a) => s + a.w, 0);
  const posName = x => POS[x.i] + (x.l === 'g' ? '干' : '支') + x.ch;
  const closest = (A, B) => { let best = null, v = -1; for (const a of A) for (const b of B) { const p = prox(a, b); if (p > v) { v = p; best = [a, b]; } } return best; };
  const layerWord = (a, b) => (a.l === b.l ? (a.l === 'g' ? '天干对天干' : '地支对地支') + (Math.abs(a.i - b.i) === 1 ? '、紧挨着' : '') : (a.i === b.i ? '同一柱上下' : '隔层'));

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

  /* ---------- 成格：看原局拿什么配用神，定这一格的运喜忌 ---------- */
  const T = 0.5;   // 远近到 0.5 以上才算「配得上」：同层隔一位、同柱上下都算，隔层不算
  const GE_FAM = { 正官格: ['正官'], 七杀格: ['七杀'], 正财格: ['财'], 偏财格: ['财'], 正印格: ['正印', '偏印'], 偏印格: ['正印', '偏印'], 食神格: ['食神'], 伤官格: ['伤官'], 建禄格: ['比劫'], 羊刃格: ['比劫'] };

  function structOf(P, geo, strong, cong) {
    const I = instOf(P);
    let G = I.filter(x => GE_FAM[geo.name].includes(x.cat));
    // 格从中气、余气透出时，月支本气不是这一类：补一个月支的影子
    if (geo.name !== '七杀格' && !G.some(x => x.l === 'z' && x.i === 1)) G.push({ l: 'z', i: 1, ch: P[1][1], ss: geo.ss, cat: CAT[geo.ss], w: 1.5, ghost: true });
    const inG = x => G.includes(x);
    const grp = cats => I.filter(x => cats.includes(x.cat) && !inG(x));
    const g = { 比: grp(['比劫']), 食: grp(['食神']), 伤: grp(['伤官']), 财: grp(['财']), 官: grp(['正官']), 杀: grp(['七杀']), 印: grp(['正印', '偏印']), 正印: grp(['正印']), 枭: grp(['偏印']) };
    const I_ = k => inter(G, g[k]);
    const gF = force(G);
    const touG = A => A.some(x => x.l === 'g');
    let key, name, quote, L, why = '', balance = '', heavy = [], xiang = [];
    const say = (k, verb) => { const p = closest(G, g[k]); if (!p) return ''; return posName(p[1]) + p[1].ss + verb + '（' + layerWord(p[0], p[1]) + '）'; };

    if (cong) {
      key = cong; name = cong === '从强' ? '从强' : '从弱';
      L = cong === '从强' ? lv({ 比: 2, 印: 2, 食伤: 1, 财: -2, 官杀: -2 }) : lv({ 食伤: 1, 财: 2, 官杀: 1, 印: -2, 比: -2 });
      quote = '';
      why = cong === '从强' ? '日主极强，顺着旺势走' : '日主极弱，顺着盘里最旺的那股力量走';
      return { key, name, quote, why, balance, L, G, heavy, xiang, I, strong };
    }

    const caiG = I_('财'), shiI = I_('食'), shangI = I_('伤') * 0.85, yinI = I_('印'), biI = I_('比'), guanI = I_('官'), shaI = I_('杀');
    switch (geo.name) {
      case '七杀格': {
        let sF = gF;
        const shengSha = caiG >= T;
        if (shengSha) sF *= 1.4;
        const zhi = Math.max(shiI, shangI);
        if (zhi >= T && zhi >= yinI) {
          const zc = shiI >= shangI ? '食' : '伤';
          const cF = force(g.食) + 0.8 * force(g.伤);
          const r = sF / cF;
          key = 'sha-zhi'; name = zc === '食' ? '杀用食制' : '杀用伤制'; xiang = g[zc];
          why = say(zc, '来制杀');
          quote = '煞用食制，煞重食轻则助食，煞轻食重则助煞，煞食均而日主根轻则助身。忌正官之混杂，畏印绶之夺食。';
          const tag = r >= 1.4 ? '杀重食轻' : r <= 0.7 ? '杀轻食重' : '杀食均';
          balance = '七杀力量 ' + sF.toFixed(1) + (shengSha ? '（有财生）' : '') + '，' + (zc === '食' ? '食神' : '伤官') + ' ' + cF.toFixed(1) + ' → ' + tag;
          if (tag === '杀重食轻') { L = lv({ 食: 2, 伤: 1, 比: 1, 正印: 0, 枭: -2, 财: -2, 杀: -1, 官: -2 }); heavy = ['七杀']; }
          else if (tag === '杀轻食重') { L = lv({ 杀: 1, 财: 1, 食: -1, 伤: -1, 正印: 1, 枭: 0, 官: -1, 比: 0 }); heavy = zc === '食' ? ['食神'] : ['伤官']; }
          else L = strong ? lv({ 食: 1, 伤: 1, 财: 1, 杀: 0, 官: -2, 正印: -1, 枭: -2, 比: -1 }) : lv({ 比: 2, 正印: 1, 枭: -1, 食: 0, 伤: 0, 财: -1, 杀: -1, 官: -2 });
        } else if (yinI >= T) {
          key = 'sha-yin'; name = '杀用印化'; xiang = g.印; why = say('印', '来化杀');
          quote = '煞用印绶，不利财乡，伤官为美，印绶身旺，俱为福地。';
          L = lv({ 财: -2, 伤: 1, 食: 1, 印: 2, 比: 2, 杀: -1, 官: -1 });
          if (shengSha) balance = '七杀有财生，力量 ' + sF.toFixed(1);
        } else if (shengSha && strong) {
          key = 'sha-cai'; name = '七杀用财'; xiang = g.财; why = say('财', '来生杀') + '，身强扛得住';
          quote = '七煞用财……财已足，则喜食印与帮身；财未足，则喜财旺而露煞。';
          L = lv({ 财: 1, 杀: 1, 食伤: 1, 印: -1, 比: -1, 官: -1 });
        } else if (biI >= T) {
          const bF = force(g.比), r = sF / bF;
          key = 'sha-ren'; name = '用刃当杀'; xiang = g.比; why = say('比', '来扛杀');
          quote = '煞无食制而用刃当煞，煞轻刃重则喜助煞，刃轻煞重，则宜制伏，无食可夺，印运何伤？七煞既纯，杂官不利。';
          balance = '七杀 ' + sF.toFixed(1) + '，比劫 ' + bF.toFixed(1) + ' → ' + (r <= 0.8 ? '杀轻刃重' : '刃轻杀重');
          L = r <= 0.8 ? lv({ 财: 1, 杀: 1, 食伤: -1, 印: 0, 比: -1, 官: -1 }) : lv({ 食: 2, 伤: 1, 印: 1, 比: 1, 财: -2, 杀: -1, 官: -2 });
        } else {
          key = 'sha-none'; name = '杀无制化'; why = '七杀身边没有食伤来制、也没有印来化' + (shengSha ? '，还有财生它' : '');
          quote = '刃轻煞重，则宜制伏，无食可夺，印运何伤？七煞既纯，杂官不利。';
          L = strong ? lv({ 财: 1, 杀: 0, 食: 1, 伤: 1, 印: 0, 比: 0, 官: -2 }) : lv({ 印: 2, 比: 2, 食: 1, 伤: 1, 财: -2, 杀: -2, 官: -2 });
          heavy = ['七杀'];
        }
        // 杀带正官：官杀混杂，身轻助身
        if (guanI >= 0.6) {
          L.正官 = Math.min(L.正官, -2);
          if (!strong) L.比劫 = Math.max(L.比劫, 1);
          why += '；原局' + say('官', '跟七杀混杂');
        }
        break;
      }
      case '正官格': {
        if (shangI / 0.85 >= T) {
          xiang = g.印;
          if (force(g.印) > 0) {
            key = 'guan-shang-yin'; name = '官带伤用印'; why = say('伤', '在克官') + '，有印来制伤';
            quote = '正官带伤食而用印制，运喜官旺印旺之乡，财运切忌。若印绶叠出，财运亦无害矣。';
            L = lv({ 官: 2, 印: 2, 财: force(g.印) >= 4 ? 0 : -2, 食伤: -1, 杀: -1, 比: 0 });
          } else {
            key = 'guan-shang'; name = '伤官见官'; why = say('伤', '在克官') + '，没有印来护';
            quote = '何谓忌？……如正官无印，而运行伤……如此之类，皆败运也。';
            L = lv({ 印: 2, 财: 1, 伤: -2, 食: -1, 杀: -1, 官: 1, 比: 0 });
          }
        } else if (shaI >= T) {
          key = 'guan-sha'; name = '官带七杀'; why = say('杀', '跟官混杂');
          quote = '正官而带煞，伤食反为不碍。';
          L = lv({ 食: 1, 伤: 1, 比: 1, 印: 0, 财: 0, 杀: -2, 官: 0 });
        } else if (yinI >= T && yinI >= caiG) {
          key = 'guan-yin'; name = '官佩印'; xiang = g.印; why = say('印', '护着官');
          quote = '正官佩印，运喜财乡，伤食反吉。若官重身轻而佩印，则身旺为宜，不必财运也。';
          const heavyGuan = gF >= 3 && !strong;
          balance = heavyGuan ? '官重身轻' : '';
          L = heavyGuan ? lv({ 比: 2, 印: 1, 财: -1, 食伤: 0, 杀: -1, 官: -1 }) : lv({ 财: 2, 食伤: 1, 印: 0, 比: 0, 杀: -1, 官: 0 });
        } else if (caiG >= T) {
          key = 'guan-cai'; name = '官用财'; xiang = g.财; why = say('财', '生着官');
          quote = '正官用财，运喜印绶身旺之地，切忌食伤。若身旺而财轻官弱，即仍取财官运可也。';
          L = strong ? lv({ 财: 2, 官: 1, 食伤: -1, 伤: -2, 印: 0, 比: -1, 杀: -1 }) : lv({ 印: 2, 比: 1, 食伤: -2, 财: 0, 官: 0, 杀: -1 });
        } else {
          key = 'guan'; name = '正官独清'; why = '官星身边没有财、印来配';
          quote = '正官而用财印，身稍轻则取助身，官稍轻则助官。若官露而不可逢合，不可杂煞，不可重官。';
          L = strong ? lv({ 财: 2, 官: 1, 食: -1, 伤: -2, 印: -1, 比: -1, 杀: -1 }) : lv({ 印: 2, 比: 1, 财: 0, 食伤: -2, 杀: -1, 官: -1 });
        }
        if (key !== 'guan-sha') L.伤官 = Math.min(L.伤官, -1);
        L.七杀 = Math.min(L.七杀, key === 'guan-sha' ? -2 : -1);
        if (gF >= 4) { L.正官 = Math.min(L.正官, -1); heavy = ['正官']; }
        break;
      }
      case '正财格': case '偏财格': {
        const shishang = Math.max(shiI, shangI / 0.85);
        if (shaI >= T) {
          if (yinI >= T) { key = 'cai-sha-yin'; name = '财用杀印'; xiang = g.印; why = say('杀', '在旁') + '，又' + say('印', '化杀'); quote = '财用煞印，印旺最宜，逢财必忌。伤食之方，亦任意矣。'; L = lv({ 印: 2, 食伤: 1, 比: 1, 财: -2, 杀: -1, 官: -1 }); }
          else { key = 'cai-sha'; name = '财带七杀'; xiang = g.杀; why = say('杀', '被财生'); quote = '财带七煞，不论合煞制煞，运喜食伤身旺之方。'; L = lv({ 食伤: 2, 比: 2, 印: 1, 财: -2, 杀: -2, 官: -1 }); }
        } else if (guanI >= T) {
          key = 'cai-guan'; name = '财旺生官'; xiang = g.官; why = say('官', '受财生');
          quote = '财旺生官者，运喜身旺印绶，不利七煞伤官；若生官而后透印，伤官之地，不甚有害。';
          L = lv({ 印: 2, 比: 1, 杀: -2, 伤: touG(g.印) ? -1 : -2, 食: -1, 财: 0, 官: 0 });
        } else if (yinI >= T && shishang < T) {
          key = 'cai-yin'; name = '财格佩印'; xiang = g.印; why = say('印', '配财');
          quote = '财格佩印，运喜官乡，身弱逢之，最喜印旺。';
          L = lv({ 官: 2, 杀: 1, 印: strong ? 1 : 2, 比: strong ? 0 : 1, 财: -2, 食伤: -1 });
        } else if (yinI >= T) {
          key = 'cai-shi-yin'; name = '财用食印'; xiang = [...g.食, ...g.伤, ...g.印]; why = say(shiI >= shangI / 0.85 ? '食' : '伤', '生财') + '，又有印';
          quote = '财用食印，财轻则喜财食，身轻则喜比印，官运有碍，煞反不忌也。';
          L = strong ? lv({ 财: 1, 食伤: 2, 比: -1, 印: 0, 官: -1, 杀: 0 }) : lv({ 比: 2, 印: 1, 财: -1, 食伤: 0, 官: -1, 杀: 0 });
        } else if (shangI / 0.85 >= T && shangI / 0.85 >= shiI) {
          key = 'cai-shang'; name = '财带伤官'; xiang = g.伤; why = say('伤', '生财');
          quote = '财带伤官，财运则亨，煞运不利，运行官印，未见其美矣。';
          L = lv({ 财: 2, 食伤: 1, 杀: -2, 官: -1, 印: -1, 比: strong ? -1 : 0 });
        } else if (shiI >= T) {
          key = 'cai-shi'; name = '财用食生'; xiang = g.食; why = say('食', '生财');
          quote = '财用食生，财食重而身轻，则喜助身；财食轻而身重，则仍行财食。煞运不忌，官印反晦矣。';
          balance = strong ? '财食轻、身重' : '财食重、身轻';
          L = strong ? lv({ 财: 2, 食: 2, 伤: 1, 杀: 0, 官: -1, 印: -1, 比: -1 }) : lv({ 比: 2, 印: 0, 财: -1, 食伤: -1, 杀: 0, 官: -1 });
        } else {
          key = 'cai'; name = '财星独立'; why = '财星身边没有食伤、官、印来配';
          quote = '财格取运，即以财格所就之局，分而配之。';
          L = strong ? lv({ 食伤: 2, 财: 1, 官: 1, 杀: 0, 印: -1, 比: -2 }) : lv({ 比: 2, 印: 1, 财: -1, 食伤: -1, 官: -1, 杀: -1 });
        }
        if (gF >= 4.5 && !strong) heavy = ['财'];
        break;
      }
      case '正印格': case '偏印格': {
        const shishang = Math.max(shiI, shangI / 0.85);
        const bothTou = touG(g.官) && touG(g.杀);
        if (bothTou) {
          key = 'yin-guansha'; name = '印格官杀竞透'; why = '天干上正官、七杀都透了';
          quote = '印格而官煞竞透，运喜食神伤官，印旺身旺，行之亦利。若再透官煞，行财运，立见其灾矣。';
          L = lv({ 食伤: 2, 印: 1, 比: 1, 官: -2, 杀: -2, 财: -2 });
        } else if (geo.name === '偏印格' && shiI >= T) {
          key = 'yin-xiao'; name = '枭神夺食'; xiang = g.财; why = say('食', '被偏印克');
          quote = '食神带印，透财以解，运喜财旺，食伤亦吉，印与官煞皆忌也。';
          L = lv({ 财: 2, 比: 1, 伤: 0, 食: -1, 印: -2, 官: -1, 杀: -1 });
        } else if (shaI >= T) {
          xiang = g.杀;
          if (shishang >= T) { key = 'yin-sha-shi'; name = '印用杀兼食伤'; why = say('杀', '生印') + '，又有食伤'; quote = '若用煞而兼带伤食，运喜身旺印绶之方，伤食亦美，逢官遇财，皆不吉也。'; L = lv({ 印: 2, 比: 2, 食伤: 1, 官: -2, 财: -2, 杀: -1 }); }
          else { key = 'yin-sha'; name = '杀印相生'; why = say('杀', '生印'); quote = '印用七煞，运喜伤食，身旺之方，亦为美地，一见财乡，其凶立至。'; L = lv({ 食伤: 2, 比: 1, 印: 1, 财: -2, 官: -1, 杀: -1 }); }
        } else if (guanI >= T) {
          xiang = g.官;
          if (shishang >= T) { key = 'yin-guan-shi'; name = '印用官带伤食'; why = say('官', '生印') + '，又有伤食'; quote = '若用官而带伤食，运喜官旺印绶之乡，伤食为害，逢煞不忌矣。'; L = lv({ 官: 2, 印: 2, 杀: 1, 食伤: -2, 财: -1, 比: 0 }); }
          else if (gF >= 4 || strong) { key = 'yin-guan-heavy'; name = '官露印重'; why = say('官', '生印') + '，印已经很重'; quote = '其印绶用官者，官露印重，财运反吉，伤食之方，亦为最利。'; L = lv({ 财: 2, 食伤: 2, 官: 0, 杀: 0, 印: -1, 比: -1 }); heavy = ['正印', '偏印']; }
          else { key = 'yin-guan'; name = '官印相生'; why = say('官', '生印'); quote = '印绶用官……运喜官旺印绶之乡。'; L = lv({ 官: 1, 印: 1, 比: 1, 财: -1, 食伤: -1, 杀: 0 }); }
        } else if (caiG >= T) {
          key = 'yin-cai'; name = '印绶遇财'; why = say('财', '在克印');
          quote = '印绶遇财，运喜劫地，官印亦亨，财乡则忌。';
          L = lv({ 比: 2, 官: 1, 印: 1, 财: -2, 食伤: -1, 杀: 0 });
        } else if (shishang >= T) {
          key = 'yin-shi'; name = '印用食伤'; xiang = [...g.食, ...g.伤]; why = say(shiI >= shangI / 0.85 ? '食' : '伤', '泄秀');
          quote = '印绶而用伤食，财运反吉，伤食亦利，若行官运，反见其灾，煞运则反能为福矣。';
          L = lv({ 财: gF < 2.5 ? -1 : 2, 食伤: 1, 杀: 1, 官: -2, 印: -1, 比: 0 });
        } else {
          key = 'yin'; name = '印星独立'; why = '印星身边没有官杀、食伤、财来配';
          quote = '印格取运，即以印格所成之局，分而配之。';
          L = strong ? lv({ 财: 2, 食伤: 1, 官: 0, 杀: 0, 印: -2, 比: -1 }) : lv({ 官: 1, 杀: 1, 印: 2, 比: 1, 财: -2, 食伤: -1 });
          if (strong) heavy = ['正印', '偏印'];
        }
        break;
      }
      case '食神格': {
        const xiaoI = inter(G, g.枭);
        if (xiaoI >= T) {
          key = 'shi-xiao'; name = '食神带枭'; why = say('枭', '在夺食');
          quote = '食神带印，透财以解，运喜财旺，食伤亦吉，印与官煞皆忌也。';
          L = lv({ 财: 2, 食: 1, 伤: 1, 比: 0, 枭: -2, 正印: -1, 官: -1, 杀: -1 });
        } else if (shaI >= T) {
          const sF = force(g.杀), r = gF / sF;
          xiang = g.杀;
          balance = '食神 ' + gF.toFixed(1) + '，七杀 ' + sF.toFixed(1) + ' → ' + (r >= 1.5 ? '食重杀轻' : '食杀相当');
          if (r >= 1.5) { key = 'shi-sha-light'; name = '食神制杀（食重杀轻）'; why = say('杀', '被食神制'); quote = '若食太重而煞轻，印运最利，逢财反吉矣。'; L = lv({ 印: 2, 财: 1, 杀: 0, 比: 1, 食伤: 0, 官: -1 }); heavy = ['食神']; }
          else { key = 'shi-sha'; name = '食神制杀'; why = say('杀', '被食神制'); quote = '食伤带煞，喜行印绶，身旺，食伤亦为美运，财则最忌。'; L = lv({ 正印: 2, 枭: 1, 比: 1, 食伤: strong ? 1 : 0, 财: -2, 官: -1, 杀: -1 }); }
        } else if (caiG >= T) {
          key = 'shi-cai'; name = '食神生财'; xiang = g.财; why = say('财', '受食神生');
          quote = '食神生财，财食轻，则行财食，财食重则喜帮身。官煞之方，俱为不美。';
          balance = strong ? '财食轻、身重' : '财食重、身轻';
          L = strong ? lv({ 财: 2, 食: 2, 伤: 1, 官: -1, 杀: -1, 正印: -1, 枭: -2, 比: -1 }) : lv({ 比: 2, 正印: 0, 枭: -2, 财: -1, 食伤: -1, 官: -1, 杀: -1 });
        } else {
          key = 'shi'; name = '食神独立'; why = '食神身边没有财、杀、枭来配';
          quote = '食神取运，即以食神所成之局，分而配之。';
          L = strong ? lv({ 财: 2, 食: 1, 伤: 1, 比: -1, 枭: -2, 正印: -1, 官: -1, 杀: 0 }) : lv({ 比: 2, 正印: 1, 枭: -1, 财: -1, 食伤: -1, 官: -1, 杀: -1 });
        }
        if (gF >= 4.5) heavy = [...new Set([...heavy, '食神'])];
        break;
      }
      case '伤官格': {
        if (shaI >= T) {
          if (yinI >= T) { key = 'shang-sha-yin'; name = '伤官用杀印'; xiang = [...g.杀, ...g.印]; why = say('杀', '在旁') + '，又' + say('印', '配伤'); quote = '伤官而用煞印，印运最利，伤食亦亨，杂官非吉，逢财即危。'; L = lv({ 印: 2, 食伤: 1, 比: 1, 官: -2, 财: -2, 杀: 0 }); }
          else {
            const sF = force(g.杀);
            xiang = g.杀;
            if (sF >= gF) { key = 'shang-sha-heavy'; name = '伤官驾杀（杀重）'; why = say('杀', '被伤官制'); quote = '惟七煞根重，则运喜伤食，印绶身旺亦吉，而逢财为凶矣。'; L = lv({ 食伤: 2, 印: 1, 比: 1, 财: -2, 官: -2, 杀: -1 }); }
            else { key = 'shang-sha'; name = '伤官驾杀（伤重）'; why = say('杀', '被伤官制'); quote = '伤官带煞，喜印忌财，然伤重煞轻，运喜印而财亦吉。'; L = lv({ 印: 2, 财: 1, 比: 1, 官: -2, 杀: 0, 食伤: -1 }); heavy = ['伤官']; }
            balance = '伤官 ' + gF.toFixed(1) + '，七杀 ' + sF.toFixed(1);
          }
        } else if (yinI >= T && caiG >= T) {
          const more = force(g.财) > force(g.印);
          key = 'shang-cai-yin'; name = '伤官兼用财印'; xiang = [...g.财, ...g.印]; why = '财和印都配着伤官，' + (more ? '财多' : '印多');
          quote = '伤官而兼用财印，其财多而带印者，运喜助印，印多而带财者，运喜助财。';
          L = more ? lv({ 印: 2, 比: 1, 财: -1, 官: -1, 杀: 0, 食伤: 0 }) : lv({ 财: 2, 食伤: 1, 印: -1, 官: -1, 杀: 0, 比: -1 });
        } else if (yinI >= T) {
          key = 'shang-yin'; name = '伤官配印'; xiang = g.印; why = say('印', '配伤官');
          quote = '伤官佩印，运行官煞为宜，印运亦吉，伤食不碍，财地则凶。';
          L = lv({ 官: 1, 杀: 1, 印: 2, 食伤: 0, 财: -2, 比: 1 });
        } else if (caiG >= T) {
          key = 'shang-cai'; name = '伤官生财'; xiang = g.财; why = say('财', '受伤官生');
          quote = '伤官用财，财旺身轻，则利印比；身强财浅，则喜财运，伤官亦宜。';
          L = strong ? lv({ 财: 2, 伤: 1, 食: 1, 印: -1, 比: -1, 官: -1, 杀: 0 }) : lv({ 印: 2, 比: 2, 财: -1, 食伤: -1, 官: -2, 杀: -1 });
        } else if (guanI >= T) {
          key = 'shang-guan'; name = '伤官见官'; why = say('官', '被伤官克');
          quote = '伤官用官，运喜财印，不利食伤。';
          L = lv({ 财: 2, 印: 2, 食伤: -2, 官: 0, 杀: -1, 比: -1 });
        } else {
          key = 'shang'; name = '伤官独立'; why = '伤官身边没有财、印、杀来配';
          quote = '伤官取运，即以伤官所成之局，分而配之。';
          L = strong ? lv({ 财: 2, 食伤: 1, 印: -1, 比: -1, 官: -2, 杀: 0 }) : lv({ 印: 2, 比: 1, 财: -1, 食伤: -1, 官: -2, 杀: -1 });
        }
        if (!['shang-sha-yin', 'shang-yin', 'shang-guan'].includes(key)) L.正官 = Math.min(L.正官, -1);
        if (gF >= 4.5) heavy = [...new Set([...heavy, '伤官'])];
        break;
      }
      case '羊刃格': case '建禄格': {
        const isRen = geo.name === '羊刃格';
        const shishang = Math.max(shiI, shangI / 0.85);
        if (guanI >= T && shaI >= T) {
          key = 'lu-guansha'; name = isRen ? '刃逢官杀并出' : '禄劫官杀并出'; why = '正官、七杀都配着月令';
          quote = isRen ? '阳刃而官煞并出，不论去官去煞，运喜制伏，身旺亦利，财地官乡反为不吉也。' : '禄劫而官煞并出，不论合煞留官，存官制煞，运喜伤食，比肩亦宜，印绶未为良图，财官亦非福运。';
          L = isRen ? lv({ 食伤: 2, 比: 1, 印: 0, 财: -2, 官: -2, 杀: -1 }) : lv({ 食伤: 2, 比: 1, 印: -1, 财: -1, 官: -1, 杀: -1 });
        } else if (shaI >= T && (isRen || shishang < T)) {
          key = 'lu-sha'; name = isRen ? '羊刃驾杀' : '禄劫用杀'; xiang = g.杀; why = say('杀', '制刃');
          quote = '阳刃用煞，煞不甚旺，则运喜助煞；煞若太重，则运喜身旺印绶，伤食亦不为忌。';
          balance = strong ? '杀不甚旺' : '杀太重';
          L = strong ? lv({ 财: 2, 杀: 1, 食伤: -1, 印: -1, 比: -1, 官: -1 }) : lv({ 印: 2, 比: 1, 食伤: 1, 财: -2, 杀: -1, 官: -1 });
        } else if (shaI >= T) {
          const r = force(g.杀) / (force(g.食) + force(g.伤));
          key = 'lu-sha-shi'; name = '禄劫用杀食制'; xiang = [...g.杀, ...g.食, ...g.伤]; why = say('杀', '在旁') + '，又有食伤制它';
          quote = '禄劫用煞食制，食重煞轻，则运宜助煞；食轻煞重，则运喜助食。';
          balance = r <= 0.8 ? '食重杀轻' : '食轻杀重';
          L = r <= 0.8 ? lv({ 杀: 1, 财: 1, 食伤: -1, 印: 0, 比: 0, 官: -1 }) : lv({ 食: 2, 伤: 1, 比: 1, 财: -1, 杀: -1, 官: -1, 枭: -1 });
        } else if (guanI >= T) {
          key = 'lu-guan'; name = isRen ? '羊刃用官' : '建禄用官'; xiang = g.官; why = say('官', '管着月令');
          if (isRen) {
            const deep = g.官.some(x => x.l === 'z');
            quote = '阳刃用官，则运喜助官，然命中官星根深，则印绶比劫之方，反为美运，但不喜伤食合官耳。';
            balance = deep ? '官星根深' : '';
            L = deep ? lv({ 印: 1, 比: 1, 财: 0, 官: 0, 食: -1, 伤: -2, 杀: -1 }) : lv({ 财: 2, 官: 2, 印: 0, 比: -1, 食: -1, 伤: -2, 杀: -1 });
          } else {
            quote = '禄劫用官，印护者喜财，怕官星之逢合，畏七煞之相乘。伤食不能为害，劫比未即为凶。';
            L = lv({ 财: 2, 官: 1, 印: 1, 食伤: 0, 比: 0, 杀: -2 });
          }
        } else if (caiG >= T) {
          key = 'lu-cai'; name = isRen ? '羊刃用财' : '禄劫用财'; xiang = g.财; why = say('财', '配着月令');
          quote = '禄劫用财而带伤食，财食重则喜印绶，而不忌比肩；财食轻则宜助财，而不喜印比。逢煞无伤，遇官非福。';
          balance = strong ? '财食轻' : '财食重';
          L = strong ? lv({ 财: 2, 食伤: 2, 印: -1, 比: -1, 杀: 0, 官: -1 }) : lv({ 印: 2, 比: 1, 财: -1, 食伤: -1, 杀: 0, 官: -1 });
        } else if (shishang >= T) {
          key = 'lu-shi'; name = isRen ? '羊刃用伤食' : '禄劫用伤食'; xiang = [...g.食, ...g.伤]; why = say(shiI >= shangI / 0.85 ? '食' : '伤', '泄秀');
          quote = '禄劫而用伤食，财运最宜，煞亦不忌，行印非吉，透官不美。若命中伤食太重，则财运固利，而印亦不忌矣。';
          L = lv({ 财: 2, 食伤: 1, 杀: 0, 印: force([...g.食, ...g.伤]) >= 4 ? 0 : -2, 官: -2, 比: -1 });
        } else {
          key = 'lu'; name = isRen ? '羊刃独旺' : '禄劫独立'; why = '月令身边没有官杀、财、食伤来配';
          quote = '禄劫取运，即以禄劫所成之局，分而配之。';
          L = strong ? lv({ 官: 2, 财: 2, 食伤: 1, 杀: 1, 印: -2, 比: -2 }) : lv({ 印: 1, 比: 1, 财: -1, 官: 0, 杀: -1, 食伤: -1 });
          if (strong) heavy = ['比劫'];
        }
        break;
      }
    }
    return { key, name, quote, why, balance, L, G, heavy, xiang, I, strong };
  }

  /* ---------- 一个字（大运或流年）对这个格是喜是忌 ---------- */
  // 常见的说法，带方向：+ 是好事、- 是坏事；方向跟这个字的喜忌对不上就不用
  const SPECIAL = {
    '伤官>正官': ['-', '伤官见官'], '正官>伤官': ['-', '伤官见官'], '偏印>食神': ['-', '枭神夺食'], '食神>偏印': ['-', '食神遇枭'],
    '正官>七杀': ['-', '官杀混杂'], '七杀>正官': ['-', '官杀混杂'], '食神>七杀': ['+', '食神制杀'], '伤官>七杀': ['+', '伤官制杀'],
    '正印>七杀': ['+', '印来化杀'], '偏印>七杀': ['+', '印来化杀'], '财>七杀': ['-', '财来生杀'], '比劫>七杀': ['+', '比劫来扛杀'], '七杀>七杀': ['-', '七杀再来，压力加码'],
    '财>正官': ['+', '财来生官'], '正印>正官': ['+', '印来护官'], '偏印>正官': ['+', '印来护官'], '正官>正官': ['-', '官星再来（重官）'],
    '财>正印': ['-', '财来坏印'], '财>偏印': ['-', '财来坏印'], '正官>正印': ['+', '官印相生'], '正官>偏印': ['+', '官印相生'], '七杀>正印': ['+', '杀印相生'], '七杀>偏印': ['+', '杀印相生'],
    '食神>财': ['+', '食伤生财'], '伤官>财': ['+', '食伤生财'], '比劫>财': ['-', '比劫夺财'], '正官>财': ['+', '财旺生官'],
    '正印>伤官': ['+', '伤官配印'], '偏印>伤官': ['+', '伤官配印'], '财>伤官': ['+', '伤官生财'], '财>食神': ['+', '食神生财'], '比劫>食神': ['+', '比劫生食伤'], '比劫>伤官': ['+', '比劫生食伤'],
    '正印>比劫': ['+', '印来生身'], '偏印>比劫': ['+', '印来生身'], '正官>比劫': ['+', '官来制刃'], '七杀>比劫': ['+', '杀来制刃'], '食神>比劫': ['+', '泄秀'], '伤官>比劫': ['+', '泄秀'], '财>比劫': ['+', '有财可用'],
  };
  const KE_NAME = { '偏印>食神': '枭神夺食', '正印>食神': '印来克食神', '偏印>伤官': '印来克伤官', '正印>伤官': '印来克伤官', '伤官>正官': '伤官见官', '财>正印': '财来坏印', '财>偏印': '财来坏印', '比劫>财': '比劫夺财' };
  // cat：来的字是哪一类；useCat：格的用神；xiangCats：原局拿来配用神的相神；v：喜忌分
  const FAM_CATS = { 比劫: ['比劫'], 食伤: ['食神', '伤官'], 财: ['财'], 官杀: ['正官', '七杀'], 印: ['正印', '偏印'] };
  function phraseOf(cat, useCat, xiangCats, v, strong, L) {
    const sign = v >= 0.3 ? '+' : v <= -0.3 ? '-' : '0';
    const a = FAM[cat];
    if (sign === '-') {
      const hit = xiangCats.find(x => FAM_KE[a] === FAM[x]);
      if (hit) return KE_NAME[cat + '>' + hit] || cat + '来克' + hit + '（' + hit + '是你拿来配格的）';
    }
    const sp = SPECIAL[cat + '>' + useCat];
    if (sp && sp[0] === sign) return sp[1];
    const u = FAM[useCat];
    if (sign === '-' && strong && (a === '比劫' || a === '印')) return cat + '来帮身，身已经够旺';
    if (sign === '-' && FAM_SHENG[a] === u) return cat + '来生' + useCat + '，' + useCat + '更重了';
    const nxt = FAM_SHENG[a];
    if (sign === '-' && L && FAM_CATS[nxt].every(c => L[c] < 0)) return cat + '来生' + nxt + '（' + nxt + '在你盘里是忌）';
    if (sign === '0') return cat + '来，影响不大';
    if (a === u) return sign === '+' ? cat + '来帮' + useCat : cat + '再来，' + useCat + '太多';
    if (FAM_SHENG[a] === u) return cat + '来生' + useCat;
    if (FAM_KE[a] === u) return cat + '来' + (sign === '+' ? '制' : '克') + useCat;
    if (FAM_SHENG[u] === a) return cat + '来泄' + useCat;
    return sign === '+' ? cat + '来，正是你要的' : cat + '来，跟格不合';
  }
  const markOf = v => (v >= 0.5 ? '喜' : v <= -0.5 ? '忌' : '平');

  // ch：大运或流年的一个字；isG：天干还是地支
  function judgeChar(ch, isG, P, st) {
    const dm = P[2][0];
    const s = isG ? ss(dm, ch) : ssZ(dm, ch), cat = CAT[s];
    let v = st.L[cat];
    const layer = isG ? 'g' : 'z';
    const same = st.G.some(x => x.l === layer && !x.ghost) || st.xiang.some(x => x.l === layer);
    if (!same) v *= 0.7;                                  // 天干对天干、地支对地支；隔层打七折
    const reasons = [];
    const useCat = CAT[st.G[0] ? st.G[0].ss : '比肩'] || '比劫';
    const xiangCats = [...new Set(st.xiang.map(x => x.cat))];
    const lab = (isG ? ch : ch + '（' + BQ[ch] + '）') + s;
    const keyX = x => st.G.includes(x) || st.xiang.includes(x);
    let he = null;
    if (isG) {
      // 合：合住原局天干的用神、相神（只算一次）
      he = st.I.find(x => x.l === 'g' && heOf(ch, x.ch) && keyX(x));
      if (he) v -= 1;
    }
    reasons.push(lab + '：' + phraseOf(cat, useCat, xiangCats, st.L[cat], st.strong, st.L) + (he ? '，还合住' + posName(he) + '（' + he.ss + '）' : ''));
    if (!isG) {
      for (const x of st.I.filter(x => x.l === 'z')) {
        if (pairIn(ch, x.ch, CHONG)) {
          const w = [0.8, 1, 0.5, 0.4][x.i];
          const lx = st.L[x.cat];
          if (keyX(x) || lx > 0) { v -= w; reasons.push('冲' + posName(x) + (x.i === 1 ? '（月令）' : '') + (x.i <= 1 ? '，来得急' : '')); }
          else if (lx < 0) { v += 0.5 * w; reasons.push('冲开' + posName(x) + '（' + x.ss + '是忌）'); }   // 冲去忌神反而好
          if (st.L[cat] < 0) v -= 0.5 * w;               // 运既忌而又冲则重
        } else if (pairIn(ch, x.ch, XING) && (keyX(x) || x.i === 1)) { v -= 0.5; reasons.push('跟' + posName(x) + '相刑'); }
      }
    }
    return { ch, isG, s, cat, v: Math.round(v * 100) / 100, mark: markOf(v), reasons };
  }

  /* ---------- 合局：原局、大运、流年的地支凑成三合、三会、半合 ---------- */
  const SANHE = [['申子辰', '水'], ['亥卯未', '木'], ['寅午戌', '火'], ['巳酉丑', '金']];
  const SANHUI = [['亥子丑', '水'], ['寅卯辰', '木'], ['巳午未', '火'], ['申酉戌', '金']];
  // base：已经在的地支（原局，算流年时再加大运）；add：新来的那个字。只算新来的字凑出来的局
  function heJuOf(P, base, add, st) {
    const dm = P[2][0];
    const all = [...base, add];
    const level = (inSet, members, kind) => inSet.length === 3 ? 1 : kind === '三合' && inSet.length === 2 && inSet.includes(members[1]) ? 0.4 : 0;   // 半合要带子午卯酉
    let best = null;
    const consider = (set, wx, kind, mult) => {
      const members = [...set];
      if (!members.includes(add)) return;
      const inAll = members.filter(c => all.includes(c)), inBase = members.filter(c => base.includes(c));
      const k = (level(inAll, members, kind) - level(inBase, members, kind)) * mult;   // 新来的字让局成了多少
      if (k <= 0) return;
      const cats = [...new Set([...GAN].filter(c => GAN_WX[c] === wx).map(c => CAT[ss(dm, c)]))];
      const lvAvg = cats.reduce((t, c) => t + st.L[c], 0) / cats.length;
      const v = Math.round(lvAvg * k * 100) / 100;
      if (!best || Math.abs(v) > Math.abs(best.v)) best = { v, say: (inAll.length === 3 ? members.join('') + kind : inAll.join('') + '半合') + wx + '局，' + cats.join('、') + (lvAvg > 0 ? '变强，正是你要的' : lvAvg < 0 ? '变强，是你怕的' : '变强') };
    };
    SANHE.forEach(([set, wx]) => consider(set, wx, '三合', 1.5));
    SANHUI.forEach(([set, wx]) => consider(set, wx, '三会', 1.5));
    return best && best.v !== 0 ? best : null;
  }

  /* ---------- 大运流年：只看最近三年 ---------- */
  const RES = {
    好运: { n: '好运年', say: '运和年都站在你这边，适合主动出手。' },
    机会: { n: '机会年', say: '大运一般，这一年开了个窗口，抓住就往前走一步。' },
    平常: { n: '平常年', say: '不好不坏，按自己的节奏来就好。' },
    小坎: { n: '小坎年', say: '流年有点磨人，好在大运托着你，扛得过去。' },
    差运: { n: '差运年', say: '运和年都不太顺，适合休整、补基础，给自己留余地。' },
  };
  function luckOf(P, st, opt) {
    const dz = P[2][1];
    const y0 = opt.year;
    const years = [y0, y0 + 1, y0 + 2];
    const dy = (opt.dayun || []).filter(d => d && d.gz && d.startYear);
    const stepOf = y => { let s = null; for (const d of dy) if (d.startYear <= y) s = d; return s; };
    const rows = years.map(y => {
      const gz = yearGZ(y);
      const a = judgeChar(gz[0], true, P, st), b = judgeChar(gz[1], false, P, st);
      const step = stepOf(y);
      let yun = null, half = '';
      if (step) {
        half = y - step.startYear < 5 ? '前' : '后';
        yun = half === '前' ? judgeChar(step.gz[0], true, P, st) : judgeChar(step.gz[1], false, P, st);
        const yh = heJuOf(P, P.map(p => p[1]), step.gz[1], st);
        if (yh) { const k = half === '后' ? 1 : 0.5; yun = { ...yun, v: Math.round((yun.v + yh.v * k) * 100) / 100, reasons: [...yun.reasons, '大运' + yh.say] }; yun.mark = markOf(yun.v); }
      }
      let score = a.v + b.v;
      const extra = [];
      const hj = heJuOf(P, [...P.map(p => p[1]), ...(step ? [step.gz[1]] : [])], gz[1], st);
      if (hj) { score += hj.v; extra.push(hj.say); }
      // 原局本来就重的那一类，大运、流年又一起来：过头
      if (yun && st.heavy.includes(yun.cat) && (a.cat === yun.cat || b.cat === yun.cat)) { score -= 1.5; extra.push(yun.cat + '原局就重，大运流年又一起来，过头了'); }
      const nian = score >= 1 ? '喜' : score <= -1 ? '忌' : '平';
      const ys = yun ? (yun.v >= 0.6 ? '喜' : yun.v <= -0.6 ? '忌' : '平') : null;
      let res;
      if (nian === '平') res = '平常';
      else if (ys === null) res = nian === '喜' ? '好运' : '差运';
      else if (nian === '喜') res = ys === '忌' && !(score >= 3 && yun.v > -1.5) ? '机会' : '好运';
      else res = ys === '忌' || (score <= -3 && yun.v < 1.5) ? '差运' : '小坎';
      const good = res === '好运' || res === '机会', bad = res === '小坎' || res === '差运';
      const pick = good ? [a, b].sort((p, q) => q.v - p.v)[0] : [a, b].sort((p, q) => p.v - q.v)[0];
      const tip = good ? '适合' + YEAR_DO[pick.cat] + '。' : bad ? YEAR_CARE[pick.cat] + '。' : '';
      const chong = pairIn(gz[1], dz, CHONG);
      return { y, gz, a, b, step, half, yun, ys, score: Math.round(score * 100) / 100, nian, res, resName: RES[res].n, say: RES[res].say, tip, extra, chong, dz };
    });
    const groups = [];
    for (const r of rows) {
      const key = r.step ? r.step.gz + r.step.startYear : 'none';
      let gp = groups.find(x => x.key === key);
      if (!gp) {
        gp = { key, step: r.step, rows: [] };
        if (r.step) {
          const s = r.step, ga = judgeChar(s.gz[0], true, P, st), zb = judgeChar(s.gz[1], false, P, st);
          const lead = r.yun;                       // 这一年管事的字，已算上大运凑成的合局
          const label = lead.v >= 0.6 ? '好运' : lead.v <= -0.6 ? '坏运' : '平运';
          Object.assign(gp, { gz: s.gz, from: s.startYear, to: s.startYear + 9, ga, zb, label, firstHalf: r.half, firstYear: r.y, lead });
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
    const st = structOf(P, geo, W.strong, cong);
    const luck = luckOf(P, st, opt);
    const special = specialOf(P, W);

    // 喜好：八类按分数分喜、平、忌
    const like = [], mid = [], dislike = [];
    for (const c of CATS) (st.L[c] >= 1 ? like : st.L[c] <= -1 ? dislike : mid).push({ n: c, v: st.L[c], w: CAT_WORD[c] });
    like.sort((a, b) => b.v - a.v); dislike.sort((a, b) => a.v - b.v);
    // 怎么做：最喜的两类，最忌的一类
    const todo = [...like.slice(0, 2).map(x => DO[x.n]), ...(dislike[0] ? [CARE[dislike[0].n]] : [])];

    // 职业
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
      index: W.index, level: W.level, strong: W.strong, cong, special,
      sub: { key: st.key, name: st.name, quote: st.quote, why: st.why, balance: st.balance, heavy: st.heavy },
      L: st.L, like, mid, dislike, todo, jobs, luck,
    };
  }

  global.Geju = { judge, parse, yearGZ, GAN, ZHI, GAN_WX, BQ, GE, GE_LIST, CATS, ss, ssZ };
})(typeof window !== 'undefined' ? window : globalThis);
