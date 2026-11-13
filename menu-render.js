/* 윙키클래스북 중국어 메뉴판 렌더러 (브라우저·Node 공용)
 * renderMenu(menu, { images: {key: url}, preview: bool }) -> 완성 HTML 문자열
 * menu = { meta:{store, storeZh, storeEn, tagline:{ko,zh}, theme, accent, langs:['zh','ko','en'], sample, aiNote},
 *          sections:[{ko, zh, en, layout:'feature'|'grid'|'list', items:[{ko, zh, en, price, unit:{ko,zh}, desc:{ko,zh}, tags:[], img, imgSource:'ai'|'photo'}]}],
 *          info:{ origin:[{ko,zh}], pay:['alipay','wechat','unionpay','card','cash'], hours:{ko,zh}, address:{ko,zh}, phone, wechat, notice:[{ko,zh}], phrases:bool } }
 */
(function (root) {
  const THEMES = {
    warm:    { bg: '#F6EFE4', ink: '#2B2118', sub: '#7A6A58', card: '#FFFDF8', line: '#E6D9C6', accent: '#B4532A', head: '#2B2118', headInk: '#F6EFE4', serif: true,  radius: 14, label: '웜 한식' },
    dark:    { bg: '#121212', ink: '#F4EFE6', sub: '#A89F92', card: '#1D1D1D', line: '#2E2E2E', accent: '#D4A24C', head: '#0A0A0A', headInk: '#F4EFE6', serif: true,  radius: 6,  label: '다크 골드' },
    pop:     { bg: '#FFD23F', ink: '#161616', sub: '#4A4A4A', card: '#FFFFFF', line: '#161616', accent: '#E63946', head: '#161616', headInk: '#FFD23F', serif: false, radius: 18, label: '팝 컬러' },
    minimal: { bg: '#FFFFFF', ink: '#222222', sub: '#7C7C7C', card: '#F6F5F2', line: '#E7E5E0', accent: '#8A9A7B', head: '#FFFFFF', headInk: '#222222', serif: false, radius: 10, label: '미니멀' },
    navy:    { bg: '#F2F5F9', ink: '#10233A', sub: '#5B6B7E', card: '#FFFFFF', line: '#D8E0EA', accent: '#E8734A', head: '#10233A', headInk: '#FFFFFF', serif: true,  radius: 10, label: '네이비' }
  };
  const TAGS = {
    spicy1: ['微辣', '#E85D3A'], spicy2: ['中辣', '#D63A1F'], spicy3: ['特辣', '#B01E0C'], nospicy: ['不辣', '#5A8F4E'],
    pork: ['含猪肉', '#8C5A3C'], beef: ['含牛肉', '#7A3B2E'], chicken: ['含鸡肉', '#9C6B2F'], seafood: ['含海鲜', '#2E6E9E'], raw: ['生食', '#2E6E9E'],
    veg: ['素食', '#4F8A3C'], alcohol: ['含酒精', '#6B4FA0'], best: ['人气', '#E63946'], sig: ['招牌', '#B4532A'], new: ['新品', '#0E9F8E'],
    share2: ['2人份', '#555'], peanut: ['含坚果', '#9A6A1F']
  };
  const PAY = { alipay: '支付宝', wechat: '微信支付', unionpay: '银联卡', card: '刷卡', cash: '现金' };
  const PHRASES = [['不要辣', '안 맵게 해 주세요'], ['少一点辣', '덜 맵게 해 주세요'], ['可以打包吗？', '포장돼요?'], ['买单', '계산할게요'], ['再来一份', '하나 더 주세요'], ['我要这个', '이걸로 주세요']];
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const won = p => (p === '' || p == null) ? '' : (p === 0 || p === '0') ? '免费 무료' : (typeof p === 'number' || /^\d+$/.test(String(p))) ? '₩' + Number(p).toLocaleString('en-US') : esc(p);

  function css(t, accent, langs) {
    const A = accent || t.accent;
    const SF = t.serif ? '"Noto Serif SC","Noto Serif KR",serif' : '"Noto Sans SC","Noto Sans KR",sans-serif';
    return `@page{size:A4;margin:11mm 10mm}
*{box-sizing:border-box}html{background:${t.bg};-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{margin:0;font-family:"Noto Sans SC","Noto Sans KR",sans-serif;color:${t.ink};background:${t.bg};word-break:keep-all;line-height:1.35}
.mn{max-width:774px;margin:0 auto}
.hd{background:${t.head};color:${t.headInk};border-radius:${t.radius}px;padding:22px 26px 18px;position:relative;${t.head === t.bg ? `border:1.5px solid ${t.line};` : ''}}
.hd .wel{font-size:11px;letter-spacing:3px;color:${A};font-weight:700}
.hd h1{font-family:${SF};font-size:34px;line-height:1.1;margin:6px 0 2px;font-weight:800}
.hd .ko{font-size:15px;opacity:.85;font-weight:700}.hd .tg{font-size:13px;opacity:.8;margin-top:8px}
.hd .smp{position:absolute;right:16px;top:12px;font-size:9.5px;border:1px solid currentColor;border-radius:99px;padding:2px 8px;opacity:.75}
.how{display:flex;gap:10px;align-items:center;margin:12px 0 4px;font-size:12px;color:${t.sub}}.how b{background:${A};color:#fff;border-radius:99px;padding:2px 10px;font-size:11.5px}
.sec{margin-top:16px;break-inside:auto}
.st{display:flex;align-items:baseline;gap:10px;border-bottom:2px solid ${t.line === '#161616' ? '#161616' : A};padding-bottom:5px;margin-bottom:10px;break-after:avoid}
.st h2{font-family:${SF};font-size:21px;margin:0;font-weight:800}.st span{font-size:13px;color:${t.sub};font-weight:700}
.fe{display:grid;grid-template-columns:1fr 1fr;gap:12px}.gr{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.it{background:${t.card};border-radius:${t.radius}px;overflow:hidden;position:relative;break-inside:avoid;${t.line === '#161616' ? 'border:2px solid #161616;' : ''}}
.ph{position:relative;background:${t.line};overflow:hidden}.fe .ph{aspect-ratio:3/2}.gr .ph{aspect-ratio:4/3}
.ph img{width:100%;height:100%;object-fit:cover;display:block}
.ph .ai{position:absolute;right:6px;bottom:6px;background:rgba(0,0,0,.55);color:#fff;font-size:8.5px;padding:1px 6px;border-radius:99px}
.ph .wait{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;font-size:11px;color:${t.sub};padding:8px;background:repeating-linear-gradient(45deg,${t.card},${t.card} 8px,${t.line} 8px,${t.line} 16px)}
.ph .wait b{font-size:12.5px;color:${t.ink}}
.no{position:absolute;left:8px;top:8px;background:${A};color:#fff;font-weight:800;font-size:12px;min-width:24px;height:24px;border-radius:99px;display:flex;align-items:center;justify-content:center;padding:0 6px;z-index:2}
.bd{padding:9px 12px 11px}.fe .bd{padding:11px 14px 13px}
.nm{display:flex;justify-content:space-between;gap:8px;align-items:flex-start}
.zh{font-weight:800;font-size:15.5px}.fe .zh{font-size:19px;font-family:${SF}}
.pr{font-weight:800;color:${A};white-space:nowrap;font-size:15px}.fe .pr{font-size:18px}
.kn{font-size:12px;color:${t.sub};font-weight:700}.en{font-size:10.5px;color:${t.sub};font-style:italic}
.ds{font-size:11.5px;margin-top:5px;color:${t.ink};opacity:.88}.ds small{display:block;color:${t.sub};font-size:10.5px;opacity:1}
.tgs{display:flex;flex-wrap:wrap;gap:4px;margin-top:6px}.tgs i{font-style:normal;font-size:9.5px;color:#fff;border-radius:4px;padding:1px 5px;font-weight:700}
.ls{columns:2;column-gap:22px}.li{break-inside:avoid;display:grid;grid-template-columns:26px 1fr auto;gap:0 8px;align-items:baseline;padding:7px 0;border-bottom:1px dashed ${t.line === '#161616' ? '#16161655' : t.line}}
.li .n{font-weight:800;color:${A};font-size:12.5px}.li .zh{font-size:14.5px}.li .pr{font-size:14px}.li .sub{grid-column:2/4}
.ft{margin-top:18px;display:grid;grid-template-columns:1.2fr 1fr;gap:12px;break-inside:avoid}
.box{background:${t.card};border-radius:${t.radius}px;padding:12px 14px;font-size:11px;${t.line === '#161616' ? 'border:2px solid #161616;' : ''}}
.box h3{font-size:12.5px;margin:0 0 6px;color:${A}}.box p{margin:2px 0}.box .k{color:${t.sub}}
.pay{display:flex;flex-wrap:wrap;gap:5px;margin-top:4px}.pay i{font-style:normal;border:1px solid ${t.line === '#161616' ? '#161616' : A};border-radius:99px;padding:1px 8px;font-size:10.5px;font-weight:700}
.phr{display:grid;grid-template-columns:1fr 1fr;gap:3px 12px}.phr div b{font-size:12px}.phr div span{color:${t.sub};font-size:10.5px;margin-left:5px}
.fn{margin-top:10px;font-size:9.5px;color:${t.sub};text-align:center}
.en{display:none}
@media (max-width:600px){.hd h1{font-size:26px}.fe{grid-template-columns:1fr}.gr{grid-template-columns:1fr 1fr}.ls{columns:1}.ft{grid-template-columns:1fr}body{padding:10px}}
@media screen{body{padding:18px}}`;
  }

  function photo(it, images, preview) {
    if (!it.img && !it.imgWait) return '';
    const src = it.img && images && images[it.img];
    if (src) return `<div class="ph"><img src="${esc(src)}" alt="${esc(it.zh || it.ko)}">${it.imgSource === 'ai' ? '<span class="ai">示意图 · AI</span>' : ''}</div>`;
    if (preview) return `<div class="ph"><div class="wait">${it.imgWait === 'ai' ? '<b>AI 사진 생성 예정</b>' + (it.imgDesc ? esc(it.imgDesc).slice(0, 40) : '메뉴 이름에 맞게 만듭니다') : '<b>사진 자리</b>사진을 올려 주세요'}</div></div>`;
    return '';
  }
  function zhName(it, preview) { return it.zh ? esc(it.zh) : (preview ? '<span style="opacity:.55">（中文翻译中）</span>' : esc(it.ko)); }
  function tags(it) { return (it.tags || []).filter(t => TAGS[t]).map(t => `<i style="background:${TAGS[t][1]}">${TAGS[t][0]}</i>`).join(''); }
  function card(it, n, images, preview) {
    const d = it.desc || {};
    return `<div class="it"><span class="no">${n}</span>${photo(it, images, preview)}<div class="bd"><div class="nm"><div><div class="zh">${zhName(it, preview)}</div><div class="kn">${esc(it.ko)}</div></div><div class="pr">${won(it.price)}${it.unit && it.unit.zh ? `<div class="kn" style="text-align:right">${esc(it.unit.zh)}</div>` : ''}</div></div>${d.zh || d.ko ? `<div class="ds">${esc(d.zh || '')}<small>${esc(d.ko || '')}</small></div>` : ''}${(it.tags || []).length ? `<div class="tgs">${tags(it)}</div>` : ''}</div></div>`;
  }
  function row(it, n, preview) {
    return `<div class="li"><span class="n">${n}</span><div><span class="zh">${zhName(it, preview)}</span> <span class="kn">${esc(it.ko)}</span></div><span class="pr">${won(it.price)}</span>${(it.tags || []).length || (it.desc && it.desc.zh) ? `<div class="sub">${it.desc && it.desc.zh ? `<span class="ds" style="margin:0">${esc(it.desc.zh)} <small style="display:inline">${esc(it.desc.ko || '')}</small></span>` : ''} <span class="tgs" style="display:inline-flex;margin:2px 0 0">${tags(it)}</span></div>` : ''}</div>`;
  }

  function renderMenu(m, opt) {
    opt = opt || {};
    const meta = m.meta || {}, info = m.info || {}, t = THEMES[meta.theme] || THEMES.warm, langs = meta.langs || ['zh', 'ko'];
    const images = opt.images || {}, preview = !!opt.preview;
    let n = 0, anyAi = false, anyImg = false;
    const secs = (m.sections || []).filter(s => (s.items || []).some(i => i.ko || i.zh)).map(s => {
      const items = s.items.filter(i => i.ko || i.zh);
      items.forEach(i => { if (i.img && images[i.img]) { anyImg = true; if (i.imgSource === 'ai') anyAi = true; } if (i.imgWait === 'ai') anyAi = true; });
      const lay = s.layout || 'list';
      let body;
      if (lay === 'auto' || lay === 'auto-feature') {
        const ph = items.filter(i => i.img || i.imgWait), tx = items.filter(i => !(i.img || i.imgWait));
        body = (ph.length ? `<div class="${lay === 'auto-feature' && ph.length <= 2 ? 'fe' : 'gr'}">${ph.map(i => card(i, ++n, images, preview)).join('')}</div>` : '') + (tx.length ? `<div class="ls" style="margin-top:${ph.length ? 10 : 0}px">${tx.map(i => row(i, ++n, preview)).join('')}</div>` : '');
      } else body = lay === 'list' ? `<div class="ls">${items.map(i => row(i, ++n, preview)).join('')}</div>` : `<div class="${lay === 'feature' ? 'fe' : 'gr'}">${items.map(i => card(i, ++n, images, preview)).join('')}</div>`;
      return `<section class="sec"><div class="st"><h2>${esc(s.zh || s.ko)}</h2><span>${esc(s.ko || '')}</span></div>${body}</section>`;
    }).join('');
    const origin = (info.origin || []).filter(o => o.ko || o.zh);
    const pay = (info.pay || []).filter(p => PAY[p]);
    const left = `<div class="box">${origin.length ? `<h3>原产地标示 · 원산지 표시</h3>${origin.map(o => `<p>${esc(o.zh || '')} <span class="k">${esc(o.ko || '')}</span></p>`).join('')}` : ''}${(info.notice || []).length ? `<h3 style="margin-top:8px">提示 · 안내</h3>${info.notice.map(o => `<p>${esc(o.zh || '')} <span class="k">${esc(o.ko || '')}</span></p>`).join('')}` : ''}${(info.hours && (info.hours.zh || info.hours.ko)) || (info.address && (info.address.zh || info.address.ko)) || info.phone || info.wechat ? `<h3 style="margin-top:8px">店铺信息 · 매장 정보</h3>${info.hours && (info.hours.zh || info.hours.ko) ? `<p>营业时间 ${esc(info.hours.zh || '')} <span class="k">${esc(info.hours.ko || '')}</span></p>` : ''}${info.address && (info.address.zh || info.address.ko) ? `<p>地址 ${esc(info.address.zh || '')} <span class="k">${esc(info.address.ko || '')}</span></p>` : ''}${info.phone ? `<p>电话 ${esc(info.phone)}</p>` : ''}${info.wechat ? `<p>微信 ${esc(info.wechat)}</p>` : ''}` : ''}</div>`;
    const right = `<div class="box">${pay.length ? `<h3>支付方式 · 결제</h3><div class="pay">${pay.map(p => `<i>${PAY[p]}</i>`).join('')}</div>` : ''}${info.phrases === false ? '' : `<h3 style="margin-top:${pay.length ? 10 : 0}px">点餐常用语 · 주문할 때 쓰는 말</h3><div class="phr">${PHRASES.map(([z, k]) => `<div><b>${z}</b><span>${k}</span></div>`).join('')}</div>`}</div>`;
    const notes = [anyImg || anyAi ? '图片仅供参考，请以实物为准 · 사진은 참고용입니다' : '', anyAi ? '标有“示意图 · AI”的图片为AI生成的示意图 · "示意图 · AI" 표시 사진은 AI로 만든 예시 이미지입니다' : '', '价格单位：韩元(₩)，含增值税 · 가격은 부가세 포함 원화 기준'].filter(Boolean);
    const fonts = 'family=Noto+Sans+KR:wght@400;700;800&family=Noto+Sans+SC:wght@400;700;800' + (t.serif ? '&family=Noto+Serif+KR:wght@700;800&family=Noto+Serif+SC:wght@700;800' : '');
    return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(meta.storeZh || meta.store)} 菜单 · ${esc(meta.store)} 중국어 메뉴판</title><link href="https://fonts.googleapis.com/css2?${fonts}&display=swap" rel="stylesheet"><style>${css(t, meta.accent, langs)}</style></head><body><div class="mn">
<header class="hd">${meta.sample ? '<span class="smp">制作示例 · 虚拟店铺 / 제작 예시 · 가상 매장</span>' : ''}<div class="wel">欢迎光临</div><h1>${esc(meta.storeZh || meta.store)}</h1><div class="ko">${esc(meta.store)}</div>${meta.tagline && (meta.tagline.zh || meta.tagline.ko) ? `<div class="tg">${[meta.tagline.zh, meta.tagline.ko].filter(Boolean).map(esc).join(' · ')}</div>` : ''}</header>
<div class="how"><b>点餐方法</b>请告诉店员菜品编号 · 메뉴 번호로 주문하실 수 있어요</div>
${secs}
<div class="ft">${left}${right}</div>
<div class="fn">${notes.join('<br>')}</div>
</div></body></html>`;
  }
  const api = { renderMenu, THEMES, TAGS, PAY };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.WingkeyMenu = api;
})(typeof window !== 'undefined' ? window : globalThis);
