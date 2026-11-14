/* Wingkey Classbook privacy-minimized GA4 (consent-first). No Google request before explicit accept. */
(function () {
  'use strict';
  if (window.WingkeyAnalytics) return;

  var KEY = 'wkcb_analytics_consent';
  var TTL = 180 * 24 * 60 * 60 * 1000;
  var COOKIE_PREFIX = 'wkcb';
  var COOKIE_DOMAIN = 'classbook.wingkey.kr';
  var EVENTS = { service_select: 1, sample_open: 1, order_start: 1, generate_lead: 1, guide_click: 1 };
  var ENUM = {
    service: ['book', 'menu', 'deck'],
    book_type: ['industry', 'job', 'interview', 'travel'],
    destination: ['phrases', 'register'],
    service_card: ['home-books', 'home-menu', 'home-deck']
  };
  var SLUG = /^[a-z][a-z0-9_-]{0,47}$/;
  var CARD_SERVICE = { 'home-books': 'book', 'home-menu': 'menu', 'home-deck': 'deck' };
  var UTM = {
    utm_source: ['wingkey', 'xiaohongshu', 'xhs', 'redbook', 'naver', 'naver_cafe', 'google', 'classbook', 'korea', 'korea_guide', 'china-guide', 'china_guide'],
    utm_medium: ['banner', 'referral', 'organic', 'social', 'home', 'cpc', 'qr', 'email', 'display', 'site'],
    utm_campaign: ['classbook', 'menu', 'deck', 'korea_guide', 'guest', 'wingkey_classbook', 'xiaohongshu_classbook', 'travel_textbook'],
    utm_content: ['banner_01','banner_02','banner_03','banner_04','banner_05','guest_gif_3frame',"home","learn","city-shanghai","city-qingdao","city-zhangjiajie","city-beijing","city-harbin","city-chengdu","city-chongqing","city-xian","city-hongkong","city-macau"]
  };
  var TITLES = { '/': '윙키클래스북 | 홈', '/app.html': '윙키클래스북 | 앱 설치', '/menu': '윙키클래스북 | 메뉴판·가격표', '/deck': '윙키클래스북 | 회사소개서' };
  var GUIDE_ORIGIN = 'https://korea.wingkey.kr';

  var id = '';
  var loaded = false;
  var state = null; // 'granted' | 'denied' | null
  var orderSeen = {};
  var panel = null;
  var lastFocus = null;

  function safe(fn) { try { return fn(); } catch (e) { return undefined; } }
  function has(arr, v) { return arr.indexOf(v) !== -1; }

  function readId() {
    var m = safe(function () { return document.querySelector('meta[name="wingkey-ga4"]'); });
    var v = m && String(m.getAttribute('content') || '').trim();
    return v && /^G-[A-Z0-9]{4,20}$/.test(v) ? v : '';
  }

  function browserSignalOptOut() {
    return safe(function () {
      return navigator.doNotTrack === '1' || window.doNotTrack === '1' || navigator.globalPrivacyControl === true;
    }) === true;
  }

  function readChoice() {
    var raw = safe(function () { return localStorage.getItem(KEY); });
    if (!raw) return null;
    var o = safe(function () { return JSON.parse(raw); });
    if (!o || (o.v !== 'granted' && o.v !== 'denied') || typeof o.exp !== 'number' || o.exp < Date.now() || o.exp > Date.now() + TTL + 60000) {
      safe(function () { localStorage.removeItem(KEY); });
      return null;
    }
    return o.v;
  }
  function writeChoice(v) {
    safe(function () { localStorage.setItem(KEY, JSON.stringify({ v: v, exp: Date.now() + TTL })); });
  }

  /* ---------- cookies (only wkcb_*) ---------- */
  function clearOwnCookies() {
    safe(function () {
      var names = (document.cookie || '').split(';').map(function (c) { return c.split('=')[0].trim(); })
        .filter(function (n) { return n === COOKIE_PREFIX + '_ga' || n.indexOf(COOKIE_PREFIX + '_ga_') === 0; });
      var host = location.hostname;
      names.forEach(function (n) {
        var base = n + '=; Max-Age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax; Secure';
        document.cookie = base + '; domain=' + COOKIE_DOMAIN;
        document.cookie = base + '; domain=.' + COOKIE_DOMAIN;
        if (host !== COOKIE_DOMAIN) document.cookie = base + '; domain=' + host;
        document.cookie = base;
      });
    });
  }

  /* ---------- page_view params ---------- */
  function pageTitle(p) {
    if (TITLES[p]) return TITLES[p];
    var seg = (p.split('/')[1] || '').replace(/\.html$/, '');
    if (seg === 'menu') return TITLES['/menu'];
    if (seg === 'deck') return TITLES['/deck'];
    if (seg === 'app') return TITLES['/app.html'];
    return 'Wingkey Classbook';
  }
  function pageLocation() {
    var out = location.origin + location.pathname;
    var q = [];
    safe(function () {
      var sp = new URLSearchParams(location.search);
      Object.keys(UTM).forEach(function (k) {
        var v = (sp.get(k) || '').toLowerCase();
        if (has(UTM[k], v)) q.push(k + '=' + v);
      });
    });
    return q.length ? out + '?' + q.join('&') : out;
  }
  function referrerOrigin() {
    return safe(function () { return document.referrer ? new URL(document.referrer).origin : ''; }) || '';
  }

  /* ---------- Google loading (post-consent only) ---------- */
  function gtag() { window.dataLayer.push(arguments); }

  function load() {
    if (!id) return;
    if (loaded) {
      safe(function () { window['ga-disable-' + id] = false; window.gtag('consent','update',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'}); });
      return;
    }
    loaded = true;
    safe(function () {
      window['ga-disable-' + id] = false;
      window.dataLayer = window.dataLayer || [];
      window.gtag = window.gtag || gtag;
      gtag('consent', 'default', {
        ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied'
      });
      gtag('consent', 'update', {
        ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'granted'
      });
      // Set privacy/page defaults BEFORE the Google tag boot event.
      // The remote tag can initialize a destination during js, ahead of config.
      gtag('set',{send_page_view:false,page_title:pageTitle(location.pathname),page_location:pageLocation(),page_referrer:referrerOrigin(),allow_google_signals:false,allow_ad_personalization_signals:false,cookie_prefix:COOKIE_PREFIX,cookie_domain:COOKIE_DOMAIN,cookie_flags:'SameSite=Lax;Secure',cookie_expires:180*24*60*60,cookie_update:false});
      gtag('set','ads_data_redaction',true);
      gtag('js', new Date());
      gtag('config', id, {
        page_title:pageTitle(location.pathname),
        page_location:pageLocation(),
        page_referrer:referrerOrigin(),
        send_page_view: false,
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
        cookie_prefix: COOKIE_PREFIX,
        cookie_domain: COOKIE_DOMAIN,
        cookie_flags: 'SameSite=Lax;Secure',
        cookie_expires: 180 * 24 * 60 * 60,
        cookie_update: false
      });
      gtag('event', 'page_view', {
        page_title: pageTitle(location.pathname),
        page_location: pageLocation(),
        page_referrer: referrerOrigin()
      });
      var s = document.createElement('script');
      s.async = true;
      s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
      s.onerror = function () { /* blocked: ignore */ };
      document.head.appendChild(s);
    });
  }

  function unload() {
    safe(function () {
      if (id) window['ga-disable-' + id] = true; // before consent denied
      if (loaded && window.gtag) {
        window.gtag('consent', 'update', {
          ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied'
        });
      }
    });
    clearOwnCookies();
  }

  /* ---------- tracking API ---------- */
  function clean(params) {
    var out = {};
    if (!params || typeof params !== 'object') return out;
    Object.keys(ENUM).forEach(function (k) {
      var v = params[k];
      if (typeof v === 'string' && has(ENUM[k], v)) out[k] = v;
    });
    ['placement', 'sample_id'].forEach(function (k) {
      var v = params[k];
      if (typeof v === 'string' && SLUG.test(v)) out[k] = v;
    });
    return out;
  }

  function track(event, params) {
    try {
      if (state !== 'granted' || !loaded || !id) return false; // no queueing before consent
      if (typeof event !== 'string' || !EVENTS.hasOwnProperty(event)) return false;
      var p = clean(params);
      if (event === 'order_start') {
        var svc = p.service || 'book';
        if (orderSeen[svc]) return false;
        orderSeen[svc] = true;
      }
      p.page_title=pageTitle(location.pathname);
      p.page_location=pageLocation();
      p.page_referrer=referrerOrigin();
      p.send_to=id;
      window.gtag('event', event, p);
      return true;
    } catch (e) { return false; }
  }

  /* ---------- delegated clicks ---------- */
  function onClick(e) {
    safe(function () {
      var t = e.target && e.target.closest ? e.target : null;
      if (!t) return;
      var s = t.closest('[data-wk-analytics-settings]');
      if (s) { e.preventDefault(); openSettings(s); return; }
      var a = t.closest('a[href]');
      if (a) {
        var href = a.getAttribute('href') || '';
        if (href.indexOf(GUIDE_ORIGIN) === 0 && (href.length === GUIDE_ORIGIN.length || /[\/?#]/.test(href.charAt(GUIDE_ORIGIN.length)))) {
          var u = new URL(href);
          track('guide_click', { destination: /regist|signup|apply|join/i.test(u.pathname) ? 'register' : 'phrases', placement: ({home_phrases:'home_phrases',home_register:'home_register',menu_page:'menu_page',menu_register:'menu_register',menu_preview:'menu_preview',book_preview:'book_preview',book_order_done:'book_order_done',menu_order_done:'menu_order_done'})[u.searchParams.get('utm_content')] || 'guide-link' });
          return;
        }
      }
      var c = t.closest('[data-track]');
      if (c) {
        var card = String(c.getAttribute('data-track') || '');
        if (CARD_SERVICE.hasOwnProperty(card)) track('service_select', { service_card: card, service: CARD_SERVICE[card] });
      }
    });
  }

  /* ---------- consent UI ---------- */
  var CSS =
    '#wk-ga-consent{position:fixed;left:8px;right:8px;bottom:8px;z-index:2147483000;max-width:640px;max-height:calc(100vh - 16px);max-height:calc(100dvh - 16px);overflow-y:auto;margin:0 auto;box-sizing:border-box;' +
    'background:#fff;color:#1f2430;border:1px solid #c9ced8;border-radius:12px;box-shadow:0 6px 24px rgba(0,0,0,.2);padding:12px 14px;' +
    'font:400 calc(14px + var(--wk-mobile-font-bump,0px))/1.5 system-ui,-apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif;word-break:keep-all}' +
    '#wk-ga-consent *{box-sizing:border-box}#wk-ga-consent[hidden]{display:none}' +
    '#wk-ga-consent .wk-ga-t{margin:0 0 4px;font-weight:700;font-size:calc(15px + var(--wk-mobile-font-bump,0px))}' +
    '#wk-ga-consent p{margin:0 0 8px}' +
    '#wk-ga-consent details{margin:0 0 10px;font-size:calc(13px + var(--wk-mobile-font-bump,0px))}' +
    '#wk-ga-consent summary{cursor:pointer;font-weight:600;min-height:32px;padding:4px 0}' +
    '#wk-ga-consent ul{margin:4px 0 0;padding-left:18px}#wk-ga-consent li{margin:2px 0}' +
    '#wk-ga-consent .wk-ga-b{display:flex;gap:8px}' +
    '#wk-ga-consent button{flex:1 1 0;min-width:0;min-height:44px;padding:8px 10px;border-radius:8px;border:2px solid #1f2430;background:#fff;color:#1f2430;' +
    'font-family:inherit;font-size:calc(14px + var(--wk-mobile-font-bump,0px));font-weight:700;line-height:1.2;cursor:pointer}' +
    '#wk-ga-consent button:focus-visible,#wk-ga-consent summary:focus-visible{outline:3px solid #2563eb;outline-offset:2px}' +
    '.wk-ga-settings{background:none;border:0;padding:4px 0;color:inherit;font:inherit;text-decoration:underline;cursor:pointer;min-height:32px}';

  function el(tag, attrs, text) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (text) n.textContent = text;
    return n;
  }

  function buildPanel() {
    if (panel) return panel;
    if (!document.getElementById('wk-ga-style')) {
      var st = el('style', { id: 'wk-ga-style' });
      st.textContent = CSS;
      document.head.appendChild(st);
    }
    panel = el('div', { id: 'wk-ga-consent', role: 'dialog', 'aria-labelledby': 'wk-ga-title', 'aria-describedby': 'wk-ga-desc', hidden: '' });
    panel.appendChild(el('p', { id: 'wk-ga-title', class: 'wk-ga-t' }, '방문 통계 설정'));
    panel.appendChild(el('p', { id: 'wk-ga-desc' }, '선택 사항인 Google Analytics 쿠키로 방문자 수, 본 페이지, 샘플 열람, 주문 시작 횟수를 집계합니다. 허용하지 않아도 모든 서비스를 그대로 이용할 수 있습니다.'));
    var d = el('details');
    d.appendChild(el('summary', {}, '자세히 보기'));
    var ul = el('ul');
    [
      '운영: 주식회사 윙키. 분석 제공: Google LLC(Google Analytics 4). 방문 통계를 허용하기 전에는 이 분석 도구를 불러오거나 정보를 보내지 않습니다.',
      '수집 정보: 가명 처리된 쿠키 식별자, 기기·브라우저 정보, 방문 페이지, 샘플 열람·주문 시작 등 이벤트 정보.',
      '국외 처리: 허용 후 방문·이벤트 발생 시 위 통계 정보가 네트워크를 통해 Google LLC(미국 등 Google 처리 국가)로 전송되어 방문 통계 분석에 이용됩니다.',
      '보관: GA4 사용자·이벤트 수준 데이터 2개월(집계 보고서는 별도). 쿠키와 선택은 최대 180일 유지됩니다. 문의: info@wingkey.kr.',
      '광고 목적으로 사용하지 않으며, 입력한 이름·연락처 등 제출 정보는 통계에 보내지 않습니다.',
      '철회: 언제든 화면 하단의 \'방문 통계 설정\' 버튼에서 거부를 선택하면 통계 쿠키를 삭제하고 수집을 중단합니다.'
    ].forEach(function (t) { ul.appendChild(el('li', {}, t)); });
    d.appendChild(ul);
    panel.appendChild(d);
    var b = el('div', { class: 'wk-ga-b' });
    var yes = el('button', { type: 'button', 'data-wk-ga': 'accept' }, '허용');
    var no = el('button', { type: 'button', 'data-wk-ga': 'reject' }, '거부');
    yes.addEventListener('click', function () { choose('granted'); });
    no.addEventListener('click', function () { choose('denied'); });
    b.appendChild(yes); b.appendChild(no);
    panel.appendChild(b);
    document.body.appendChild(panel);
    return panel;
  }

  function showPanel(focus) {
    var p = buildPanel();
    p.hidden = false;
    if (focus) safe(function () { p.querySelector('button').focus(); });
  }
  function hidePanel() {
    if (panel) panel.hidden = true;
    safe(function () { if (lastFocus && document.contains(lastFocus)) lastFocus.focus(); });
    lastFocus = null;
  }

  function openSettings(from) {
    lastFocus = from || null;
    showPanel(true);
  }

  function choose(v) {
    writeChoice(v);
    state = v;
    if (v === 'granted' && !browserSignalOptOut()) load();
    else { state = 'denied'; unload(); }
    hidePanel();
  }

  function ensureFooterButton() {
    safe(function () {
      if (document.querySelector('[data-wk-analytics-settings]')) return;
      var f = document.querySelector('footer');
      if (!f) return;
      var b = el('button', { type: 'button', 'class': 'wk-ga-settings', 'data-wk-analytics-settings': '' }, '방문 통계 설정');
      f.appendChild(b);
    });
  }

  function init() {
    safe(function () {
      id = readId();
      document.addEventListener('click', onClick, true);
      if (!id) { // no measurement ID: nothing to consent to; keep API inert
        state = 'denied';
        return;
      }
      ensureFooterButton();
      if (browserSignalOptOut()) { state = 'denied'; unload(); return; }
      state = readChoice();
      if (state === 'granted') load();
      else if (state === 'denied') unload();
      else showPanel(false);
    });
  }

  window.WingkeyAnalytics = {
    track: track,
    openSettings: function () { openSettings(null); },
    status: function () { return state; }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
