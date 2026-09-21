import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { supabase } from './supabase';
import {
  CalendarDays, ChevronRight, ClipboardList, Download, HeartHandshake,
  Home as HomeIcon, LogIn, LogOut, Menu, MessageSquareHeart, Search,
  ShieldCheck, Users, Utensils, X,
} from 'lucide-react';
import './styles.css';

type Page = 'home' | 'register' | 'survey' | 'admin';

type Registration = {
  id: string; created_at: string; first_name: string; last_name: string;
  phone: string; email: string | null; family_size: number;
  distribution_date: string | null; status: string;
};

type Survey = {
  id: string; created_at: string; registration_id: string | null;
  experience: string; rating: number; preferences: string[];
  comments: string | null;
};

const schedule = [
  { day: 'Saturday', date: 'Every 2nd Saturday', time: '10:00 AM – 1:00 PM' },
  { day: 'Thursday', date: 'Every 4th Thursday', time: '5:00 PM – 7:00 PM' },
];

const foods = ['Rice','Pasta','Canned goods','Fresh produce','Breakfast items','Baby/children items','Protein/meat'];

function App() {
  const [page, setPage] = useState<Page>('home');
  const [mobile, setMobile] = useState(false);
  const [registeredId, setRegisteredId] = useState('');
  const go = (nextPage: Page) => {
    setPage(nextPage); setMobile(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  return <>
    <header><div className="nav">
      <button className="brand" onClick={() => go('home')}>
        <span className="brandmark">R</span><span><b>RCCGSC</b><small>FOOD PANTRY</small></span>
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

    {page === 'home' && <Home go={go}/>}
    {page === 'register' && <Register onDone={(id) => { setRegisteredId(id); go('survey'); }}/>}
    {page === 'survey' && <SurveyForm registrationId={registeredId}/>}
    {page === 'admin' && <Admin/>}

    <footer>
      <div><b>RCCGSC Food Pantry</b><p>Serving our neighbors with dignity, care and practical support.</p></div>
      <div><b>Distribution</b><p>See the current pantry schedule above.</p></div>
      <div className="copyright">© {new Date().getFullYear()} RCCGSC. All rights reserved.</div>
    </footer>
  </>;
}

function Home({ go }: { go: (page: Page) => void }) {
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
      <div className="schedule">{schedule.map((item,index)=><div className="scheduleCard" key={index}><div className="dateIcon"><CalendarDays/></div><div><b>{item.day}</b><h3>{item.date}</h3><p>{item.time}</p></div></div>)}</div>
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
      <div className="info pale"><Users size={30}/><h2>Managing the pantry?</h2><p>Authorized coordinators can securely view registrations, family counts, feedback and basic reports.</p><button className="textBtn" onClick={() => go('admin')}>Open admin dashboard <ChevronRight/></button></div>
    </section>
  </main>;
}

function Register({ onDone }: { onDone: (id: string) => void }) {
  const [form,setForm]=useState({first_name:'',last_name:'',phone:'',email:'',family_size:'1',distribution_date:''});
  const [loading,setLoading]=useState(false); const [message,setMessage]=useState('');
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setMessage('');
    if (!supabase) { setMessage('Connect Supabase using .env.local before submitting.'); setLoading(false); return; }
    const {data,error}=await supabase.from('registrations').insert({
      first_name:form.first_name,last_name:form.last_name,phone:form.phone,
      email:form.email||null,family_size:Number(form.family_size),
      distribution_date:form.distribution_date||null,
    }).select('id').single();
    if(error){setMessage(error.message);setLoading(false);return;}
    if(data?.id) onDone(data.id); setLoading(false);
  }
  return <main className="formPage"><div className="formWrap">
    <span className="eyebrow">REGISTRATION</span><h1>Register for food distribution</h1>
    <p className="lead">Please provide accurate information so the pantry team can plan for your household.</p>
    <form onSubmit={submit}>
      <div className="grid2">
        <label>First name<input required value={form.first_name} onChange={e=>setForm({...form,first_name:e.target.value})}/></label>
        <label>Last name<input required value={form.last_name} onChange={e=>setForm({...form,last_name:e.target.value})}/></label>
      </div>
      <div className="grid2">
        <label>Phone number<input required type="tel" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></label>
        <label>Email <span>(optional)</span><input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label>
      </div>
      <div className="grid2">
        <label>Family members<input required min="1" max="30" type="number" value={form.family_size} onChange={e=>setForm({...form,family_size:e.target.value})}/></label>
        <label>Preferred distribution date<select required value={form.distribution_date} onChange={e=>setForm({...form,distribution_date:e.target.value})}>
          <option value="">Select a date</option><option value="next">Next available distribution</option><option value="future">A future distribution</option>
        </select></label>
      </div>
      <div className="notice"><ShieldCheck size={18}/><span>Your information is used by the pantry team for distribution planning and reporting.</span></div>
      {message&&<div className="error">{message}</div>}
      <button className="primary full" disabled={loading} type="submit">{loading?'Submitting…':'Complete registration'} <ChevronRight/></button>
    </form>
  </div></main>;
}

function SurveyForm({ registrationId }: { registrationId: string }) {
  const [rating,setRating]=useState(0); const [experience,setExperience]=useState('');
  const [preferences,setPreferences]=useState<string[]>([]); const [comments,setComments]=useState('');
  const [done,setDone]=useState(false); const [message,setMessage]=useState(''); const [loading,setLoading]=useState(false);
  function togglePreference(food:string){setPreferences(current=>current.includes(food)?current.filter(item=>item!==food):[...current,food]);}
  async function submit(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault(); if(rating===0){setMessage('Please select an overall rating.');return;}
    setLoading(true);setMessage('');
    if(!supabase){setDone(true);setLoading(false);return;}
    const {error}=await supabase.from('surveys').insert({registration_id:registrationId||null,rating,experience,preferences,comments:comments||null});
    if(error){setMessage(error.message);setLoading(false);return;} setDone(true);setLoading(false);
  }
  if(done)return <main className="success"><MessageSquareHeart size={54}/><h1>Thank you for your feedback.</h1><p>Your response helps the pantry team improve future distributions and plan around community needs.</p></main>;
  return <main className="formPage"><div className="formWrap">
    <span className="eyebrow">COMMUNITY FEEDBACK</span><h1>How was your experience?</h1><p className="lead">A few quick questions. Your feedback helps us serve you better.</p>
    <form onSubmit={submit}>
      <label>How would you describe your experience?<select required value={experience} onChange={e=>setExperience(e.target.value)}>
        <option value="">Select one</option><option value="Very good">Very good</option><option value="Good">Good</option><option value="Okay">Okay</option><option value="Needs improvement">Needs improvement</option>
      </select></label>
      <label>Overall rating<div className="stars">{[1,2,3,4,5].map(number=><button type="button" key={number} className={number<=rating?'selected':''} onClick={()=>setRating(number)} aria-label={`${number} star rating`}>★</button>)}</div></label>
      <label>What food items would be most helpful?<div className="checks">{foods.map(food=><label className="check" key={food}><input type="checkbox" checked={preferences.includes(food)} onChange={()=>togglePreference(food)}/>{food}</label>)}</div></label>
      <label>Anything else you'd like us to know?<textarea rows={5} value={comments} onChange={e=>setComments(e.target.value)} placeholder="Optional feedback…"/></label>
      {message&&<div className="error">{message}</div>}
      <button className="primary full" type="submit" disabled={loading}>{loading?'Submitting…':'Submit feedback'} <ChevronRight/></button>
    </form>
  </div></main>;
}

function Admin() {
  const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [session,setSession]=useState<any>(null);
  const [registrations,setRegistrations]=useState<Registration[]>([]); const [surveys,setSurveys]=useState<Survey[]>([]);
  const [query,setQuery]=useState(''); const [loading,setLoading]=useState(false); const [error,setError]=useState('');

  useEffect(()=>{if(!supabase)return;supabase.auth.getSession().then(({data})=>setSession(data.session));
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,currentSession)=>setSession(currentSession));
    return()=>subscription.unsubscribe();
  },[]);
  useEffect(()=>{if(session)loadDashboard();},[session]);

  async function login(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();setLoading(true);setError('');
    if(!supabase){setError('Configure Supabase first.');setLoading(false);return;}
    const {error:loginError}=await supabase.auth.signInWithPassword({email,password});
    if(loginError)setError(loginError.message);setLoading(false);
  }
  async function loadDashboard(){
    if(!supabase)return;setLoading(true);
    const [registrationsResponse,surveysResponse]=await Promise.all([
      supabase.from('registrations').select('*').order('created_at',{ascending:false}),
      supabase.from('surveys').select('*').order('created_at',{ascending:false}),
    ]);
    if(!registrationsResponse.error)setRegistrations(registrationsResponse.data||[]);else setError(registrationsResponse.error.message);
    if(!surveysResponse.error)setSurveys(surveysResponse.data||[]);else setError(surveysResponse.error.message);
    setLoading(false);
  }

  const filteredRegistrations=useMemo(()=>{
    const normalizedQuery=query.toLowerCase().trim(); if(!normalizedQuery)return registrations;
    return registrations.filter(registration=>`${registration.first_name} ${registration.last_name} ${registration.phone} ${registration.email||''}`.toLowerCase().includes(normalizedQuery));
  },[registrations,query]);

  const totalFamilyMembers=registrations.reduce((total,registration)=>total+Number(registration.family_size||0),0);
  const averageRating=surveys.length>0?(surveys.reduce((total,survey)=>total+Number(survey.rating||0),0)/surveys.length).toFixed(1):'—';

  function exportCSV(){
    const rows=[['Name','Phone','Email','Family Size','Distribution','Status','Registered'],
      ...registrations.map(registration=>[
        `${registration.first_name} ${registration.last_name}`,registration.phone,registration.email||'',
        String(registration.family_size),registration.distribution_date||'',registration.status||'',
        new Date(registration.created_at).toLocaleString(),
      ])];
    const csvContent=rows.map(row=>row.map(value=>`"${String(value).replaceAll('"','""')}"`).join(',')).join('\n');
    const blob=new Blob([csvContent],{type:'text/csv;charset=utf-8;'});const url=URL.createObjectURL(blob);
    const anchor=document.createElement('a');anchor.href=url;anchor.download='rccgsc-registrations.csv';
    document.body.appendChild(anchor);anchor.click();document.body.removeChild(anchor);URL.revokeObjectURL(url);
  }

  if(!session)return <main className="loginPage"><div className="loginCard">
    <div className="brandBig"><span className="brandmark">R</span><div><b>RCCGSC</b><small>FOOD PANTRY ADMIN</small></div></div>
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
      <div><Users/><span>Total registrations</span><strong>{registrations.length}</strong></div>
      <div><HomeIcon/><span>Family members</span><strong>{totalFamilyMembers}</strong></div>
      <div><MessageSquareHeart/><span>Feedback responses</span><strong>{surveys.length}</strong></div>
      <div><ClipboardList/><span>Avg. rating</span><strong>{averageRating}</strong></div>
    </div>
    <div className="tableCard"><div className="tableHead"><h2>Registrations</h2><div className="search"><Search size={16}/><input placeholder="Search name, phone or email" value={query} onChange={e=>setQuery(e.target.value)}/></div></div>
      <div className="tableScroll"><table><thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>Family</th><th>Date</th><th>Registered</th></tr></thead>
        <tbody>{filteredRegistrations.map(registration=><tr key={registration.id}><td><b>{registration.first_name} {registration.last_name}</b></td><td>{registration.phone}</td><td>{registration.email||'—'}</td><td>{registration.family_size}</td><td>{registration.distribution_date||'—'}</td><td>{new Date(registration.created_at).toLocaleDateString()}</td></tr>)}
          {!filteredRegistrations.length&&<tr><td colSpan={6} className="empty">{loading?'Loading registrations…':'No registrations found.'}</td></tr>}</tbody>
      </table></div>
    </div>
  </main>;
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
