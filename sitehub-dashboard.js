(()=>{
  'use strict';
  const state={view:'operations',days:7,data:null,project:null,loading:false,lastFetched:0,refreshTimer:null,selectedProjectId:'',selectedProjectData:null,selectedProjectDays:0,selectedProjectLoading:false,selectedProjectError:''};
  try{document.cookie='sitehub_internal=owner; Max-Age=31536000; Path=/; Domain=.suaveforge.com; SameSite=Lax; Secure'}catch{}
  const q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>[...r.querySelectorAll(s)];
  const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num=v=>new Intl.NumberFormat('ko-KR').format(Number(v||0));
  const pct=v=>Number.isFinite(Number(v))?`${Number(v).toFixed(1)}%`:'-';
  const validDate=v=>{const d=new Date(v);return Number.isNaN(+d)||d.getUTCFullYear()<2000?null:d};
  const dt=v=>{const d=validDate(v);return d?new Intl.DateTimeFormat('ko-KR',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(d):'-'};
  const ago=v=>{const d=validDate(v);if(!d)return '기록 없음';let s=Math.max(0,Math.floor((Date.now()-d)/1000));if(s<60)return `${s}초 전`;if(s<3600)return `${Math.floor(s/60)}분 전`;if(s<86400)return `${Math.floor(s/3600)}시간 전`;return `${Math.floor(s/86400)}일 전`};
  const statusLabel={normal:'정상',down:'장애',degraded:'주의',unknown:'미확인',disabled:'미사용',pass:'PASS',fail:'FAIL',warn:'주의',not_checked:'미점검',not_applicable:'해당 없음',missing_loader:'미설치',missing:'미설치',no_events:'이벤트 없음',stale:'장기 미수신',pending:'수집 대기',unsupported:'미지원'};
  const statusTone=s=>['normal','pass'].includes(s)?'good':['down','fail','missing','missing_loader'].includes(s)?'bad':['degraded','warn','stale','no_events'].includes(s)?'warn':'muted';
  const statusHelp={pass:'현재 점검 기준을 통과했습니다.',fail:'현재 점검 기준에서 문제가 발견되었습니다. 세부 근거를 확인하세요.',normal:'현재 정상적으로 수집·응답하고 있습니다.',unknown:'확인 가능한 데이터가 부족해 상태를 확정하지 못했습니다.',not_checked:'아직 점검 결과가 없습니다.',not_applicable:'이 프로젝트에는 적용되지 않는 항목입니다.',missing_loader:'수집 스크립트가 설치되지 않았거나 감지되지 않았습니다.',no_events:'수집 스크립트는 있지만 최근 이벤트가 없습니다.',stale:'예전에는 수집됐지만 최근에는 새 이벤트가 들어오지 않았습니다.',pending:'데이터 공급자가 아직 이 지표를 제공하지 않아 기다리는 상태입니다.',unsupported:'현재 공급자가 이 지표를 지원하지 않습니다.'};
  const chip=(s,label='')=>{const help=statusHelp[s]||'';return `<span class="obs-chip ${statusTone(s)}" ${help?`title="${E(help)}"`:''}><i></i>${E(label||statusLabel[s]||s||'미확인')}</span>`};
  const glossary={
    pv:'PV는 Page View의 약자입니다. 기본 표시값은 명시적으로 확인된 내부·QA·자동화 접근을 제외한 정제 PV입니다.',
    uv:'고유 브라우저(UV)는 프로젝트별 localStorage에 보관된 익명 visitor ID를 하루 기준으로 중복 제거한 값입니다. 실제 사람 수와 1:1이 아닙니다. 같은 사람이 다른 기기·브라우저·시크릿창을 쓰면 여러 번 잡힐 수 있고, 같은 브라우저를 여러 사람이 쓰면 1개로 잡힐 수 있습니다. 확실히 식별된 내부·QA·자동화·봇 트래픽은 기본 집계에서 제외합니다.',
    cleantraffic:'기본 Analytics 숫자는 명시적으로 확인된 내부 사용자, QA, 자동화 세션과 세션 분류가 불가능한 이벤트를 제외합니다. 같은 사이트 내부 이동처럼 실제 사용일 수 있는 트래픽은 임의로 제거하지 않습니다.',
    excludedtraffic:'제외 트래픽은 원본에는 들어왔지만 내부·QA·자동화로 확정되어 기본 PV/고유 브라우저(UV)에서 빠진 접근입니다. 펼치면 원본 수치와 제외 사유를 볼 수 있습니다.',
    analytics:'사이트에서 실제 방문 이벤트가 SiteHub로 들어오고 있는지 보는 항목입니다.',
    namecard:'검색 결과와 링크 공유에 필요한 페이지 기본 신원 정보입니다. 제목, 설명, 대표 이미지, canonical 같은 메타데이터 누락을 점검합니다.',
    seo:'검색 기본 점검(SEO)은 검색엔진이 페이지를 읽고 대표 URL·메타·링크·사이트맵 같은 기본 구조를 이해할 수 있는지 확인합니다.',
    aeo:'답변형 검색 점검(AEO)은 질문·답변형 검색이나 AI 답변이 페이지 내용을 구조적으로 추출하기 쉬운지 확인합니다.',
    geo:'생성형 검색 점검(GEO)은 생성형 검색·AI 시스템이 페이지의 핵심 정보를 이해하고 인용하기 쉬운 구조인지 확인합니다.',
    readiness:'검색 준비도는 SEO·AEO·GEO와 크롤링 관련 기술 점검을 합쳐 현재 검색 노출 준비가 되었는지 보여주는 기술 상태입니다. 실제 Google 노출량 자체는 아닙니다.',
    technical:'Technical Ready는 robots·sitemap·canonical·indexability·Googlebot parity 등 검색엔진 접근을 위한 기술 준비 상태입니다. 실제 Google 검색 노출 성공을 뜻하지 않습니다.',
    serp:'SERP 실노출은 Google Search Console의 실제 노출·클릭과 색인 증거를 기준으로 판단합니다. 기술 준비가 PASS여도 impressions가 없으면 성공으로 표시하지 않습니다.',
    canonical:'Canonical은 같은 내용의 여러 URL 중 검색엔진이 대표 주소로 취급해야 할 URL을 선언하는 값입니다.',
    googlebot:'Googlebot parity는 일반 방문자와 Googlebot이 실질적으로 같은 핵심 콘텐츠를 받는지 확인합니다.',
    sitemap:'Sitemap은 검색엔진에 공개 URL 목록과 갱신 정보를 알려주는 파일입니다.',
    robots:'robots.txt는 검색 로봇이 어떤 경로를 크롤링할 수 있는지 안내하는 파일입니다.',
    structured:'구조화 데이터는 Schema.org/JSON-LD처럼 검색엔진이 페이지의 의미를 기계적으로 이해하도록 돕는 데이터입니다.',
    internal:'내부 링크 점검은 사이트 안의 링크가 끊어지지 않았는지 확인합니다.',
    googleindex:'Google Index는 Google이 실제로 URL을 색인했는지에 관한 상태입니다. 기술 준비도와 별개이며 검증된 Google 데이터 소스가 없으면 Unknown으로 둡니다.',
    videoseo:'VideoSEO는 동영상 페이지가 검색엔진에 이해·색인될 수 있도록 VideoObject, 영상 sitemap, watch URL 상태 등을 점검하는 영역입니다.',
    watchpages:'Watch pages는 동영상 자체를 주 콘텐츠로 보여주는 감시 대상 영상 페이지 수입니다.',
    active:'ACTIVE는 현재 정상적으로 공개·감시 중인 영상 페이지입니다.',
    trending:'TRENDING은 최근 노출·반응 등 공급자가 정의한 추세 조건을 만족한 영상 페이지입니다.',
    archived:'ARCHIVED는 현재 신규 노출 대상은 아니지만 기록을 보존하는 영상 페이지입니다. 단독으로 장애를 의미하지 않습니다.',
    sourceunavailable:'SOURCE_UNAVAILABLE은 원본 영상이나 외부 영상 소스를 현재 확인할 수 없는 상태입니다.',
    removed:'REMOVED는 감시 대상에서 제거된 영상 페이지입니다.',
    videoobject:'VideoObject는 검색엔진이 영상 제목·썸네일·업로드일·재생 위치 등을 이해하도록 제공하는 구조화 데이터입니다.',
    impressions:'검색 노출은 Google Search Console 등 검증된 검색 데이터에서 검색 결과에 표시된 횟수입니다. PV와는 전혀 다른 지표입니다.',
    service:'서비스 상태는 Monitor가 실제 운영 URL·프로세스 상태를 확인한 결과입니다. 검색 성능과는 별개의 운영 가용성 지표입니다.',
    lastcollect:'마지막 수집은 SiteHub가 이 프로젝트의 방문 이벤트를 가장 최근에 받은 시각입니다.',
    pages:'상위 페이지는 선택 기간 동안 PV가 많이 발생한 페이지 경로입니다.',
    referrer:'유입 경로는 방문자가 이 사이트로 들어오기 직전에 있었던 출처입니다. 직접 방문은 별도 출처가 없을 수 있습니다.',
    searchconsole:'Google Search Console은 Google 검색 결과에서 실제 노출·클릭·색인 상태를 제공하는 Google 공식 데이터 소스입니다.',
    richresult:'Rich result는 일반 검색 결과보다 확장된 형태로 표시되는 검색 결과입니다. 구조화 데이터 오류가 있으면 자격에 영향을 줄 수 있습니다.',
    watchurl:'영상 페이지 URL 오류는 SiteHub가 감시하는 영상 페이지 주소가 깨졌거나 정상 응답하지 않는 건수입니다.',
    httpstatus:'404는 페이지를 찾을 수 없음, 410은 의도적으로 삭제됨을 뜻하는 HTTP 상태 코드입니다.',
    sitehub:'SiteHub는 Analytics·NameCard·SearchOps 같은 공통 웹 기능을 프로젝트별로 수집·점검하는 공용 Hub입니다.',
    issues:'확인할 항목은 Monitor와 SiteHub가 실제 점검에서 발견한 운영·수집·검색 관련 문제만 표시합니다.'
  };
  const term=(label,key)=>{const tip=glossary[key]||'';return tip?`<span class="obs-term" tabindex="0" data-tip="${E(tip)}" aria-label="${E(label)}: ${E(tip)}">${E(label)}<b>?</b></span>`:E(label)};
  function floatingTip(){
    let tip=q('#obsFloatingTip');
    if(!tip){tip=document.createElement('div');tip.id='obsFloatingTip';tip.className='obs-floating-tip';tip.setAttribute('role','tooltip');tip.hidden=true;document.body.appendChild(tip)}
    return tip;
  }
  function showFloatingTip(el){
    const text=String(el?.dataset?.tip||'').trim();if(!text)return;
    const tip=floatingTip();tip.textContent=text;tip.hidden=false;tip.classList.add('show');tip.style.left='0px';tip.style.top='0px';
    const r=el.getBoundingClientRect(),tr=tip.getBoundingClientRect(),gap=10,margin=8;
    let left=r.left+(r.width-tr.width)/2;
    left=Math.max(margin,Math.min(window.innerWidth-tr.width-margin,left));
    let top=r.top-tr.height-gap,placement='top';
    if(top<margin){top=r.bottom+gap;placement='bottom'}
    if(top+tr.height>window.innerHeight-margin){top=Math.max(margin,window.innerHeight-tr.height-margin)}
    tip.dataset.placement=placement;tip.style.left=`${Math.round(left)}px`;tip.style.top=`${Math.round(top)}px`;
    el.setAttribute('aria-describedby','obsFloatingTip');
  }
  function hideFloatingTip(el){const tip=q('#obsFloatingTip');if(tip){tip.classList.remove('show');tip.hidden=true}el?.removeAttribute?.('aria-describedby')}

  const dayLabel=v=>{const d=validDate(v);return d?new Intl.DateTimeFormat('ko-KR',{month:'numeric',day:'numeric'}).format(d):String(v||'').replace(/^\d{4}-/,'')};
  const alertText={
    site_down:'서비스 접속 장애: Monitor가 운영 서비스가 정상 응답하지 않는 상태를 감지했습니다.',
    sitehub_not_connected:'SiteHub 미연결: 이 프로젝트가 SiteHub 공통 관제에 연결되어 있지 않습니다.',
    namecard_fail:'페이지 기본정보 누락: 제목·설명·대표 이미지·대표 URL 같은 공유/검색용 기본 정보 중 일부가 빠졌습니다.',
    analytics_stale:'방문 수집 중단: 과거 이벤트는 있지만 최근 새 방문 이벤트가 들어오지 않습니다.',
    analytics_missing:'Analytics 미설치: SiteHub 방문 수집 스크립트가 설치되지 않았거나 감지되지 않습니다.',
    analytics_not_receiving:'방문 이벤트 없음: 웹 URL은 있지만 SiteHub가 정상적인 방문 이벤트를 받지 못하고 있습니다.',
    search_readiness_fail:'검색 준비도 실패: 검색엔진이 페이지를 읽고 이해하는 데 필요한 기술 점검 중 실패 항목이 있습니다.',
    sitemap_fail:'Sitemap 문제: 사이트맵 파일에 접근할 수 없거나 점검 기준을 통과하지 못했습니다.',
    robots_fail:'robots.txt 문제: 검색 로봇 안내 파일에 접근할 수 없거나 점검 기준을 통과하지 못했습니다.'
  };
  const explainAlert=x=>{if(typeof x!=='string')return JSON.stringify(x);return alertText[x]||x.replaceAll('_',' ')};

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
      const detail=e.target.closest('[data-obs-detail-project]');
      if(detail){e.preventDefault();e.stopPropagation();openProject(detail.dataset.obsDetailProject);return}
      const chartProject=e.target.closest('[data-obs-chart-project]');
      if(chartProject){e.preventDefault();selectAnalyticsProject(chartProject.dataset.obsChartProject);return}
      const b=e.target.closest('[data-obs-project]');if(b)openProject(b.dataset.obsProject);
      if(e.target.closest('[data-obs-close]'))q('#obsProjectDialog')?.close();
    });
    document.addEventListener('pointerover',e=>{const el=e.target.closest?.('.obs-term');if(el)showFloatingTip(el)});
    document.addEventListener('pointerout',e=>{const el=e.target.closest?.('.obs-term');if(el&&!el.contains(e.relatedTarget))hideFloatingTip(el)});
    document.addEventListener('focusin',e=>{const el=e.target.closest?.('.obs-term');if(el)showFloatingTip(el)});
    document.addEventListener('focusout',e=>{const el=e.target.closest?.('.obs-term');if(el)hideFloatingTip(el)});
    window.addEventListener('scroll',()=>hideFloatingTip(),true);
    window.addEventListener('resize',()=>hideFloatingTip());

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

  async function loadSelectedProject(force=false){
    const id=String(state.selectedProjectId||'').trim();
    if(!id){state.selectedProjectData=null;state.selectedProjectDays=0;state.selectedProjectError='';state.selectedProjectLoading=false;return}
    if(!force&&state.selectedProjectData&&state.selectedProjectDays===state.days&&state.selectedProjectData.projects?.[0]?.project_id===id)return;
    state.selectedProjectLoading=true;state.selectedProjectError='';
    try{state.selectedProjectData=await request(`/api/sitehub/projects/${encodeURIComponent(id)}?days=${state.days}`);state.selectedProjectDays=state.days}
    catch(e){state.selectedProjectData=null;state.selectedProjectDays=state.days;state.selectedProjectError=e?.message||String(e)}
    finally{state.selectedProjectLoading=false}
  }
  async function selectAnalyticsProject(id){
    state.selectedProjectId=String(id||'').trim();
    state.selectedProjectData=null;state.selectedProjectDays=0;state.selectedProjectError='';
    if(!state.selectedProjectId){renderAnalytics();return}
    state.selectedProjectLoading=true;renderAnalytics();
    await loadSelectedProject(true);
    renderAnalytics();
    q('.obs-trend')?.scrollIntoView({behavior:'smooth',block:'center'});
  }
  async function load(force=false){
    if(state.loading)return;
    if(!force&&state.data&&Date.now()-state.lastFetched<45000){if(state.selectedProjectId)await loadSelectedProject(false);render();return}
    state.loading=true;renderLoading();
    try{state.data=await request(`/api/sitehub/dashboard?days=${state.days}`);state.lastFetched=Date.now();if(state.selectedProjectId)await loadSelectedProject(true);render()}
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

  function metric(label,value,sub='',tone='',tipKey=''){return `<article class="obs-metric ${tone}"><span>${tipKey?term(label,tipKey):E(label)}</span><strong>${E(value)}</strong><small>${sub}</small></article>`}
  function excludedReasonLabel(reason){
    return ({internal_qa:'QA',internal_qa_legacy:'과거 QA',internal_owner:'내부 사용자',internal_automation:'자동화',internal_automation_legacy:'과거 자동화',unclassified_no_session:'미분류 이벤트'})[reason]||String(reason||'기타');
  }
  function renderExcludedTraffic(t){
    const pv=Number(t?.selected_excluded_pv||0),uv=Number(t?.selected_excluded_uv||0);
    if(pv<=0&&uv<=0)return '';
    const rows=Array.isArray(t?.excluded)?t.excluded:[];
    return `<details class="obs-card obs-excluded-card">
      <summary><span><b>원본 수집 / 제외 사유</b><small>전체 수집 ${num(t.selected_raw_pv)} PV · 외부 실사용 ${num(t.selected_pv)} PV · 제외 ${num(pv)} PV</small></span><strong>펼치기</strong></summary>
      <div class="obs-excluded-grid">
        <div><span>기본 표시</span><b>${num(t.selected_pv)} PV</b><small>${num(t.selected_uv)} UV · clean</small></div>
        <div><span>원본 수집</span><b>${num(t.selected_raw_pv)} PV</b><small>${num(t.selected_raw_uv)} UV · raw</small></div>
        <div><span>기본 제외</span><b>−${num(pv)} PV</b><small>−${num(uv)} UV</small></div>
      </div>
      <div class="obs-excluded-reasons">${rows.length?rows.map(x=>`<span><b>${E(excludedReasonLabel(x.reason))}</b><small>${num(x.pv)} PV · ${num(x.uv)} UV</small></span>`).join(''):'<span><b>제외 내역 없음</b></span>'}</div>
      <p>${term('정제 기준','cleantraffic')} · ${term('제외 트래픽','excludedtraffic')}</p>
    </details>`;
  }
    function obsWebApplicable(p){return Boolean(String(p?.public_url||'').trim())}
  function obsApplicability(tot,ps){const webProjects=ps.filter(obsWebApplicable),has=Object.prototype.hasOwnProperty.call(tot,'web_applicable_projects'),webTotal=has?Number(tot.web_applicable_projects||0):webProjects.length,notApplicable=has?Number(tot.web_not_applicable_projects||0):Math.max(0,ps.length-webProjects.length),analyticsNormal=has?Number(tot.analytics_normal||0):webProjects.filter(p=>p.analytics_status==='normal').length,analyticsMissing=has?Number(tot.analytics_missing||0):webProjects.filter(p=>['missing_loader','missing'].includes(p.analytics_status)).length,analyticsStale=has?Number(tot.analytics_stale||0):webProjects.filter(p=>p.analytics_status==='stale').length,analyticsIssue=has?Number(tot.analytics_issue||0):Math.max(0,webTotal-analyticsNormal),indexUnknown=has?Number(tot.index_unknown_projects||0):webProjects.filter(p=>!p.search||p.search.google_index?.status==='unknown'||p.search.google_index?.source==='unavailable').length,indexVerified=has?Number(tot.index_verified_projects||0):Math.max(0,webTotal-indexUnknown);return {webProjects,webTotal,notApplicable,analyticsNormal,analyticsMissing,analyticsStale,analyticsIssue,indexUnknown,indexVerified}}
  const numMaybe=v=>v===null||v===undefined||v===''?'-':num(v);
  function videoSEOState(p){
    const raw=p?.search?.video_seo;
    if(!raw||typeof raw!=='object'||Array.isArray(raw))return {raw:null,state:'pending',label:'수집 대기',alerts:[]};
    const alerts=Array.isArray(raw.alerts)?raw.alerts.filter(Boolean):[];
    if(raw.applicable===false)return {raw,state:'not_applicable',label:'해당 없음',alerts};
    const availability=String(raw.availability||'available').toLowerCase();
    if(availability==='unsupported')return {raw,state:'unsupported',label:'미지원',alerts};
    if(availability==='pending')return {raw,state:'pending',label:'수집 대기',alerts};
    if(alerts.length)return {raw,state:'fail',label:`경보 ${alerts.length}`,alerts};
    if(raw.applied===true)return {raw,state:'pass',label:'적용',alerts};
    if(raw.applied===false)return {raw,state:'fail',label:'미적용',alerts};
    return {raw,state:'not_checked',label:'미확인',alerts};
  }
  function videoSEOSummary(ps){
    const out={provided:0,pending:0,unsupported:0,notApplicable:0,alertProjects:0,watchPages:0};
    for(const p of ps){const v=videoSEOState(p);if(!v.raw){out.pending++;continue}if(v.state==='not_applicable'){out.notApplicable++;continue}if(v.state==='unsupported'){out.unsupported++;continue}if(v.state==='pending'){out.pending++;continue}out.provided++;if(v.alerts.length)out.alertProjects++;if(Number.isFinite(Number(v.raw.watch_pages)))out.watchPages+=Number(v.raw.watch_pages)}
    return out;
  }
  function render(){if(!state.data)return;state.view==='search'?renderSearch():renderAnalytics()}

  function renderAnalytics(){
    const d=state.data,t=d.traffic||{},tot=d.totals||{},ps=d.projects||[];const root=q('#sitehubObservability');if(!root)return;
    const app=obsApplicability(tot,ps);
    const delta=t.vs_yesterday_pct==null?'어제 데이터 없음':`${Number(t.vs_yesterday_pct)>=0?'+':''}${pct(t.vs_yesterday_pct)} vs 어제`;
    const receiving=app.webProjects.filter(p=>p.analytics_status==='normal').sort((a,b)=>Number(b.today_pv)-Number(a.today_pv));
    const attention=app.webProjects.filter(p=>p.analytics_status!=='normal');
    const selectedRow=app.webProjects.find(p=>p.project_id===state.selectedProjectId)||null;
    const selectedReady=state.selectedProjectId&&state.selectedProjectData&&state.selectedProjectDays===state.days&&state.selectedProjectData.projects?.[0]?.project_id===state.selectedProjectId;
    const trendRows=state.selectedProjectId?(selectedReady?(state.selectedProjectData.traffic?.trend||[]):[]):(t.trend||[]);
    const trendName=selectedRow?.name||state.selectedProjectId||'전체 프로젝트';
    root.innerHTML=`
      <div class="obs-head"><div><p class="eyebrow">SITEHUB ANALYTICS</p><h2>전체 Analytics</h2><p>Monitor registry ${num(tot.registry_projects)}개 프로젝트의 SiteHub 수집 상태와 유입을 한 화면에서 봅니다.</p></div><div class="obs-head-actions"><button class="button" id="obsRefresh">새로고침</button><span>마지막 ${ago(d.generated_at)}</span></div></div>
      ${periodControls()}
      <div class="obs-metrics">${metric('오늘 외부 실사용 PV',num(t.today_pv),`${delta} · 내부·QA·자동화 제외`,'','pv')}${metric('오늘 전체 수집 PV',num(t.raw_today_pv),`원본 수집 · 고유 브라우저 ${num(t.raw_today_uv)}`,'','pv')}${metric('오늘 외부 실사용 UV',num(t.today_uv),'내부·QA·자동화 제외 · 익명 브라우저 ID 기준','','uv')}${metric('최근 7일 외부 PV',num(t.pv_7d),`고유 브라우저 ${num(t.uv_7d)} · clean`,'','pv')}${metric('최근 30일 외부 PV',num(t.pv_30d),`고유 브라우저 ${num(t.uv_30d)} · clean`,'','pv')}${metric('정상 수집',`${num(app.analyticsNormal)} / ${num(app.webTotal)}`,`미설치 ${num(app.analyticsMissing)} · 장기미수신 ${num(app.analyticsStale)} · 해당 없음 ${num(app.notApplicable)}`,app.analyticsIssue?'attention':'','analytics')}${metric('SiteHub 적용',`${num(tot.sitehub_connected)} / ${num(tot.registry_projects)}`,`미적용 ${num(tot.sitehub_missing)}`,tot.sitehub_missing?'attention':'') }</div>
      ${renderExcludedTraffic(t)}
      ${renderTrend(trendRows,app.webProjects,state.selectedProjectId,trendName,state.selectedProjectLoading,state.selectedProjectError)}
      <div class="obs-two-col">
        <article class="obs-card"><div class="obs-card-head"><div><span class="metric-kicker">PROJECTS</span><h3>상위 프로젝트</h3></div><small>클릭하면 위 그래프가 해당 프로젝트로 전환 · 선택 기간 ${state.days}일</small></div>${renderRankedProjects(t.top_projects||[])}</article>
        <article class="obs-card"><div class="obs-card-head"><div><span class="metric-kicker">COLLECTION</span><h3>Analytics 수집 상태</h3></div><small>${num(attention.length)}개 확인 필요</small></div><div class="obs-status-list">${receiving.slice(0,6).map(p=>statusLine(p,'normal')).join('')}${attention.slice(0,10).map(p=>statusLine(p,p.analytics_status)).join('')||'<p class="obs-empty">확인 필요한 프로젝트가 없습니다.</p>'}</div></article>
      </div>
      <div class="obs-two-col">
        <article class="obs-card"><div class="obs-card-head"><div><span class="metric-kicker">PAGES</span><h3>상위 페이지</h3></div></div>${renderPages(t.top_pages||[])}</article>
        <article class="obs-card"><div class="obs-card-head"><div><span class="metric-kicker">REFERRER</span><h3>주요 유입 경로</h3></div></div>${renderReferrers(t.top_referrers||[])}</article>
      </div>`;
    bindPeriod();
    q('#obsTrendProject')?.addEventListener('change',e=>selectAnalyticsProject(e.target.value));
    bindTrendHovers(root);
  }

  function linePoints(rows,key,max,w=900,h=230,p=28){return rows.map((x,i)=>`${p+(i/Math.max(1,rows.length-1))*(w-p*2)},${h-p-(Number(x?.[key]||0)/Math.max(1,max))*(h-p*2)}`).join(' ')}
  const fullDayLabel=v=>{const d=validDate(v);return d?new Intl.DateTimeFormat('ko-KR',{year:'numeric',month:'long',day:'numeric'}).format(d):String(v||'')};
  function hoverData(rows,keys){return E(JSON.stringify((rows||[]).map(r=>{const x={day:r?.day||r?.date||''};for(const key of keys)x[key]=Number(r?.[key]||0);return x})))}
  function bindTrendHovers(root=document){
    qa('.obs-hover-plot[data-trend]',root).forEach(plot=>{
      if(plot.dataset.hoverBound==='1')return;plot.dataset.hoverBound='1';
      let rows=[],series=[];try{rows=JSON.parse(plot.dataset.trend||'[]');series=JSON.parse(plot.dataset.series||'[]')}catch{return}
      if(!rows.length)return;
      const line=q('.obs-hover-line',plot),tip=q('.obs-hover-tooltip',plot),w=Number(plot.dataset.w||900),pad=Number(plot.dataset.pad||0);
      const hide=()=>{line?.classList.remove('show');tip?.classList.remove('show')};
      const show=e=>{
        const rect=plot.getBoundingClientRect();if(!rect.width)return;
        const left=(pad/w)*rect.width,right=rect.width-left,usable=Math.max(1,right-left);
        const raw=Math.max(left,Math.min(right,e.clientX-rect.left));
        const idx=rows.length===1?0:Math.max(0,Math.min(rows.length-1,Math.round(((raw-left)/usable)*(rows.length-1))));
        const x=rows.length===1?left:left+(idx/(rows.length-1))*usable,row=rows[idx];
        if(line){line.style.left=`${x}px`;line.classList.add('show')}
        if(tip){
          tip.innerHTML=`<strong>${E(fullDayLabel(row.day))}</strong>${series.map(([key,label])=>`<span><b>${E(label)}</b><em>${num(row[key])}</em></span>`).join('')}`;
          tip.style.left=`${x}px`;tip.classList.toggle('flip',x>rect.width*.68);tip.classList.add('show');
        }
      };
      plot.addEventListener('pointermove',show);plot.addEventListener('pointerleave',hide);plot.addEventListener('pointercancel',hide);
    });
  }
  function trendDelta(rows,key='pv'){if(rows.length<2)return '';const first=Number(rows[0]?.[key]||0),last=Number(rows[rows.length-1]?.[key]||0);if(first<=0)return last>0?'신규 유입 발생':'';const d=(last-first)/first*100;return `시작일 대비 ${d>=0?'+':''}${d.toFixed(1)}%`}
  function renderTrend(rows,projects=[],selectedId='',selectedName='전체 프로젝트',loading=false,error=''){
    const options=[...projects].sort((a,b)=>String(a.name||a.project_id).localeCompare(String(b.name||b.project_id),'ko')).map(p=>`<option value="${E(p.project_id)}" ${p.project_id===selectedId?'selected':''}>${E(p.name||p.project_id)} · ${E(p.project_id)}</option>`).join('');
    const picker=`<label class="obs-trend-picker"><span>그래프 프로젝트</span><select id="obsTrendProject"><option value="" ${selectedId?'':'selected'}>전체 프로젝트</option>${options}</select></label>`;
    if(loading)return `<article class="obs-card obs-trend"><div class="obs-card-head"><div><span class="metric-kicker">TRAFFIC TREND</span><h3>${E(selectedName)} 방문 추이</h3></div>${picker}</div><div class="obs-trend-loading"><i></i><strong>프로젝트 일별 데이터를 불러오는 중</strong></div></article>`;
    if(error)return `<article class="obs-card obs-trend"><div class="obs-card-head"><div><span class="metric-kicker">TRAFFIC TREND</span><h3>${E(selectedName)} 방문 추이</h3></div>${picker}</div><div class="obs-error"><strong>프로젝트 그래프 조회 실패</strong><p>${E(error)}</p></div></article>`;
    if(!rows.length)return `<article class="obs-card obs-trend"><div class="obs-card-head"><div><span class="metric-kicker">TRAFFIC TREND</span><h3>${E(selectedName)} 방문 추이</h3></div>${picker}</div><p class="obs-empty">선택 기간에 집계된 일별 트래픽이 없습니다.</p></article>`;
    const vals=rows.flatMap(x=>[Number(x.pv||0),Number(x.uv||0)]),max=Math.max(1,...vals),w=900,h=230,p=28,pvPts=linePoints(rows,'pv',max,w,h,p),uvPts=linePoints(rows,'uv',max,w,h,p);
    const data=hoverData(rows,['pv','uv']),series=E(JSON.stringify([['pv','PV'],['uv','고유 브라우저 (UV)']]));
    return `<article class="obs-card obs-trend"><div class="obs-card-head"><div><span class="metric-kicker">TRAFFIC TREND</span><h3>${E(selectedName)} 방문 추이</h3><p class="obs-trend-help">프로젝트를 바꿔가며 같은 그래프에서 확인합니다. 그래프 위에 마우스를 올리면 날짜별 PV·고유 브라우저(UV)가 표시됩니다.</p></div>${picker}</div><div class="obs-chart"><div class="obs-hover-plot" data-trend='${data}' data-series='${series}' data-w="${w}" data-pad="${p}"><svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-label="PV와 고유 브라우저 UV 일별 추이"><polyline class="pv" points="${pvPts}"></polyline><polyline class="uv" points="${uvPts}"></polyline></svg><i class="obs-hover-line"></i><div class="obs-hover-tooltip"></div></div><div class="obs-chart-legend"><span><i class="pv"></i>PV</span><span><i class="uv"></i>고유 브라우저 (UV)</span><strong>${E(trendDelta(rows,'pv'))}</strong></div><div class="obs-chart-axis"><span>${E(dayLabel(rows[0]?.day||''))}</span><strong>최고 ${num(max)}</strong><span>${E(dayLabel(rows[rows.length-1]?.day||''))}</span></div></div></article>`
  }
  function renderRankedProjects(rows){if(!rows.length)return '<p class="obs-empty">집계 데이터가 없습니다.</p>';const ranked=[...rows].sort((a,b)=>Number(b.pv||0)-Number(a.pv||0)||Number(b.raw_pv||0)-Number(a.raw_pv||0));const max=Math.max(1,...ranked.map(x=>Math.max(Number(x.pv||0),Number(x.raw_pv||0))));return `<div class="obs-ranking">${ranked.slice(0,12).map((p,i)=>`<div class="obs-ranking-row ${state.selectedProjectId===p.project_id?'active':''}"><button class="obs-ranking-main" data-obs-chart-project="${E(p.project_id)}" aria-label="${E(p.name||p.project_id)} 그래프로 보기"><em>${i+1}</em><span><b>${E(p.name||p.project_id)}</b><small>${E(p.project_id)} · 외부 ${num(p.pv)} PV / 원본 ${num(p.raw_pv)} PV · 제외 ${num(p.excluded_pv)} · 클릭하면 위 그래프 전환</small><i style="--bar:${Math.max(3,Math.max(Number(p.pv||0),Number(p.raw_pv||0))/max*100)}%"></i></span><strong>${num(p.pv)}<small>외부 PV</small></strong></button><button class="obs-detail-button" data-obs-detail-project="${E(p.project_id)}" aria-label="${E(p.name||p.project_id)} 상세 보기">상세</button></div>`).join('')}</div>`}
  function eventAge(p){const d=validDate(p?.last_event_at);if(d)return `마지막 ${ago(d)}`;if(['missing_loader','no_events'].includes(p?.analytics_status))return '수집 기록 없음';return '기록 없음'}
  function statusLine(p,s){return `<div class="obs-status-row-wrap"><button class="obs-status-row" data-obs-chart-project="${E(p.project_id)}" aria-label="${E(p.name||p.project_id)} 그래프로 보기"><span>${chip(s)}</span><b>${E(p.name||p.project_id)}</b><small>${eventAge(p)}</small><strong>${num(p.today_pv)} PV</strong></button><button class="obs-detail-button compact" data-obs-detail-project="${E(p.project_id)}" aria-label="${E(p.name||p.project_id)} 상세 보기">상세</button></div>`}
  function renderPages(rows){if(!rows.length)return '<p class="obs-empty">페이지 데이터가 없습니다.</p>';return `<div class="obs-simple-table">${rows.slice(0,14).map(x=>`<button data-obs-project="${E(x.project_id)}"><span><b>${E(x.pathname||'/')}</b><small>${E(x.hostname||'')} · ${E(x.project_id)}</small></span><strong>${num(x.pv)} PV</strong></button>`).join('')}</div>`}
  function renderReferrers(rows){if(!rows.length)return '<p class="obs-empty">referrer 데이터가 없습니다.</p>';return `<div class="obs-simple-table">${rows.slice(0,14).map(x=>`<button data-obs-project="${E(x.project_id)}"><span><b>${E(x.referrer_host||'Direct / Unknown')}</b><small>${E(x.project_id)}</small></span><strong>${num(x.pv)} PV</strong></button>`).join('')}</div>`}

  function visState(v){const s=String(v||'UNKNOWN').toUpperCase();return s==='PASS'?'pass':s==='PARTIAL'?'warn':s==='FAIL'?'fail':'unknown'}
  function visLabel(v){const s=String(v||'UNKNOWN').toUpperCase();return s==='PASS'?'PROVEN':s==='PARTIAL'?'PARTIAL':s==='FAIL'?'FAIL':'UNKNOWN'}
  function searchCountRatio(v,doneKey,totalKey,boolKey){
    const done=v?.[doneKey],total=v?.[totalKey];
    if(done!=null&&total!=null)return `<strong>${num(done)}</strong><small>/ ${num(total)} URL</small>`;
    const b=v?.[boolKey];return chip(b===true?'pass':b===false?'fail':'unknown',b===true?'확인':'미확인');
  }
  function renderSearchPipeline(ps,app){
    const web=ps.filter(obsWebApplicable);
    const crawled=web.filter(p=>p.visibility?.crawled===true).length;
    const indexed=web.filter(p=>p.visibility?.indexed===true).length;
    const impressionProjects=web.filter(p=>Number(p.visibility?.impressions_28d||0)>0).length;
    const queryProjects=web.filter(p=>Number(p.visibility?.query_count_28d||0)>0).length;
    const clickProjects=web.filter(p=>Number(p.visibility?.clicks_28d||0)>0).length;
    const posRows=web.map(p=>p.visibility||{}).filter(v=>Number(v.impressions_28d||0)>0&&Number.isFinite(Number(v.avg_position_28d)));
    const posDen=posRows.reduce((a,v)=>a+Number(v.impressions_28d||0),0);
    const avgPos=posDen>0?posRows.reduce((a,v)=>a+Number(v.avg_position_28d||0)*Number(v.impressions_28d||0),0)/posDen:null;
    const step=(label,value,note,state='')=>`<div class="obs-search-pipeline-step ${state}"><span>${E(label)}</span><strong>${E(value)}</strong><small>${E(note)}</small></div>`;
    return `<div class="obs-search-pipeline" aria-label="Google 검색 흐름">
      ${step('1 크롤링',`${num(crawled)} / ${num(app.webTotal)}`,'GSC crawl 확인')}
      ${step('2 색인',`${num(indexed)} / ${num(app.webTotal)}`,'URL Inspection')}
      ${step('3 실제 노출',`${num(impressionProjects)}개`,'28일 노출 발생')}
      ${step('4 실제 검색어',`${num(queryProjects)}개`,'query 데이터 있음')}
      ${step('5 클릭',`${num(clickProjects)}개`,'28일 클릭 발생')}
      ${step('6 평균순위',avgPos==null?'-':avgPos.toFixed(1),'노출 가중 · 28일')}
    </div>`;
  }
  function renderSearch(){
    const d=state.data,ps=d.projects||[];const app=obsApplicability(d.totals||{},ps),root=q('#sitehubObservability');if(!root)return;
    root.innerHTML=`
      <div class="obs-head"><div><p class="eyebrow">SITEHUB SEARCH VISIBILITY</p><h2>검색 실노출 관제</h2><p>크롤링 → 색인 → 실제 노출 → 실제 검색어 → 클릭 → 평균순위를 한 흐름으로 봅니다. 상세에서 실제 검색어를 확인할 수 있습니다.</p></div><div class="obs-head-actions"><button class="button" id="obsRefresh">새로고침</button><span>마지막 ${ago(d.generated_at)}</span></div></div>
      ${renderSearchPipeline(ps,app)}
      <article class="obs-card obs-search-card">
        <div class="obs-card-head"><div><span class="metric-kicker">GOOGLE SEARCH CONSOLE</span><h3>프로젝트별 검색 흐름</h3></div><div class="obs-search-filter"><input id="obsSearchFilter" type="search" placeholder="프로젝트·도메인 검색"><select id="obsSearchState"><option value="all">전체 상태</option><option value="fail">SERP FAIL</option><option value="partial">SERP PARTIAL</option><option value="proven">Visibility PROVEN</option><option value="unknown">UNKNOWN</option></select></div></div>
        <div class="obs-search-table-wrap"><table class="obs-search-table obs-search-flow-table"><thead><tr><th>프로젝트</th><th>크롤링</th><th>색인</th><th>실제 노출</th><th>실제 검색어</th><th>클릭</th><th>평균순위</th><th>SERP</th></tr></thead><tbody id="obsSearchRows"></tbody></table></div>
      </article>`;
    const draw=()=>renderSearchRows(ps);draw();q('#obsRefresh')?.addEventListener('click',()=>load(true));q('#obsSearchFilter')?.addEventListener('input',draw);q('#obsSearchState')?.addEventListener('change',draw);
  }
  function renderSearchRows(ps){
    const body=q('#obsSearchRows');if(!body)return;const term=(q('#obsSearchFilter')?.value||'').trim().toLowerCase(),flt=q('#obsSearchState')?.value||'all';
    const rows=ps.filter(obsWebApplicable).filter(p=>{const v=p.visibility||{};if(term&&!`${p.project_id} ${p.name} ${p.public_url}`.toLowerCase().includes(term))return false;if(flt==='fail'&&v.serp_visibility_status!=='FAIL')return false;if(flt==='partial'&&v.serp_visibility_status!=='PARTIAL')return false;if(flt==='proven'&&v.serp_visibility_status!=='PASS')return false;if(flt==='unknown'&&v.serp_visibility_status!=='UNKNOWN'&&v.serp_visibility_status)return false;return true});
    body.innerHTML=rows.length?rows.map(p=>{const v=p.visibility||{};return `<tr>
      <td><div class="obs-project-cell"><span><strong>${E(p.name)}</strong><small>${E(p.project_id)} · ${E(p.public_url||'URL 없음')}</small></span><button class="obs-detail-button compact" data-obs-detail-project="${E(p.project_id)}" aria-label="${E(p.name)} 상세 보기">상세</button></div></td>
      <td><div class="obs-stage-cell">${searchCountRatio(v,'crawled_urls','candidate_urls','crawled')}</div></td>
      <td><div class="obs-stage-cell">${searchCountRatio(v,'indexed_urls','candidate_urls','indexed')}</div></td>
      <td><strong>${v.impressions_28d==null?'-':num(v.impressions_28d)}</strong></td>
      <td><strong>${v.query_count_28d==null?'-':num(v.query_count_28d)}</strong></td>
      <td><strong>${v.clicks_28d==null?'-':num(v.clicks_28d)}</strong></td>
      <td><strong>${v.avg_position_28d==null?'-':Number(v.avg_position_28d).toFixed(1)}</strong></td>
      <td>${chip(visState(v.serp_visibility_status),visLabel(v.serp_visibility_status))}</td>
    </tr>`}).join(''):'<tr><td colspan="8" class="obs-empty">조건에 맞는 프로젝트가 없습니다.</td></tr>';
  }

  async function openProject(id){
    const dlg=q('#obsProjectDialog'),body=q('#obsProjectDialogBody');if(!dlg||!body)return;body.innerHTML='<div class="obs-loading compact"><i></i><strong>프로젝트 상세를 불러오는 중</strong></div>';if(!dlg.open)dlg.showModal();
    try{const d=await request(`/api/sitehub/projects/${encodeURIComponent(id)}?days=30`);renderProjectDialog(d)}catch(e){body.innerHTML=`<div class="modal-head"><div><p class="eyebrow">PROJECT DETAIL</p><h2>상세 조회 실패</h2></div><button class="icon-button" data-obs-close aria-label="닫기">×</button></div><div class="obs-error"><p>${E(e?.message||String(e))}</p></div>`}
  }
  function renderProjectDialog(d){
    const p=d.projects?.[0];if(!p)return;const body=q('#obsProjectDialogBody'),t=d.traffic||{},s=p.search||{},idx=s.google_index||{},diag=p.search_diagnostics||{};const applicable=obsWebApplicable(p),ncStatus=applicable?(p.namecard_status==='normal'?'pass':'fail'):'not_applicable',analyticsStatus=applicable?(p.analytics_status||'unknown'):'not_applicable',searchStatus=applicable?(s.readiness||'not_checked'):'not_applicable',video=videoSEOState(p),rawErrors=[...(s.errors||[]),...(p.alerts||[]),...video.alerts],errors=applicable?rawErrors:rawErrors.filter(x=>{const v=String(typeof x==='string'?x:'');return v!=='namecard_fail'&&!v.startsWith('analytics_')&&!v.startsWith('search_')&&v!=='sitemap_fail'&&v!=='robots_fail'});
    body.innerHTML=`<div class="modal-head"><div><p class="eyebrow">${E(p.project_id)} · SITEHUB</p><h2>${E(p.name)}</h2><p class="obs-dialog-url">${p.public_url?`<a href="${E(p.public_url)}" target="_blank" rel="noreferrer">${E(p.public_url)}</a>`:'운영 URL 없음'}</p></div><button class="icon-button" data-obs-close aria-label="닫기">×</button></div>
      <div class="obs-detail-strip"><span><small>${term('서비스 상태','service')}</small>${chip(p.service_status)}</span><span><small>${term('페이지 기본정보','namecard')}</small>${chip(ncStatus)}</span><span><small>${term('방문 수집','analytics')}</small>${chip(analyticsStatus)}</span><span><small>${term('Technical Ready','technical')}</small>${chip(p.visibility?.tech_ready===true?'pass':p.visibility?.tech_ready===false?'fail':'unknown')}</span><span><small>${term('SERP 실노출','serp')}</small>${chip(visState(p.visibility?.serp_visibility_status),visLabel(p.visibility?.serp_visibility_status))}</span><span><small>${term('영상 검색','videoseo')}</small>${chip(video.state,video.label)}</span></div>
      <div class="obs-dialog-grid"><section><h3>방문 분석 · 최근 30일</h3><div class="obs-dialog-metrics"><span><small>${term('PV','pv')}</small><strong>${num(p.pv_30d)}</strong></span><span><small>${term('고유 브라우저 (UV)','uv')}</small><strong>${num(p.uv_30d)}</strong></span><span><small>${term('마지막 수집','lastcollect')}</small><strong>${!applicable?'해당 없음':validDate(p.last_event_at)?ago(p.last_event_at):'수집 기록 없음'}</strong></span></div>${renderProjectVisitTrend(t.trend||[])}<div class="obs-detail-subhead">${term('상위 페이지','pages')}</div>${renderPages(t.top_pages||[])}<div class="obs-detail-subhead">${term('주요 유입 경로','referrer')}</div>${renderReferrers(t.top_referrers||[])}</section>
      <section><h3>검색 노출·기술 상태</h3>${applicable?renderProjectSearchFlow(p)+renderActualQueries(diag.top_queries||[])+renderSearchExposureTrend(s)+searchEvidence(s,idx,p)+videoSEOEvidence(s,p):'<p class="obs-empty">웹 운영 URL이 없어 SearchOps 적용 대상이 아닙니다.</p>'}</section></div>
      <section class="obs-issues"><div class="obs-card-head"><div><span class="metric-kicker">ISSUES & ALERTS</span><h3>${term('확인할 항목','issues')}</h3></div><small>${num(errors.length)}건</small></div>${errors.length?`<ul>${errors.map(x=>`<li>${E(explainAlert(x))}</li>`).join('')}</ul>`:'<p class="obs-empty">현재 표시할 경고가 없습니다.</p>'}</section>`;
    bindTrendHovers(body);
  }
  function renderProjectSearchFlow(p){
    const v=p?.visibility||{};
    const stage=(label,value,note,state)=>`<div class="obs-project-search-step ${state||''}"><span>${E(label)}</span><strong>${E(value)}</strong><small>${E(note)}</small></div>`;
    const crawl=v.crawled_urls==null?(v.crawled===true?'확인':v.crawled===false?'미완료':'-'):`${num(v.crawled_urls)} / ${num(v.candidate_urls||0)}`;
    const index=v.indexed_urls==null?(v.indexed===true?'확인':v.indexed===false?'미완료':'-'):`${num(v.indexed_urls)} / ${num(v.candidate_urls||0)}`;
    return `<div class="obs-project-search-flow">
      ${stage('크롤링',crawl,'URL')}
      ${stage('색인',index,'URL')}
      ${stage('노출',v.impressions_28d==null?'-':num(v.impressions_28d),'28일')}
      ${stage('검색어',v.query_count_28d==null?'-':num(v.query_count_28d),'실제 query')}
      ${stage('클릭',v.clicks_28d==null?'-':num(v.clicks_28d),'28일')}
      ${stage('평균순위',v.avg_position_28d==null?'-':Number(v.avg_position_28d).toFixed(1),'28일')}
    </div>`;
  }
  function queryRow(x){
    const ctr=x?.ctr==null?'-':`${(Number(x.ctr)*100).toFixed(1)}%`;
    return `<div class="obs-query-row"><b title="${E(x?.query||'')}">${E(x?.query||'-')}</b><span>${num(x?.impressions||0)}</span><span>${num(x?.clicks||0)}</span><span>${ctr}</span><span>${x?.position==null?'-':Number(x.position).toFixed(1)}</span></div>`;
  }
  function renderActualQueries(rows){
    rows=Array.isArray(rows)?rows.filter(x=>x&&x.query):[];
    if(!rows.length)return '<div class="obs-index-box obs-query-empty"><strong>실제 검색어 · 28일</strong><p>Search Console에서 관측된 검색어가 아직 없습니다.</p></div>';
    const first=rows.slice(0,5),rest=rows.slice(5,30);
    return `<div class="obs-query-box"><div class="obs-query-head"><span><strong>실제 검색어 · 28일</strong><small>노출순 · 상위 ${num(Math.min(rows.length,30))}개</small></span></div><div class="obs-query-row head"><b>검색어</b><span>노출</span><span>클릭</span><span>CTR</span><span>순위</span></div>${first.map(queryRow).join('')}${rest.length?`<details class="obs-query-more"><summary>검색어 ${num(rest.length)}개 더 보기</summary><div>${rest.map(queryRow).join('')}</div></details>`:''}</div>`;
  }

  function renderProjectVisitTrend(rows){
    if(!rows.length)return '<div class="obs-mini-trend empty"><strong>프로젝트별 방문 증가 추이</strong><p>일별 PV/고유 브라우저(UV) 데이터가 아직 없습니다.</p></div>';
    const w=620,h=150,pad=18,max=Math.max(1,...rows.flatMap(x=>[Number(x.pv||0),Number(x.uv||0)])),first=rows[0]||{},last=rows[rows.length-1]||{};
    const firstPV=Number(first.pv||0),lastPV=Number(last.pv||0),delta=firstPV>0?((lastPV-firstPV)/firstPV*100):null;
    const change=delta==null?(lastPV>0?'신규 방문 발생':'변화 없음'):`${delta>=0?'+':''}${delta.toFixed(1)}%`,data=hoverData(rows,['pv','uv']),series=E(JSON.stringify([['pv','PV'],['uv','고유 브라우저 (UV)']]));
    return `<div class="obs-mini-trend"><div class="obs-mini-trend-head"><strong>프로젝트별 방문 증가 추이</strong><span>${term('PV','pv')} · ${term('고유 브라우저 (UV)','uv')} · 그래프에 마우스를 올려 일별 값 확인</span></div><div class="obs-growth-summary"><span><small>첫날 PV</small><strong>${num(firstPV)}</strong></span><span><small>최근일 PV</small><strong>${num(lastPV)}</strong></span><span><small>기간 변화</small><strong class="${delta!=null&&delta<0?'down':'up'}">${E(change)}</strong></span></div><div class="obs-hover-plot" data-trend='${data}' data-series='${series}' data-w="${w}" data-pad="${pad}"><svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-label="프로젝트 일별 PV와 고유 브라우저 UV 추이"><polyline class="pv" points="${linePoints(rows,'pv',max,w,h,pad)}"></polyline><polyline class="uv" points="${linePoints(rows,'uv',max,w,h,pad)}"></polyline></svg><i class="obs-hover-line"></i><div class="obs-hover-tooltip"></div></div><div class="obs-chart-axis"><span>${E(dayLabel(first.day||''))}</span><strong>최고 ${num(max)}</strong><span>${E(dayLabel(last.day||''))}</span></div><p class="obs-trend-note">이 그래프는 <b>방문(PV/고유 브라우저(UV))</b> 증가 추이입니다. Google 검색 결과의 실제 <b>노출</b>은 Search Console 데이터가 연결될 때 오른쪽의 별도 검색 노출 그래프로 표시합니다.</p></div>`;
  }
  function renderSearchExposureTrend(s){
    const sc=s?.search_console||s?.google_search_console||{};
    const rows=Array.isArray(sc.trend)?sc.trend:[];
    const usable=rows.filter(x=>Number.isFinite(Number(x?.impressions))||Number.isFinite(Number(x?.clicks)));
    if(!usable.length)return `<div class="obs-index-box obs-exposure-wait"><strong>${term('검색 노출 추이','impressions')}</strong><p>검증된 Google Search Console 일별 노출·클릭 데이터가 아직 SiteHub에서 제공되지 않아 그래프를 그릴 수 없습니다. 아래 방문 추이(PV/고유 브라우저(UV))와는 다른 지표입니다.</p></div>`;
    const w=620,h=150,pad=18,max=Math.max(1,...usable.flatMap(x=>[Number(x.impressions||0),Number(x.clicks||0)]));
    const normalized=usable.map(x=>({...x,day:x.day||x.date}));
    const data=hoverData(normalized,['impressions','clicks']),series=E(JSON.stringify([['impressions','검색 노출'],['clicks','클릭']]));
    return `<div class="obs-mini-trend search-exposure"><div class="obs-mini-trend-head"><strong>${term('Google 검색 노출 추이','impressions')}</strong><span>노출 · 클릭 · 그래프에 마우스를 올려 일별 값 확인</span></div><div class="obs-hover-plot" data-trend='${data}' data-series='${series}' data-w="${w}" data-pad="${pad}"><svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-label="Google 검색 노출과 클릭 추이"><polyline class="pv" points="${linePoints(normalized,'impressions',max,w,h,pad)}"></polyline><polyline class="uv" points="${linePoints(normalized,'clicks',max,w,h,pad)}"></polyline></svg><i class="obs-hover-line"></i><div class="obs-hover-tooltip"></div></div><div class="obs-chart-axis"><span>${E(dayLabel(normalized[0]?.day||''))}</span><strong>최고 노출 ${num(Math.max(...normalized.map(x=>Number(x.impressions||0))))}</strong><span>${E(dayLabel(normalized[normalized.length-1]?.day||''))}</span></div></div>`;
  }
  function videoSEOEvidence(s,p){
    const v=s?.video_seo;
    if(!v||typeof v!=='object'||Array.isArray(v))return '<div class="obs-index-box"><strong>VideoSEO</strong><p>SiteHub가 아직 VideoSEO 지표를 제공하지 않아 수집 대기입니다.</p></div>';
    if(v.applicable===false)return '<div class="obs-index-box"><strong>VideoSEO</strong><p>SiteHub가 이 프로젝트를 VideoSEO 비적용 대상으로 표시했습니다.</p></div>';
    const vs=videoSEOState(p),st=v.states||{},vo=v.video_object||{},sm=v.video_sitemap||{},wu=v.watch_urls||{},su=v.source_unavailable||{},sc=v.search_console||{};
    const scReady=sc&&Object.keys(sc).length>0;
    const alertText=vs.alerts.length?`<p class="obs-evidence-url"><b>VideoSEO 경보</b> ${E(vs.alerts.map(x=>typeof x==='string'?x:JSON.stringify(x)).join(', '))}</p>`:'';
    const sitemapText=sm.url?`<p class="obs-evidence-url"><b>Video sitemap</b> ${E(sm.url)}${sm.http_status?` · HTTP ${E(sm.http_status)}`:''}${sm.last_modified?` · 갱신 ${E(sm.last_modified)}`:''}</p>`:'';
    return `<div class="obs-index-box"><strong>${term('VideoSEO 상태','videoseo')}</strong><p>${term('감시 영상 페이지','watchpages')} ${numMaybe(v.watch_pages)} · ${term('정상 공개','active')} ${numMaybe(st.active)} · ${term('추세 감지','trending')} ${numMaybe(st.trending)} · ${term('보관','archived')} ${numMaybe(st.archived)} · ${term('원본 확인 불가','sourceunavailable')} ${numMaybe(st.source_unavailable)} · ${term('제거','removed')} ${numMaybe(st.removed)}</p></div><div class="obs-evidence"><div><span>적용 상태</span>${chip(vs.state,vs.label)}</div><div><span>${term('영상 구조화 데이터','videoobject')}</span>${chip(vo.status||'not_checked')}</div><div><span>${term('영상 Sitemap','sitemap')}</span>${chip(sm.status||'not_checked')}</div><div><span>${term('영상 페이지 URL 오류','watchurl')}</span><strong>${numMaybe(wu.broken)}</strong></div><div><span>${term('404 / 410','httpstatus')}</span><strong>${numMaybe(wu.http_404)} / ${numMaybe(wu.http_410)}</strong></div><div><span>${term('원본 확인 불가','sourceunavailable')}</span><strong>${numMaybe(su.count)} · ${su.ratio===null||su.ratio===undefined?'-':pct(su.ratio)}</strong></div></div>${sitemapText}<div class="obs-index-box"><strong>${term('Video Search Console','searchconsole')}</strong><p>${scReady?`색인 감시 페이지 ${numMaybe(sc.indexed_watch_pages)} · 영상 색인 ${numMaybe(sc.video_indexed)} · 실패 ${numMaybe(sc.video_failed)} · ${term('Rich result 오류','richresult')} ${numMaybe(sc.rich_result_errors)} · 검색 노출 ${numMaybe(sc.impressions)} · 클릭 ${numMaybe(sc.clicks)}`:'검증된 Search Console Video 지표가 아직 연결되지 않아 수집 대기입니다.'}</p></div>${alertText}`;
  }
  function searchEvidence(s,idx,p){
    if(!s||!Object.keys(s).length)return '<p class="obs-empty">SearchOps 점검 결과가 아직 없습니다.</p>';
    const v=p.visibility||{},rows=[['Technical readiness','technical',v.tech_ready===true?'pass':v.tech_ready===false?'fail':'unknown'],['Google Indexing','googleindex',v.indexing_status==='PASS'?'pass':v.indexing_status==='FAIL'?'fail':'unknown'],['SERP Visibility','serp',visState(v.serp_visibility_status)],['Organic Acquisition','analytics',String(v.acquisition_status||'UNKNOWN').toLowerCase()],['Business Outcome','conversion',String(v.business_outcome_status||'UNKNOWN').toLowerCase()],['Sitemap','sitemap',s.sitemap?.status],['Robots','robots',s.robots?.status],['대표 URL 선언','canonical',s.root?.canonical_ok?'pass':'fail'],['Googlebot 콘텐츠 동일성','googlebot',s.root?.googlebot_parity_ok?'pass':'fail']];
    const tqTotal=Number(v.target_query_total||0),tqObserved=Number(v.target_query_observed||0);
    return `<div class="obs-evidence">${rows.map(([label,key,x])=>`<div><span>${term(label,key)}</span>${chip(x||'not_checked')}</div>`).join('')}</div><div class="obs-index-box"><strong>Google SERP Evidence · 28d</strong><p>Impressions <b>${v.impressions_28d==null?'-':num(v.impressions_28d)}</b> · Clicks <b>${v.clicks_28d==null?'-':num(v.clicks_28d)}</b> · CTR <b>${v.ctr_28d==null?'-':pct(v.ctr_28d)}</b> · 평균순위 <b>${v.avg_position_28d==null?'-':Number(v.avg_position_28d).toFixed(1)}</b> · 실제 query <b>${v.query_count_28d==null?'-':num(v.query_count_28d)}</b></p><p>Target Query <b>${tqTotal?`${num(tqObserved)}/${num(tqTotal)}`:'미등록'}</b> · 다른 URL 노출 <b>${num(v.target_query_wrong_page||0)}</b> · Organic sessions <b>${v.organic_search_sessions_28d==null?'-':num(v.organic_search_sessions_28d)}</b></p><p><b>대표 상태</b> ${E(v.primary_issue||'UNKNOWN')}</p>${Array.isArray(v.evidence?.priority_issues)&&v.evidence.priority_issues.length?`<p><b>우선순위 이슈</b> ${v.evidence.priority_issues.slice(0,6).map(x=>`${E(x.priority)} ${E(x.code)}`).join(' · ')}</p>`:''}</div><div class="obs-index-box"><strong>Readiness 참고값</strong><p>기존 SEO/AEO/GEO는 구현 준비 신호로만 유지합니다. SEO ${E(s.seo_status||'not_checked')} · AEO ${E(s.aeo_status||'not_checked')} · GEO ${E(s.geo_status||'not_checked')}. 실제 검색 성공 판정에는 위 GSC 노출값을 사용합니다.</p></div>${s.sitemap?.url?`<p class="obs-evidence-url"><b>Sitemap</b> ${E(s.sitemap.url)} ${s.sitemap.http_status?`· HTTP ${E(s.sitemap.http_status)}`:''}</p>`:''}`;
  }

  document.addEventListener('DOMContentLoaded',()=>{ensureShell();state.refreshTimer=setInterval(()=>{if(state.view!=='operations'&&document.visibilityState==='visible')load(true)},60000)});
})();
