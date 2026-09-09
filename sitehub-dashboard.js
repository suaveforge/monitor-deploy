(()=>{
  'use strict';
  const state={view:'operations',days:7,data:null,project:null,loading:false,lastFetched:0,refreshTimer:null};
  const q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>[...r.querySelectorAll(s)];
  const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num=v=>new Intl.NumberFormat('ko-KR').format(Number(v||0));
  const pct=v=>Number.isFinite(Number(v))?`${Number(v).toFixed(1)}%`:'-';
  const dt=v=>{const d=new Date(v);return Number.isNaN(+d)?'-':new Intl.DateTimeFormat('ko-KR',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(d)};
  const ago=v=>{const d=new Date(v);if(Number.isNaN(+d))return '-';let s=Math.max(0,Math.floor((Date.now()-d)/1000));if(s<60)return `${s}초 전`;if(s<3600)return `${Math.floor(s/60)}분 전`;if(s<86400)return `${Math.floor(s/3600)}시간 전`;return `${Math.floor(s/86400)}일 전`};
  const statusLabel={normal:'정상',down:'장애',degraded:'주의',unknown:'미확인',disabled:'미사용',pass:'PASS',fail:'FAIL',warn:'주의',not_checked:'미점검',not_applicable:'해당 없음',missing_loader:'미설치',missing:'미설치',no_events:'이벤트 없음',stale:'장기 미수신'};
  const statusTone=s=>['normal','pass'].includes(s)?'good':['down','fail','missing','missing_loader'].includes(s)?'bad':['degraded','warn','stale','no_events'].includes(s)?'warn':'muted';
  const chip=(s,label='')=>`<span class="obs-chip ${statusTone(s)}"><i></i>${E(label||statusLabel[s]||s||'미확인')}</span>`;

  function ensureShell(){
    if(q('#monitorTabAnalytics'))return;
    const tabs=q('.monitor-tabs');const main=q('main');if(!tabs||!main)return;
    tabs.insertAdjacentHTML('beforeend','<button class="monitor-tab obs-monitor-tab" id="monitorTabAnalytics" type="button" aria-selected="false">Analytics</button><button class="monitor-tab obs-monitor-tab" id="monitorTabSearch" type="button" aria-selected="false">Search</button>');
    [...main.children].forEach(x=>x.setAttribute('data-monitor-existing','1'));
    const root=document.createElement('section');root.id='sitehubObservability';root.className='obs-root';root.hidden=true;main.appendChild(root);
    const dialog=document.createElement('dialog');dialog.id='obsProjectDialog';dialog.className='modal obs-dialog';dialog.innerHTML='<div id="obsProjectDialogBody"></div>';document.body.appendChild(dialog);
    q('#monitorTabAnalytics')?.addEventListener('click',()=>setView('analytics'));
    q('#monitorTabSearch')?.addEventListener('click',()=>setView('search'));
    for(const id of ['#monitorTabOperations','#monitorTabActions'])q(id)?.addEventListener('click',exitObservability);
    document.addEventListener('click',e=>{
      const b=e.target.closest('[data-obs-project]');if(b)openProject(b.dataset.obsProject);
      if(e.target.closest('[data-obs-close]'))q('#obsProjectDialog')?.close();
    });
  }

  function exitObservability(){
    document.body.classList.remove('monitor-mode-sitehub');
    const root=q('#sitehubObservability');if(root)root.hidden=true;
    for(const id of ['#monitorTabAnalytics','#monitorTabSearch']){const b=q(id);if(b){b.classList.remove('active');b.setAttribute('aria-selected','false')}}
    state.view='operations';
  }

  function setView(view){
    state.view=view==='search'?'search':'analytics';
    document.body.classList.remove('monitor-mode-operations','monitor-mode-actions');
    document.body.classList.add('monitor-mode-sitehub');
    for(const id of ['#monitorTabOperations','#monitorTabActions']){const b=q(id);if(b){b.classList.remove('active');b.setAttribute('aria-selected','false')}}
    const analytics=q('#monitorTabAnalytics'),search=q('#monitorTabSearch');
    if(analytics){analytics.classList.toggle('active',state.view==='analytics');analytics.setAttribute('aria-selected',state.view==='analytics'?'true':'false')}
    if(search){search.classList.toggle('active',state.view==='search');search.setAttribute('aria-selected',state.view==='search'?'true':'false')}
    const root=q('#sitehubObservability');if(root)root.hidden=false;
    load();
  }

  async function request(path){
    if(typeof api==='function')return api(path);
    throw new Error('Monitor API 연결을 준비하지 못했습니다.');
  }

  async function load(force=false){
    if(state.loading)return;
    if(!force&&state.data&&Date.now()-state.lastFetched<45000){render();return}
    state.loading=true;renderLoading();
    try{state.data=await request(`/api/sitehub/dashboard?days=${state.days}`);state.lastFetched=Date.now();render()}
    catch(e){renderError(e?.message||String(e))}
    finally{state.loading=false}
  }

  function renderLoading(){const root=q('#sitehubObservability');if(root)root.innerHTML='<div class="obs-loading"><i></i><strong>SiteHub 관제 데이터를 불러오는 중</strong><span>Monitor registry와 live audit 결과를 결합합니다.</span></div>'}
  function renderError(message){const root=q('#sitehubObservability');if(root)root.innerHTML=`<div class="obs-error"><strong>관제 데이터를 가져오지 못했습니다.</strong><p>${E(message)}</p><button class="button" id="obsRetry">다시 확인</button></div>`;q('#obsRetry')?.addEventListener('click',()=>load(true))}
  function periodControls(){return `<div class="obs-period" role="group" aria-label="Analytics 기간"><button data-days="1" class="${state.days===1?'active':''}">오늘</button><button data-days="2" class="${state.days===2?'active':''}">어제 비교</button><button data-days="7" class="${state.days===7?'active':''}">7일</button><button data-days="30" class="${state.days===30?'active':''}">30일</button><label>사용자 지정 <input id="obsCustomDays" type="number" min="1" max="90" value="${state.days}"><span>일</span></label><button id="obsApplyDays">적용</button></div>`}
  function bindPeriod(){
    qa('[data-days]').forEach(b=>b.addEventListener('click',()=>{state.days=Number(b.dataset.days);load(true)}));
    q('#obsApplyDays')?.addEventListener('click',()=>{state.days=Math.max(1,Math.min(90,Number(q('#obsCustomDays')?.value||7)));load(true)});
    q('#obsRefresh')?.addEventListener('click',()=>load(true));
  }

  function metric(label,value,sub='',tone=''){return `<article class="obs-metric ${tone}"><span>${E(label)}</span><strong>${E(value)}</strong><small>${sub}</small></article>`}
  function render(){if(!state.data)return;state.view==='search'?renderSearch():renderAnalytics()}

  function renderAnalytics(){
    const d=state.data,t=d.traffic||{},tot=d.totals||{},ps=d.projects||[];const root=q('#sitehubObservability');if(!root)return;
    const delta=t.vs_yesterday_pct==null?'어제 데이터 없음':`${Number(t.vs_yesterday_pct)>=0?'+':''}${pct(t.vs_yesterday_pct)} vs 어제`;
    const receiving=ps.filter(p=>p.analytics_status==='normal').sort((a,b)=>Number(b.today_pv)-Number(a.today_pv));
    const stale=ps.filter(p=>p.analytics_status!=='normal');
    root.innerHTML=`
      <div class="obs-head"><div><p class="eyebrow">SITEHUB ANALYTICS</p><h2>전체 Analytics</h2><p>Monitor registry ${num(tot.registry_projects)}개 프로젝트의 SiteHub 수집 상태와 유입을 한 화면에서 봅니다.</p></div><div class="obs-head-actions"><button class="button" id="obsRefresh">새로고침</button><span>마지막 ${ago(d.generated_at)}</span></div></div>
      ${periodControls()}
      <div class="obs-metrics">${metric('오늘 PV',num(t.today_pv),delta)}${metric('오늘 UV',num(t.today_uv),'익명 visitor 기준')}${metric('최근 7일 PV',num(t.pv_7d),`UV ${num(t.uv_7d)}`)}${metric('최근 30일 PV',num(t.pv_30d),`UV ${num(t.uv_30d)}`)}${metric('정상 수집',`${num(tot.analytics_normal)} / ${num(tot.registry_projects)}`,`미설치 ${num(tot.analytics_missing)} · 장기미수신 ${num(tot.analytics_stale)}`,tot.analytics_issue?'attention':'')}${metric('SiteHub 적용',`${num(tot.sitehub_connected)} / ${num(tot.registry_projects)}`,`미적용 ${num(tot.sitehub_missing)}`,tot.sitehub_missing?'attention':'') }</div>
      ${renderTrend(t.trend||[])}
      <div class="obs-two-col">
        <article class="obs-card"><div class="obs-card-head"><div><span class="metric-kicker">PROJECTS</span><h3>상위 프로젝트</h3></div><small>선택 기간 ${state.days}일</small></div>${renderRankedProjects(t.top_projects||[])}</article>
        <article class="obs-card"><div class="obs-card-head"><div><span class="metric-kicker">COLLECTION</span><h3>수집 상태</h3></div><small>${num(stale.length)}개 확인 필요</small></div><div class="obs-status-list">${receiving.slice(0,6).map(p=>statusLine(p,'normal')).join('')}${stale.slice(0,10).map(p=>statusLine(p,p.analytics_status)).join('')||'<p class="obs-empty">확인 필요한 프로젝트가 없습니다.</p>'}</div></article>
      </div>
      <div class="obs-two-col">
        <article class="obs-card"><div class="obs-card-head"><div><span class="metric-kicker">PAGES</span><h3>상위 페이지</h3></div></div>${renderPages(t.top_pages||[])}</article>
        <article class="obs-card"><div class="obs-card-head"><div><span class="metric-kicker">REFERRER</span><h3>주요 유입 경로</h3></div></div>${renderReferrers(t.top_referrers||[])}</article>
      </div>`;
    bindPeriod();
  }

  function renderTrend(rows){
    if(!rows.length)return `<article class="obs-card obs-trend"><div class="obs-card-head"><div><span class="metric-kicker">TRAFFIC TREND</span><h3>기간별 트래픽</h3></div></div><p class="obs-empty">집계된 트래픽이 없습니다.</p></article>`;
    const vals=rows.map(x=>Number(x.pv||0)),max=Math.max(1,...vals),w=900,h=230,p=28;const pts=vals.map((v,i)=>`${p+(i/Math.max(1,vals.length-1))*(w-p*2)},${h-p-(v/max)*(h-p*2)}`).join(' ');
    return `<article class="obs-card obs-trend"><div class="obs-card-head"><div><span class="metric-kicker">TRAFFIC TREND</span><h3>기간별 트래픽</h3></div><small>PV / UV</small></div><div class="obs-chart"><svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-label="PV 추이"><polyline points="${pts}"></polyline></svg><div class="obs-chart-axis"><span>${E(rows[0]?.day||'')}</span><strong>최고 ${num(max)} PV</strong><span>${E(rows[rows.length-1]?.day||'')}</span></div></div></article>`
  }
  function renderRankedProjects(rows){if(!rows.length)return '<p class="obs-empty">집계 데이터가 없습니다.</p>';const max=Math.max(1,...rows.map(x=>Number(x.pv||0)));return `<div class="obs-ranking">${rows.slice(0,12).map((p,i)=>`<button data-obs-project="${E(p.project_id)}"><em>${i+1}</em><span><b>${E(p.name||p.project_id)}</b><small>${E(p.project_id)} · UV ${num(p.uv)}</small><i style="--bar:${Math.max(3,Number(p.pv||0)/max*100)}%"></i></span><strong>${num(p.pv)}<small>PV</small></strong></button>`).join('')}</div>`}
  function statusLine(p,s){return `<button class="obs-status-row" data-obs-project="${E(p.project_id)}"><span>${chip(s)}</span><b>${E(p.name||p.project_id)}</b><small>${p.last_event_at?`마지막 ${ago(p.last_event_at)}`:'이벤트 없음'}</small><strong>${num(p.today_pv)} PV</strong></button>`}
  function renderPages(rows){if(!rows.length)return '<p class="obs-empty">페이지 데이터가 없습니다.</p>';return `<div class="obs-simple-table">${rows.slice(0,14).map(x=>`<button data-obs-project="${E(x.project_id)}"><span><b>${E(x.pathname||'/')}</b><small>${E(x.hostname||'')} · ${E(x.project_id)}</small></span><strong>${num(x.pv)} PV</strong></button>`).join('')}</div>`}
  function renderReferrers(rows){if(!rows.length)return '<p class="obs-empty">referrer 데이터가 없습니다.</p>';return `<div class="obs-simple-table">${rows.slice(0,14).map(x=>`<button data-obs-project="${E(x.project_id)}"><span><b>${E(x.referrer_host||'Direct / Unknown')}</b><small>${E(x.project_id)}</small></span><strong>${num(x.pv)} PV</strong></button>`).join('')}</div>`}

  function renderSearch(){
    const d=state.data,tot=d.totals||{},ps=d.projects||[];const root=q('#sitehubObservability');if(!root)return;
    root.innerHTML=`
      <div class="obs-head"><div><p class="eyebrow">SITEHUB SEARCHOPS</p><h2>Search 관제</h2><p>점수보다 live 검사 근거를 우선합니다. Google Index는 기술 준비도와 별도로 표시합니다.</p></div><div class="obs-head-actions"><button class="button" id="obsRefresh">새로고침</button><span>마지막 ${ago(d.generated_at)}</span></div></div>
      <div class="obs-metrics search-metrics">${metric('SEO PASS',`${num(tot.seo_pass)} / ${num(tot.registry_projects)}`,`FAIL ${num(tot.seo_fail)}`)}${metric('AEO PASS',`${num(tot.aeo_pass)} / ${num(tot.registry_projects)}`,`FAIL ${num(tot.aeo_fail)}`)}${metric('GEO PASS',`${num(tot.geo_pass)} / ${num(tot.registry_projects)}`,`FAIL ${num(tot.geo_fail)}`)}${metric('Search Readiness',`${num(tot.readiness_pass)} PASS`,`FAIL ${num(tot.readiness_fail)}`)}${metric('Sitemap',`${num(tot.sitemap_pass)} PASS`,`FAIL ${num(tot.sitemap_fail)}`)}${metric('Google Index',`${num(tot.index_verified_projects)} 확인됨`,`${num(tot.index_unknown_projects)} unknown · 기술실패와 분리`)}</div>
      <article class="obs-card obs-search-card">
        <div class="obs-card-head"><div><span class="metric-kicker">REGISTRY WIDE</span><h3>전 프로젝트 SearchOps</h3></div><div class="obs-search-filter"><input id="obsSearchFilter" type="search" placeholder="프로젝트·도메인 검색"><select id="obsSearchState"><option value="all">전체 상태</option><option value="fail">FAIL 포함</option><option value="pass">Readiness PASS</option><option value="unknown">미점검 / Index unknown</option></select></div></div>
        <div class="obs-search-table-wrap"><table class="obs-search-table"><thead><tr><th>Project</th><th>SEO</th><th>AEO</th><th>GEO</th><th>Readiness</th><th>Index</th><th>Sitemap</th><th>Robots</th><th>NameCard</th><th>Last check</th></tr></thead><tbody id="obsSearchRows"></tbody></table></div>
      </article>`;
    const draw=()=>renderSearchRows(ps);draw();q('#obsRefresh')?.addEventListener('click',()=>load(true));q('#obsSearchFilter')?.addEventListener('input',draw);q('#obsSearchState')?.addEventListener('change',draw);
  }
  function renderSearchRows(ps){
    const body=q('#obsSearchRows');if(!body)return;const term=(q('#obsSearchFilter')?.value||'').trim().toLowerCase(),flt=q('#obsSearchState')?.value||'all';
    const rows=ps.filter(p=>{const s=p.search||{};if(term&&!`${p.project_id} ${p.name} ${p.public_url}`.toLowerCase().includes(term))return false;if(flt==='fail'&&!['fail'].includes(s.seo_status)&&!['fail'].includes(s.aeo_status)&&!['fail'].includes(s.geo_status)&&s.readiness!=='fail')return false;if(flt==='pass'&&s.readiness!=='pass')return false;if(flt==='unknown'&&s.google_index?.status!=='unknown'&&s.readiness!=='not_checked'&&!(!p.search))return false;return true});
    body.innerHTML=rows.length?rows.map(p=>{const s=p.search||{},idx=s.google_index||{},nc=p.namecard_status==='normal'?'pass':'fail';const idxLabel=idx.status==='unknown'?'Unknown':idx.indexed!=null?`${num(idx.indexed)} indexed`:idx.status;return `<tr data-obs-project="${E(p.project_id)}" tabindex="0"><td><strong>${E(p.name)}</strong><small>${E(p.project_id)} · ${E(p.public_url||'URL 없음')}</small></td><td>${chip(s.seo_status||'not_checked')}</td><td>${chip(s.aeo_status||'not_checked')}</td><td>${chip(s.geo_status||'not_checked')}</td><td>${chip(s.readiness||'not_checked')}</td><td>${chip(idx.status==='unknown'?'unknown':'pass',idxLabel)}</td><td>${chip(s.sitemap?.status||'not_checked')}</td><td>${chip(s.robots?.status||'not_checked')}</td><td>${chip(nc)}</td><td><span>${s.last_check?dt(s.last_check):'-'}</span></td></tr>`}).join(''):'<tr><td colspan="10" class="obs-empty">조건에 맞는 프로젝트가 없습니다.</td></tr>';
    qa('tr[data-obs-project]',body).forEach(r=>r.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openProject(r.dataset.obsProject)}}));
  }

  async function openProject(id){
    const dlg=q('#obsProjectDialog'),body=q('#obsProjectDialogBody');if(!dlg||!body)return;body.innerHTML='<div class="obs-loading compact"><i></i><strong>프로젝트 상세를 불러오는 중</strong></div>';if(!dlg.open)dlg.showModal();
    try{const d=await request(`/api/sitehub/projects/${encodeURIComponent(id)}?days=30`);renderProjectDialog(d)}catch(e){body.innerHTML=`<div class="modal-head"><div><p class="eyebrow">PROJECT DETAIL</p><h2>상세 조회 실패</h2></div><button class="icon-button" data-obs-close aria-label="닫기">×</button></div><div class="obs-error"><p>${E(e?.message||String(e))}</p></div>`}
  }
  function renderProjectDialog(d){
    const p=d.projects?.[0];if(!p)return;const body=q('#obsProjectDialogBody'),t=d.traffic||{},s=p.search||{},idx=s.google_index||{};const errors=[...(s.errors||[]),...(p.alerts||[])];
    body.innerHTML=`<div class="modal-head"><div><p class="eyebrow">${E(p.project_id)} · SITEHUB</p><h2>${E(p.name)}</h2><p class="obs-dialog-url">${p.public_url?`<a href="${E(p.public_url)}" target="_blank" rel="noreferrer">${E(p.public_url)}</a>`:'운영 URL 없음'}</p></div><button class="icon-button" data-obs-close aria-label="닫기">×</button></div>
      <div class="obs-detail-strip"><span><small>서비스</small>${chip(p.service_status)}</span><span><small>NameCard</small>${chip(p.namecard_status==='normal'?'pass':'fail')}</span><span><small>Analytics</small>${chip(p.analytics_status)}</span><span><small>Search readiness</small>${chip(s.readiness||'not_checked')}</span></div>
      <div class="obs-dialog-grid"><section><h3>Analytics · 30일</h3><div class="obs-dialog-metrics"><span><small>PV</small><strong>${num(p.pv_30d)}</strong></span><span><small>UV</small><strong>${num(p.uv_30d)}</strong></span><span><small>마지막 이벤트</small><strong>${p.last_event_at?ago(p.last_event_at):'미수신'}</strong></span></div>${renderPages(t.top_pages||[])}${renderReferrers(t.top_referrers||[])}</section>
      <section><h3>SearchOps 근거</h3>${searchEvidence(s,idx,p)}</section></div>
      <section class="obs-issues"><div class="obs-card-head"><div><span class="metric-kicker">ISSUES & ALERTS</span><h3>확인할 항목</h3></div><small>${num(errors.length)}건</small></div>${errors.length?`<ul>${errors.map(x=>`<li>${E(typeof x==='string'?x:JSON.stringify(x))}</li>`).join('')}</ul>`:'<p class="obs-empty">현재 표시할 경고가 없습니다.</p>'}</section>`;
  }
  function searchEvidence(s,idx,p){
    if(!s||!Object.keys(s).length)return '<p class="obs-empty">SearchOps 점검 결과가 아직 없습니다.</p>';
    const rows=[['SEO',s.seo_status],['AEO',s.aeo_status],['GEO',s.geo_status],['Technical readiness',s.technical_readiness||s.readiness],['Canonical',s.root?.canonical_ok?'pass':'fail'],['Googlebot parity',s.root?.googlebot_parity_ok?'pass':'fail'],['Sitemap',s.sitemap?.status],['Robots',s.robots?.status],['Structured data',s.structured_data?.valid?'pass':s.structured_data?.present?'warn':'fail'],['Internal links',Number(s.crawl?.internal_links_broken||0)>0?'fail':'pass']];
    return `<div class="obs-evidence">${rows.map(([k,v])=>`<div><span>${E(k)}</span>${chip(v||'not_checked')}</div>`).join('')}</div><div class="obs-index-box"><strong>Google Index</strong><p>${idx.status==='unknown'?'검증된 Google Index source가 아직 연결되지 않았습니다. 기술 준비도와 별개로 Unknown 처리합니다.':`Indexed ${num(idx.indexed)} · Discovered ${num(idx.discovered)}`}</p></div>${s.sitemap?.url?`<p class="obs-evidence-url"><b>Sitemap</b> ${E(s.sitemap.url)} ${s.sitemap.http_status?`· HTTP ${E(s.sitemap.http_status)}`:''}</p>`:''}${s.robots?.url?`<p class="obs-evidence-url"><b>Robots</b> ${E(s.robots.url)} ${s.robots.http_status?`· HTTP ${E(s.robots.http_status)}`:''}</p>`:''}${p.namecard_missing?.length?`<p class="obs-evidence-url"><b>NameCard 누락</b> ${E(p.namecard_missing.join(', '))}</p>`:''}`
  }

  document.addEventListener('DOMContentLoaded',()=>{ensureShell();state.refreshTimer=setInterval(()=>{if(state.view!=='operations'&&document.visibilityState==='visible')load(true)},60000)});
})();
