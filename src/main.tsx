import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { supabase } from './supabase';
import {
  CalendarDays, ChevronRight, ClipboardList, Download, HeartHandshake,
  Home as HomeIcon, LogIn, LogOut, Menu, MessageSquareHeart, Search,
  Archive, Trash2, ShieldCheck, Users, Utensils, X,
} from 'lucide-react';
import './styles.css';

type Page = 'home' | 'register' | 'survey' | 'admin' | 'success';

type Registration = {
  id: string; created_at: string; first_name: string; last_name: string;
  family_size: number; distribution_date: string | null; archived_at: string | null;
};

type Survey = {
  id: string; created_at: string; registration_id: string | null;
  experience: string; rating: number; preferences: string[];
  comments: string | null; archived_at: string | null;
};

type Distribution = { month: string; slot: number; date: string; time: string };
function todayLagos() { const parts=new Intl.DateTimeFormat('en-US',{timeZone:'Africa/Lagos',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()); const part=(name:string)=>parts.find(item=>item.type===name)!.value; return `${part('year')}-${part('month')}-${part('day')}`; }
function defaults(month:string):Distribution[] {
  const [year,n]=month.split('-').map(Number);
  const first=1+(6-new Date(Date.UTC(year,n-1,1)).getUTCDay()+7)%7;
  return [first,first+14].map((day,i)=>({month,slot:i+1,date:`${month}-${String(day).padStart(2,'0')}`,time:'10:00 AM – 1:00 PM'}));
}
function labelDate(date:string) { return new Date(`${date}T12:00:00Z`).toLocaleDateString('en-NG',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}); }
function availableDistributions(dates:Distribution[],today:string) {
  return dates.filter(item=>{
    const first=dates.find(row=>row.month===item.month&&row.slot===1);
    return item.date>=today && (item.slot===1 || (!!first && today>first.date));
  }).sort((a,b)=>a.date.localeCompare(b.date));
}
function useSchedule() {
  const [today,setToday]=useState(todayLagos()); const [dates,setDates]=useState<Distribution[]>([]);
  const [scheduleVersion,setScheduleVersion]=useState(0);
  useEffect(()=>{
    const refresh=()=>{setToday(todayLagos());setScheduleVersion(version=>version+1);};
    const timer=setInterval(()=>setToday(todayLagos()),60000);
    window.addEventListener('pantry-schedule-updated',refresh);window.addEventListener('focus',refresh);
    return()=>{clearInterval(timer);window.removeEventListener('pantry-schedule-updated',refresh);window.removeEventListener('focus',refresh);};
  },[]);
  useEffect(()=>{let active=true;const month=today.slice(0,7);
    const next=new Date(`${month}-01T12:00:00Z`);next.setUTCMonth(next.getUTCMonth()+1);
    const months=[month,next.toISOString().slice(0,7)];
    (async()=>{let items=months.flatMap(defaults);
      if(supabase){const {data}=await supabase.from('distribution_dates').select('month,slot,date,time').in('month',months);
        if(data)items=items.map(item=>data.find(row=>row.month===item.month&&row.slot===item.slot)||item);}
      if(active)setDates(items);
    })();return()=>{active=false};
  },[today,scheduleVersion]);
  return {today,dates,setDates};
}
function Brand(){return <><img className="brandmark" src="/rccg-logo.png" alt="RCCG logo"/><span><b>RCCG</b><small>SOLUTION CENTER FOR ALL NATIONS · FOOD PANTRY</small></span></>}

function App() {
  const [page, setPage] = useState<Page>('home');
  const [mobile, setMobile] = useState(false);
  const [registeredId, setRegisteredId] = useState('');
  const {today,dates}=useSchedule();
  const go = (nextPage: Page) => {
    setPage(nextPage); setMobile(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  return <>
    <header><div className="nav">
      <button className="brand" onClick={() => go('home')}>
        <Brand/>
      </button>
      <button className="mobilebtn" onClick={() => setMobile(!mobile)} aria-label="Toggle navigation">
        {mobile ? <X /> : <Menu />}
      </button>
      <nav className={mobile ? 'open' : ''}>
        <button onClick={() => go('home')}>Home</button>
        <button onClick={() => go('register')}>Register</button>
        <button onClick={() => go('survey')}>Feedback</button>
        <button className="adminlink" onClick={() => go('admin')}><ShieldCheck size={16}/> Admin</button>
      </nav>
    </div></header>

    {page === 'home' && <Home go={go} dates={dates} today={today}/>}
    {page === 'register' && <Register dates={dates} today={today} onDone={(id) => { setRegisteredId(id); go('success'); }}/>}
    {page === 'success' && <main className="success"><HeartHandshake size={54}/><h1>Registration complete.</h1><p>Thank you. We look forward to seeing you on your selected distribution date.</p><button className="primary" onClick={()=>go('survey')}>Share feedback <ChevronRight/></button></main>}
    {page === 'survey' && <SurveyForm registrationId={registeredId}/>}
    {page === 'admin' && <Admin/>}

    <footer>
      <div className="footerBrand"><Brand/><p>Serving our neighbors with dignity, care and practical support.</p></div>
      <div><b>Distribution</b><p>See the current pantry schedule above.</p></div>
      <div className="copyright">© {new Date().getFullYear()} RCCGSC. All rights reserved.</div>
    </footer>
  </>;
}

function Home({ go, dates, today }: { go: (page: Page) => void; dates: Distribution[]; today:string }) {
  return <main>
    <section className="hero">
      <div className="heroText">
        <span className="eyebrow">RCCGSC COMMUNITY SUPPORT</span>
        <h1>Food support, delivered with <em>dignity.</em></h1>
        <p>Register for an upcoming pantry distribution, tell us what your household needs, and help us improve the experience for our neighbors.</p>
        <div className="actions">
          <button className="primary" onClick={() => go('register')}>Register for distribution <ChevronRight/></button>
          <button className="secondary" onClick={() => go('survey')}>Share feedback</button>
        </div>
      </div>
      <div className="heroCard">
        <HeartHandshake size={36}/><h3>You're welcome here.</h3>
        <p>Our pantry is here to support individuals and families in our community.</p>
        <div className="mini"><CalendarDays/><span><b>Next distribution</b><br/>Check the schedule below</span></div>
      </div>
    </section>

    <section className="section">
      <div className="sectionHead"><span className="eyebrow">PANTRY SCHEDULE</span><h2>Plan your visit</h2><p>Check the upcoming distribution dates before your visit.</p></div>
      <div className="schedule">{dates.filter(item=>item.date>=today).slice(0,2).map(item=><div className="scheduleCard" key={item.date}><div className="dateIcon"><CalendarDays/></div><div><b>{item.slot===1?'First':'Third'} Saturday</b><h3>{labelDate(item.date)}</h3><p>{item.time}</p></div></div>)}</div>
    </section>

    <section className="blueBand">
      <div><span className="eyebrow light">HOW IT WORKS</span><h2>Simple from registration to distribution.</h2></div>
      <div className="steps">{[
        ['01','Register','Tell us your first name, last name, family size and preferred distribution date.'],
        ['02','Prepare','Review your selected distribution date and arrive during the stated time.'],
        ['03','Share','Complete a short survey so we can serve the community better.'],
      ].map(([number,title,description])=><div className="step" key={number}><span>{number}</span><h3>{title}</h3><p>{description}</p></div>)}</div>
    </section>

    <section className="section two">
      <div className="info"><Utensils size={30}/><h2>Help us understand what families need.</h2><p>Food preferences and feedback help the pantry plan quantities and make future distributions more useful.</p><button className="textBtn" onClick={() => go('survey')}>Complete feedback <ChevronRight/></button></div>
      <div className="info pale"><Users size={30}/><h2>Managing the pantry?</h2><p>Authorized coordinators can securely view registrations, family counts, feedback and insights.</p><button className="textBtn" onClick={() => go('admin')}>Open admin dashboard <ChevronRight/></button></div>
    </section>
  </main>;
}

function Register({ onDone, dates, today }: { onDone: (id: string) => void; dates:Distribution[]; today:string }) {
  const [form,setForm]=useState({first_name:'',last_name:'',family_size:'',distribution_date:''});
  const [loading,setLoading]=useState(false); const [message,setMessage]=useState('');
  const availableDates=useMemo(()=>availableDistributions(dates,today),[dates,today]);
  useEffect(()=>{
    setForm(current=>current.distribution_date && !availableDates.some(item=>item.date===current.distribution_date)
      ? {...current,distribution_date:''}:current);
  },[availableDates]);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage('');
    const firstName=form.first_name.trim(); const lastName=form.last_name.trim();
    if(!firstName || !lastName){setMessage('Please enter your first name and last name.');return;}
    const familySize=Number(form.family_size);
    if(!Number.isInteger(familySize) || familySize<1 || familySize>30){setMessage('Please select your family size.');return;}
    if(!availableDates.some(item=>item.date===form.distribution_date)){setMessage('Please select an available distribution date.');return;}
    setLoading(true);
    if (!supabase) { setMessage('Connect Supabase using .env.local before submitting.'); setLoading(false); return; }
    const id=crypto.randomUUID();
    try {
      const {error}=await supabase.from('registrations').insert({
        id, first_name:firstName, last_name:lastName, family_size:familySize, distribution_date:form.distribution_date,
      });
      if(error){setMessage(error.message);return;}
      onDone(id);
    } catch { setMessage('Unable to submit your registration. Please try again.'); }
    finally { setLoading(false); }
  }
  return <main className="formPage"><div className="formWrap">
    <span className="eyebrow">REGISTRATION</span><h1>Register for food distribution</h1>
    <p className="lead">Please provide accurate information so the pantry team can plan for your household.</p>
    <form onSubmit={submit}>
      <div className="grid2">
        <label>First name<input required maxLength={100} autoComplete="given-name" value={form.first_name} onChange={e=>setForm({...form,first_name:e.target.value})}/></label>
        <label>Last name<input required maxLength={100} autoComplete="family-name" value={form.last_name} onChange={e=>setForm({...form,last_name:e.target.value})}/></label>
      </div>
      <div className="grid2">
        <label>Family Size<select required value={form.family_size} onChange={e=>setForm({...form,family_size:e.target.value})}>
          <option value="">Select your family size</option>
          {Array.from({length:30},(_,i)=>i+1).map(size=><option key={size} value={size}>{size}</option>)}
        </select></label>
        <label>Preferred Distribution Date<select required disabled={!availableDates.length} value={form.distribution_date} onChange={e=>setForm({...form,distribution_date:e.target.value})}>
          <option value="">Select a date</option>
          {availableDates.map(item=><option key={item.date} value={item.date}>{labelDate(item.date)} · {item.time}</option>)}
        </select></label>
      </div>
      <div className="notice"><ShieldCheck size={18}/><span>Your information is used by the pantry team for distribution and planning only!</span></div>
      {message&&<div className="error" role="alert">{message}</div>}
      <button className="primary full" disabled={loading||!availableDates.length} type="submit">{loading?'Submitting…':'Complete registration'} <ChevronRight/></button>
    </form>
  </div></main>;
}

function SurveyForm({ registrationId }: { registrationId: string }) {
  const [rating,setRating]=useState(0); const [experience,setExperience]=useState('');
  const [comments,setComments]=useState('');
  const [done,setDone]=useState(false); const [message,setMessage]=useState(''); const [loading,setLoading]=useState(false);
  async function submit(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault(); if(rating===0){setMessage('Please select an overall rating.');return;}
    setLoading(true);setMessage('');
    if(!supabase){setDone(true);setLoading(false);return;}
    const {error}=await supabase.from('surveys').insert({registration_id:registrationId||null,rating,experience,preferences:[],comments:comments||null});
    if(error){setMessage(error.message);setLoading(false);return;} setDone(true);setLoading(false);
  }
  if(done)return <main className="success"><MessageSquareHeart size={54}/><h1>Thank you for your feedback.</h1><p>Your response helps the pantry team improve future distributions and plan around community needs.</p></main>;
  return <main className="formPage"><div className="formWrap">
    <span className="eyebrow">COMMUNITY FEEDBACK</span><h1>How was your experience?</h1><p className="lead">A few quick questions. Your feedback helps us serve you better.</p>
    <form onSubmit={submit}>
      <label>How would you describe your experience?<select required value={experience} onChange={e=>setExperience(e.target.value)}>
        <option value="">Select one</option><option value="Excellent">Excellent</option><option value="Needs Improvement">Needs Improvement</option>
      </select></label>
      <label>Overall rating<div className="stars">{[1,2,3,4,5].map(number=><button type="button" key={number} className={number<=rating?'selected':''} onClick={()=>setRating(number)} aria-label={`${number} star rating`}>★</button>)}</div></label>
      <label>What food item meets your needs more?<textarea rows={5} value={comments} onChange={e=>setComments(e.target.value)} placeholder="Tell us what would help your household…"/></label>
      {message&&<div className="error">{message}</div>}
      <button className="primary full" type="submit" disabled={loading}>{loading?'Submitting…':'Submit feedback'} <ChevronRight/></button>
    </form>
  </div></main>;
}

function Admin() {
  const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [session,setSession]=useState<any>(null);
  const [registrations,setRegistrations]=useState<Registration[]>([]); const [surveys,setSurveys]=useState<Survey[]>([]);
  const [query,setQuery]=useState(''); const [loading,setLoading]=useState(false); const [error,setError]=useState('');
  const [view,setView]=useState<'overview'|'registrations'|'feedback'|'analytics'|'schedule'|'archive'>('overview');
  const [dataAction,setDataAction]=useState<'archive'|'reset'|null>(null);
  const [actionMessage,setActionMessage]=useState('');
  const loadVersion=React.useRef(0);
  const {dates,today,setDates}=useSchedule();
  const [editDates,setEditDates]=useState<Record<string,string>>({});

  useEffect(()=>{if(!supabase)return;supabase.auth.getSession().then(({data})=>setSession(data.session));
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,currentSession)=>setSession(currentSession));
    return()=>subscription.unsubscribe();
  },[]);
  useEffect(()=>{if(!session)return;loadDashboard();const timer=setInterval(loadDashboard,30000);return()=>clearInterval(timer);},[session]);

  async function login(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();setLoading(true);setError('');
    if(!supabase){setError('Configure Supabase first.');setLoading(false);return;}
    const {error:loginError}=await supabase.auth.signInWithPassword({email,password});
    if(loginError)setError(loginError.message);setLoading(false);
  }
  async function loadDashboard(){
    if(!supabase)return;const version=++loadVersion.current;setLoading(true);
    async function fetchAll(table:'registrations'|'surveys'){
      const records:any[]=[];let offset=0;
      while(true){const {data,error}=await supabase!.from(table).select('*').order('created_at',{ascending:false}).order('id',{ascending:true}).range(offset,offset+999);
        if(error)return {records:[],error};records.push(...(data||[]));if(!data||data.length<1000)break;offset+=1000;}
      return {records,error:null};
    }
    const [registrationResult,surveyResult]=await Promise.all([fetchAll('registrations'),fetchAll('surveys')]);
    if(version!==loadVersion.current)return;
    if(!registrationResult.error)setRegistrations(registrationResult.records as Registration[]);else setError(registrationResult.error.message);
    if(!surveyResult.error)setSurveys(surveyResult.records as Survey[]);else setError(surveyResult.error.message);
    setLoading(false);
  }

  const active=registrations.filter(item=>!item.archived_at);
  const activeSurveys=surveys.filter(item=>!item.archived_at);
  const archivedRegistrations=registrations.filter(item=>!!item.archived_at);
  const archivedSurveys=surveys.filter(item=>!!item.archived_at);
  const filteredRegistrations=useMemo(()=>{
    const normalizedQuery=query.toLowerCase().trim();
    return registrations.filter(registration=>
      (view==='archive'?!!registration.archived_at:!registration.archived_at) &&
      `${registration.first_name} ${registration.last_name||''}`.toLowerCase().includes(normalizedQuery));
  },[registrations,query,view]);
  const totalFamilyMembers=active.reduce((total,registration)=>total+Number(registration.family_size||0),0);
  const averageRating=activeSurveys.length>0?(activeSurveys.reduce((total,survey)=>total+Number(survey.rating||0),0)/activeSurveys.length).toFixed(1):'—';
  const countBy=(items:string[])=>Object.entries(items.reduce<Record<string,number>>((counts,item)=>{counts[item]=(counts[item]||0)+1;return counts;},{})).sort((a,b)=>b[1]-a[1]);
  async function manageData(action:'archive'|'reset'){
    if(!supabase || dataAction)return;
    const confirmation=action==='archive'
      ? 'Archive all current registrations and feedback? They will be hidden from current lists and totals, and kept in the Archive tab.'
      : 'Permanently delete ALL registrations and feedback, including archived records? This cannot be undone. Your admin account and distribution schedule will stay unchanged.';
    if(!window.confirm(confirmation))return;
    setDataAction(action);setError('');setActionMessage('');
    try {
      const {error:actionError}=await supabase.rpc(action==='archive'?'archive_pantry_now':'reset_pantry_data');
      if(actionError){setError(actionError.message);return;}
      if(action==='reset'){setRegistrations([]);setSurveys([]);}
      setQuery('');setView(action==='archive'?'archive':'overview');
      setActionMessage(action==='archive'?'Current registrations and feedback have been moved to the Archive tab.':'All registrations and feedback have been cleared, including archived records.');
      await loadDashboard();
    } catch { setError('Unable to complete the action. Please refresh and try again.'); }
    finally { setDataAction(null); }
  }
  async function saveDate(item:Distribution){
    if(!supabase)return;const date=editDates[`${item.month}-${item.slot}`]||item.date;
    const {error:saveError}=await supabase.from('distribution_dates').upsert({month:item.month,slot:item.slot,date,time:item.time});
    if(saveError){setError(saveError.message);return;}
    setDates(current=>current.map(row=>row.month===item.month&&row.slot===item.slot?{...row,date}:row));setError('');
    window.dispatchEvent(new Event('pantry-schedule-updated'));
  }

  function exportCSV(){
    const rows=[['First name','Last name','Family Size','Preferred Distribution Date','Registered','Archived'],
      ...(view==='archive'?archivedRegistrations:active).map(registration=>[
        registration.first_name,registration.last_name||'',String(registration.family_size),registration.distribution_date||'',
        new Date(registration.created_at).toLocaleString(),
        registration.archived_at?new Date(registration.archived_at).toLocaleString():'',
      ])];
    const csvContent=rows.map(row=>row.map(value=>`"${String(value).replaceAll('"','""')}"`).join(',')).join('\n');
    const blob=new Blob([csvContent],{type:'text/csv;charset=utf-8;'});const url=URL.createObjectURL(blob);
    const anchor=document.createElement('a');anchor.href=url;anchor.download=view==='archive'?'rccgsc-archived-registrations.csv':'rccgsc-registrations.csv';
    document.body.appendChild(anchor);anchor.click();document.body.removeChild(anchor);URL.revokeObjectURL(url);
  }

  if(!session)return <main className="loginPage"><div className="loginCard">
    <div className="brandBig"><Brand/></div>
    <h1>Admin sign in</h1><p>Authorized pantry coordinators only.</p>
    <form onSubmit={login}>
      <label>Email<input type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label>
      <label>Password<input type="password" required value={password} onChange={e=>setPassword(e.target.value)}/></label>
      {error&&<div className="error">{error}</div>}
      <button className="primary full" disabled={loading} type="submit">{loading?'Signing in…':'Sign in'} <LogIn/></button>
    </form>
  </div></main>;

  return <main className="adminPage">
    <div className="adminTop"><div><span className="eyebrow">PANTRY ADMINISTRATION</span><h1>Dashboard</h1></div>
      <div className="adminActions">
        <button className="secondary" onClick={()=>manageData('archive')} disabled={!!dataAction || loading || (!active.length&&!activeSurveys.length)}><Archive size={16}/>{dataAction==='archive'?'Archiving…':'Archive current data'}</button>
        <button className="secondary danger" onClick={()=>manageData('reset')} disabled={!!dataAction || loading || (!registrations.length&&!surveys.length)}><Trash2 size={16}/>{dataAction==='reset'?'Resetting…':'Reset all data'}</button>
        <button className="secondary" onClick={exportCSV}><Download size={16}/> Export CSV</button>
        <button className="iconBtn" onClick={()=>supabase?.auth.signOut()} aria-label="Sign out"><LogOut/></button></div>
    </div>
    {error&&<div className="error adminError" role="alert">{error}</div>}
    {actionMessage&&<div className="adminSuccess" role="status">{actionMessage}</div>}
    <div className="metrics">
      <button onClick={()=>setView('registrations')}><Users/><span>Total registrations</span><strong>{active.length}</strong></button>
      <button onClick={()=>setView('registrations')}><HomeIcon/><span>Total family size</span><strong>{totalFamilyMembers}</strong></button>
      <button onClick={()=>setView('feedback')}><MessageSquareHeart/><span>Feedback responses</span><strong>{activeSurveys.length}</strong></button>
      <div><ClipboardList/><span>Avg. rating</span><strong>{averageRating}</strong></div>
    </div>
    <div className="adminTabs">{(['overview','registrations','feedback','analytics','schedule','archive'] as const).map(tab=><button key={tab} className={view===tab?'active':''} onClick={()=>setView(tab)}>{tab[0].toUpperCase()+tab.slice(1)}</button>)}</div>
    {view==='overview'&&<div className="insightGrid"><section className="tableCard"><h2>Upcoming distribution</h2>{dates.filter(item=>item.date>=today).slice(0,2).map(item=><p key={item.date}>{labelDate(item.date)} · {item.time}</p>)}</section><section className="tableCard"><h2>Current cycle</h2><p>{active.length} registrations · total family size {totalFamilyMembers}</p><p>{activeSurveys.length} feedback responses</p><button className="secondary" onClick={()=>{setQuery('');setView('archive');}}>View archive ({archivedRegistrations.length} registrations · {archivedSurveys.length} feedback)</button></section></div>}
    {view==='registrations'&&<RegistrationList records={filteredRegistrations} query={query} onQuery={setQuery} loading={loading}/>}
    {view==='feedback'&&<FeedbackList records={activeSurveys}/>}
    {view==='archive'&&<div className="archiveContent">
      <section className="tableCard archiveIntro"><h2>Archive</h2><p>Archived registrations and feedback are kept here, separate from current lists and totals.</p><p>{archivedRegistrations.length} registrations · {archivedSurveys.length} feedback responses</p></section>
      <RegistrationList records={filteredRegistrations} query={query} onQuery={setQuery} loading={loading} archived/>
      <FeedbackList records={archivedSurveys} archived/>
    </div>}
    {view==='analytics'&&<div className="insightGrid">
      <Breakdown title="First name" rows={countBy(active.map(item=>item.first_name))}/>
      <Breakdown title="Last name" rows={countBy(active.map(item=>item.last_name||'Not recorded'))}/>
      <Breakdown title="Family size" rows={countBy(active.map(item=>String(item.family_size)))}/>
      <Breakdown title="Distribution date" rows={countBy(active.map(item=>item.distribution_date||'Not recorded'))}/>
      <Breakdown title="Experience" rows={countBy(activeSurveys.map(item=>item.experience))}/>
      <Breakdown title="Rating" rows={countBy(activeSurveys.map(item=>String(item.rating)))}/>
      <Breakdown title="Requested food items" rows={countBy(activeSurveys.map(item=>item.comments?.trim()||'No answer'))}/>
    </div>}
    {view==='schedule'&&<div className="tableCard"><h2>Distribution dates</h2><p>Default dates are the first and third Saturdays. The second distribution date opens for registration at midnight after the first distribution.</p><div className="dateEditor">{dates.map(item=><div key={`${item.month}-${item.slot}`}><label>{item.month} · {item.slot===1?'First':'Third'} Saturday<input type="date" value={editDates[`${item.month}-${item.slot}`]||item.date} onChange={e=>setEditDates({...editDates,[`${item.month}-${item.slot}`]:e.target.value})}/></label><button className="secondary" onClick={()=>saveDate(item)}>Save date</button></div>)}</div></div>}
  </main>;
}

function RegistrationList({records,query,onQuery,loading,archived=false}:{records:Registration[];query:string;onQuery:(value:string)=>void;loading:boolean;archived?:boolean}){
  return <section className="tableCard"><div className="tableHead"><h2>{archived?'Archived registrants':'Registrants'} ({records.length})</h2><div className="search"><Search size={16}/><input aria-label={archived?'Search archived registrations':'Search registrations'} placeholder="Search first or last name" value={query} onChange={e=>onQuery(e.target.value)}/></div></div>
    <div className="tableScroll"><table><thead><tr><th>First name</th><th>Last name</th><th>Family Size</th><th>Distribution date</th><th>Registered</th>{archived&&<th>Archived</th>}</tr></thead>
      <tbody>{records.map(registration=><tr key={registration.id}><td><b>{registration.first_name}</b></td><td>{registration.last_name||'—'}</td><td>{registration.family_size}</td><td>{registration.distribution_date?labelDate(registration.distribution_date):'Not recorded'}</td><td>{new Date(registration.created_at).toLocaleDateString()}</td>{archived&&<td>{registration.archived_at?new Date(registration.archived_at).toLocaleDateString():'—'}</td>}</tr>)}
        {!records.length&&<tr><td colSpan={archived?6:5} className="empty">{loading?'Loading registrations…':archived?'No archived registrations.':'No registrations found.'}</td></tr>}</tbody>
    </table></div>
  </section>;
}

function FeedbackList({records,archived=false}:{records:Survey[];archived?:boolean}){
  return <section className="tableCard"><h2>{archived?'Archived feedback':'Feedback'} ({records.length})</h2><div className="feedbackList">{records.map(item=><article key={item.id}><div><b>{item.experience}</b><span>{item.rating} / 5 stars · {new Date(item.created_at).toLocaleDateString()}{archived&&item.archived_at?` · Archived ${new Date(item.archived_at).toLocaleDateString()}`:''}</span></div><p>{item.comments||'No food item specified.'}</p></article>)}{!records.length&&<p>{archived?'No archived feedback.':'No feedback yet.'}</p>}</div></section>;
}

function Breakdown({title,rows}:{title:string;rows:[string,number][]}){return <section className="tableCard breakdown"><h2>{title}</h2>{rows.length?rows.map(([name,count])=><div key={name}><span>{name}</span><strong>{count}</strong></div>):<p>No entries yet.</p>}</section>}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
