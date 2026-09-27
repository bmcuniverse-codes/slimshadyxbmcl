import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { supabase } from './supabase';
import {
  CalendarDays, ChevronRight, ClipboardList, Download, HeartHandshake,
  Home as HomeIcon, LogIn, LogOut, Menu, MessageSquareHeart, Search,
  ShieldCheck, Users, Utensils, X,
} from 'lucide-react';
import './styles.css';

type Page = 'home' | 'register' | 'survey' | 'admin' | 'success';

type Registration = {
  id: string; created_at: string; first_name: string; last_name?: string; food_options: string[]; archived_at: string | null;
  phone: string; email: string | null; family_size: number;
  distribution_date: string | null; status: string;
};

type Survey = {
  id: string; created_at: string; registration_id: string | null;
  experience: string; rating: number; preferences: string[];
  comments: string | null; archived_at: string | null;
};

type Distribution = { month: string; slot: number; date: string; time: string };
const foods = ['Fresh Produce','Frozen Foods','Drinks & Household Items','Food & Beverages','Dairy & Eggs'];
function todayLagos() { const parts=new Intl.DateTimeFormat('en-US',{timeZone:'Africa/Lagos',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()); const part=(name:string)=>parts.find(item=>item.type===name)!.value; return `${part('year')}-${part('month')}-${part('day')}`; }
function defaults(month:string):Distribution[] {
  const [year,n]=month.split('-').map(Number);
  const first=1+(6-new Date(Date.UTC(year,n-1,1)).getUTCDay()+7)%7;
  return [first,first+14].map((day,i)=>({month,slot:i+1,date:`${month}-${String(day).padStart(2,'0')}`,time:'10:00 AM – 1:00 PM'}));
}
function labelDate(date:string) { return new Date(`${date}T12:00:00Z`).toLocaleDateString('en-NG',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}); }
function useSchedule() {
  const [today,setToday]=useState(todayLagos()); const [dates,setDates]=useState<Distribution[]>([]);
  useEffect(()=>{const timer=setInterval(()=>setToday(todayLagos()),60000);return()=>clearInterval(timer);},[]);
  useEffect(()=>{let active=true;const month=today.slice(0,7);
    const next=new Date(`${month}-01T12:00:00Z`);next.setUTCMonth(next.getUTCMonth()+1);
    const months=[month,next.toISOString().slice(0,7)];
    (async()=>{let items=months.flatMap(defaults);
      if(supabase){const {data}=await supabase.from('distribution_dates').select('month,slot,date,time').in('month',months);
        if(data)items=items.map(item=>data.find(row=>row.month===item.month&&row.slot===item.slot)||item);}
      if(active)setDates(items);
    })();return()=>{active=false};
  },[today.slice(0,7)]);
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
      <div className="sectionHead"><span className="eyebrow">PANTRY SCHEDULE</span><h2>Plan your visit</h2><p>Choose an upcoming distribution date when registration is open.</p></div>
      <div className="schedule">{dates.filter(item=>item.date>=today).slice(0,2).map(item=><div className="scheduleCard" key={item.date}><div className="dateIcon"><CalendarDays/></div><div><b>{item.slot===1?'First':'Third'} Saturday</b><h3>{labelDate(item.date)}</h3><p>{item.time}</p></div></div>)}</div>
    </section>

    <section className="blueBand">
      <div><span className="eyebrow light">HOW IT WORKS</span><h2>Simple from registration to distribution.</h2></div>
      <div className="steps">{[
        ['01','Register','Tell us your name, contact details and family size.'],
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

function Register({ onDone, dates, today }: { onDone: (id: string) => void; dates: Distribution[]; today:string }) {
  const [form,setForm]=useState({first_name:'',phone:'',email:'',family_size:'1',distribution_date:'',food_options:[] as string[]});
  const [loading,setLoading]=useState(false); const [message,setMessage]=useState('');
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setMessage('');
    if (!supabase) { setMessage('Connect Supabase using .env.local before submitting.'); setLoading(false); return; }
    const id=crypto.randomUUID();
    const {error}=await supabase.from('registrations').insert({
      id,
      first_name:form.first_name,phone:form.phone,food_options:form.food_options,
      email:form.email||null,family_size:Number(form.family_size),
      distribution_date:form.distribution_date,
    });
    if(error){setMessage(error.message);setLoading(false);return;}
    onDone(id); setLoading(false);
  }
  return <main className="formPage"><div className="formWrap">
    <span className="eyebrow">REGISTRATION</span><h1>Register for food distribution</h1>
    <p className="lead">Please provide accurate information so the pantry team can plan for your household.</p>
    <form onSubmit={submit}>
      <label>Name<input required value={form.first_name} onChange={e=>setForm({...form,first_name:e.target.value})}/></label>
      <div className="grid2">
        <label>Phone number<input required type="tel" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></label>
        <label>Email <span>(optional)</span><input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label>
      </div>
      <div className="grid2">
        <label>Family Size<input required min="1" max="30" type="number" value={form.family_size} onChange={e=>setForm({...form,family_size:e.target.value})}/></label>
        <label>Preferred distribution date<select required value={form.distribution_date} onChange={e=>setForm({...form,distribution_date:e.target.value})}>
          <option value="">Select a date</option>{dates.filter(item=>item.date>=today && (item.slot===1 || today>dates.find(first=>first.month===item.month&&first.slot===1)!.date)).map(item=><option key={item.date} value={item.date}>{labelDate(item.date)} · {item.time}</option>)}
        </select></label>
      </div>
      <fieldset className="foodField"><legend>Food options</legend><div className="checks">{foods.map(food=><label className="check" key={food}><input type="checkbox" checked={form.food_options.includes(food)} onChange={()=>setForm({...form,food_options:form.food_options.includes(food)?form.food_options.filter(x=>x!==food):[...form.food_options,food]})}/>{food}</label>)}</div></fieldset>
      <div className="notice"><ShieldCheck size={18}/><span>Your information is used by the pantry team for distribution and planning.</span></div>
      {message&&<div className="error">{message}</div>}
      <button className="primary full" disabled={loading} type="submit">{loading?'Submitting…':'Complete registration'} <ChevronRight/></button>
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
  const [view,setView]=useState<'overview'|'registrations'|'feedback'|'analytics'|'schedule'>('overview');
  const [showArchive,setShowArchive]=useState(false);
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
    if(!supabase)return;setLoading(true);
    async function fetchAll(table:'registrations'|'surveys'){
      const records:any[]=[];let offset=0;
      while(true){const {data,error}=await supabase!.from(table).select('*').order('created_at',{ascending:false}).range(offset,offset+999);
        if(error)return {records:[],error};records.push(...(data||[]));if(!data||data.length<1000)break;offset+=1000;}
      return {records,error:null};
    }
    const [registrationResult,surveyResult]=await Promise.all([fetchAll('registrations'),fetchAll('surveys')]);
    if(!registrationResult.error)setRegistrations(registrationResult.records as Registration[]);else setError(registrationResult.error.message);
    if(!surveyResult.error)setSurveys(surveyResult.records as Survey[]);else setError(surveyResult.error.message);
    setLoading(false);
  }

  const filteredRegistrations=useMemo(()=>{
    const normalizedQuery=query.toLowerCase().trim(); if(!normalizedQuery)return registrations;
    return registrations.filter(registration=>(showArchive || !registration.archived_at) && `${registration.first_name} ${registration.phone} ${registration.email||''}`.toLowerCase().includes(normalizedQuery));
  },[registrations,query,showArchive]);

  const active=registrations.filter(item=>!item.archived_at);
  const activeSurveys=surveys.filter(item=>!item.archived_at);
  const visibleSurveys=showArchive?surveys:activeSurveys;
  const totalFamilyMembers=active.reduce((total,registration)=>total+Number(registration.family_size||0),0);
  const averageRating=activeSurveys.length>0?(activeSurveys.reduce((total,survey)=>total+Number(survey.rating||0),0)/activeSurveys.length).toFixed(1):'—';
  const countBy=(items:string[])=>Object.entries(items.reduce<Record<string,number>>((counts,item)=>{counts[item]=(counts[item]||0)+1;return counts;},{})).sort((a,b)=>b[1]-a[1]);
  async function archiveNow(){
    if(!supabase || !window.confirm('Archive all active registrations and feedback? The records will remain available in the archive.'))return;
    const {error:archiveError}=await supabase.rpc('archive_pantry_now');
    if(archiveError)setError(archiveError.message);else await loadDashboard();
  }
  async function saveDate(item:Distribution){
    if(!supabase)return;const date=editDates[`${item.month}-${item.slot}`]||item.date;
    const {error:saveError}=await supabase.from('distribution_dates').upsert({month:item.month,slot:item.slot,date,time:item.time});
    if(saveError){setError(saveError.message);return;}
    setDates(current=>current.map(row=>row.month===item.month&&row.slot===item.slot?{...row,date}:row));setError('');
  }

  function exportCSV(){
    const rows=[['Name','Phone','Email','Family Size','Food Options','Distribution','Archive State','Registered'],
      ...(showArchive?registrations:active).map(registration=>[
        registration.first_name,registration.phone,registration.email||'',
        String(registration.family_size),(registration.food_options||[]).join('; '),registration.distribution_date||'',registration.archived_at?'Archived':'Active',
        new Date(registration.created_at).toLocaleString(),
      ])];
    const csvContent=rows.map(row=>row.map(value=>`"${String(value).replaceAll('"','""')}"`).join(',')).join('\n');
    const blob=new Blob([csvContent],{type:'text/csv;charset=utf-8;'});const url=URL.createObjectURL(blob);
    const anchor=document.createElement('a');anchor.href=url;anchor.download='rccgsc-registrations.csv';
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
      <div className="adminActions"><button className="secondary" onClick={exportCSV}><Download size={16}/> Export CSV</button>
        <button className="iconBtn" onClick={()=>supabase?.auth.signOut()} aria-label="Sign out"><LogOut/></button></div>
    </div>
    {error&&<div className="error adminError">{error}</div>}
    <div className="metrics">
      <button onClick={()=>setView('registrations')}><Users/><span>Total registrations</span><strong>{active.length}</strong></button>
      <button onClick={()=>setView('registrations')}><HomeIcon/><span>Total family size</span><strong>{totalFamilyMembers}</strong></button>
      <button onClick={()=>setView('feedback')}><MessageSquareHeart/><span>Feedback responses</span><strong>{activeSurveys.length}</strong></button>
      <div><ClipboardList/><span>Avg. rating</span><strong>{averageRating}</strong></div>
    </div>
    <div className="adminTabs">{(['overview','registrations','feedback','analytics','schedule'] as const).map(tab=><button key={tab} className={view===tab?'active':''} onClick={()=>setView(tab)}>{tab[0].toUpperCase()+tab.slice(1)}</button>)}</div>
    {(view==='registrations'||view==='feedback'||view==='analytics')&&<label className="archiveToggle"><input type="checkbox" checked={showArchive} onChange={e=>setShowArchive(e.target.checked)}/> Include archived records</label>}
    {view==='overview'&&<div className="insightGrid"><section className="tableCard"><h2>Upcoming distribution</h2>{dates.filter(item=>item.date>=today).slice(0,2).map(item=><p key={item.date}>{labelDate(item.date)} · {item.time}</p>)}</section><section className="tableCard"><h2>Current cycle</h2><p>{active.length} registrations · total family size {totalFamilyMembers}</p><p>{activeSurveys.length} feedback responses</p><button className="secondary" onClick={archiveNow}>Archive current data</button></section></div>}
    {view==='registrations'&&<div className="tableCard"><div className="tableHead"><h2>Registrants ({filteredRegistrations.length})</h2><div className="search"><Search size={16}/><input placeholder="Search name, phone or email" value={query} onChange={e=>setQuery(e.target.value)}/></div></div>
      <div className="tableScroll"><table><thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>Family Size</th><th>Food options</th><th>Distribution</th><th>Registered</th><th>State</th></tr></thead>
        <tbody>{filteredRegistrations.map(registration=><tr key={registration.id}><td><b>{registration.first_name}</b></td><td>{registration.phone}</td><td>{registration.email||'—'}</td><td>{registration.family_size}</td><td>{registration.food_options?.join(', ')||'—'}</td><td>{registration.distribution_date||'—'}</td><td>{new Date(registration.created_at).toLocaleDateString()}</td><td>{registration.archived_at?'Archived':'Active'}</td></tr>)}
          {!filteredRegistrations.length&&<tr><td colSpan={8} className="empty">{loading?'Loading registrations…':'No registrations found.'}</td></tr>}</tbody>
      </table></div></div>}
    {view==='feedback'&&<div className="tableCard"><h2>Feedback ({visibleSurveys.length})</h2><div className="feedbackList">{visibleSurveys.map(item=><article key={item.id}><div><b>{item.experience}</b><span>{item.rating} / 5 stars · {new Date(item.created_at).toLocaleDateString()} {item.archived_at?'· Archived':''}</span></div><p>{item.comments||'No food item specified.'}</p></article>)}{!visibleSurveys.length&&<p>No feedback yet.</p>}</div></div>}
    {view==='analytics'&&<div className="insightGrid">
      <Breakdown title="Distribution date" rows={countBy((showArchive?registrations:active).map(item=>item.distribution_date||'Unspecified'))}/>
      <Breakdown title="Food options" rows={countBy((showArchive?registrations:active).flatMap(item=>item.food_options||[]))}/>
      <Breakdown title="Family size" rows={countBy((showArchive?registrations:active).map(item=>String(item.family_size)))}/>
      <Breakdown title="Experience" rows={countBy(visibleSurveys.map(item=>item.experience))}/>
      <Breakdown title="Rating" rows={countBy(visibleSurveys.map(item=>String(item.rating)))}/>
      <Breakdown title="First vs third Saturday" rows={countBy((showArchive?registrations:active).map(item=>{const month=item.distribution_date?.slice(0,7)||'';return item.distribution_date===dates.find(date=>date.month===month&&date.slot===1)?.date?'First Saturday':'Third Saturday';}))}/>
      <Breakdown title="Name" rows={countBy((showArchive?registrations:active).map(item=>item.first_name))}/>
      <Breakdown title="Contact provided" rows={countBy((showArchive?registrations:active).map(item=>item.email?'Email and phone':'Phone only'))}/>
      <Breakdown title="Requested food items" rows={countBy(visibleSurveys.map(item=>item.comments?.trim()||'No answer'))}/>
    </div>}
    {view==='schedule'&&<div className="tableCard"><h2>Distribution dates</h2><p>Default dates are the first and third Saturdays. The third date opens at midnight on the day after the first distribution.</p><div className="dateEditor">{dates.map(item=><div key={`${item.month}-${item.slot}`}><label>{item.month} · {item.slot===1?'First':'Third'} Saturday<input type="date" value={editDates[`${item.month}-${item.slot}`]||item.date} onChange={e=>setEditDates({...editDates,[`${item.month}-${item.slot}`]:e.target.value})}/></label><button className="secondary" onClick={()=>saveDate(item)}>Save date</button></div>)}</div></div>}
  </main>;
}

function Breakdown({title,rows}:{title:string;rows:[string,number][]}){return <section className="tableCard breakdown"><h2>{title}</h2>{rows.length?rows.map(([name,count])=><div key={name}><span>{name}</span><strong>{count}</strong></div>):<p>No entries yet.</p>}</section>}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
