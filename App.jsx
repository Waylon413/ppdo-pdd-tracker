import { useState, useEffect, useRef, useCallback } from "react";
import { database } from './firebase';
import { ref, set, get, onValue, off } from 'firebase/database';

const APP="PPDO-PDD";
const DEFAULT_PINS={supervisor:"0000",Peter:"1234",Alyssa:"1234",Althea:"1234",Jonald:"1234",Kiking:"1234",Janna:"1234",Benjo:"1234",Sendo:"1234",Mzoy:"1234",Rinku:"1234",Wamar:"1234",Jed:"1234",Henry:"1234",Pam:"1234"};
const INIT_STAFF=[
  {name:"Peter", role:"Activity Processing",         group:"activity"},
  {name:"Alyssa",role:"Activity Processing / Admin", group:"activity"},
  {name:"Althea",role:"Admin Support",               group:"admin"},
  {name:"Jonald",role:"Project Dev. Officer",        group:"pdo"},
  {name:"Kiking",role:"Project Dev. Officer",        group:"pdo"},
  {name:"Janna", role:"Project Dev. Officer",        group:"pdo"},
  {name:"Benjo", role:"Project Dev. Officer",        group:"pdo"},
  {name:"Sendo", role:"GIS / Design",                group:"gis"},
  {name:"Mzoy",  role:"Project Engineer",            group:"engineer"},
  {name:"Rinku", role:"Project Engineer",            group:"engineer"},
  {name:"Wamar", role:"Project Engineer",            group:"engineer"},
  {name:"Jed",   role:"Project Engineer",            group:"engineer"},
  {name:"Henry", role:"Project Engineer",            group:"engineer"},
  {name:"Pam",   role:"Project Engineer",            group:"engineer"},
];
const GM={activity:{label:"Activity Processing",color:"#1a6eb5"},admin:{label:"Admin Support",color:"#2d7d46"},pdo:{label:"Project Dev. Officer",color:"#0e5c8a"},gis:{label:"GIS / Design",color:"#3a7d44"},engineer:{label:"Project Engineer",color:"#155a8a"}};
const TASK_TYPES={
  activity:["Activity Processing","Disbursement","Meeting"],
  activity_alyssa:["Activity Processing","Disbursement","Letter/Memo","Other Document","Other Tasks","Meeting"],
  admin:["Letter/Memo","Other Document","Other Tasks","Meeting"],
  pdo:["Document","Activity","Documentary Requirements Processing","Meeting"],
  gis:["GIS/Design Task","Meeting"],
  engineer:["Engineering Task","Meeting"],
  supervisor:["Document","Activity","Meeting"],
};
const STAGES={
  "Activity Processing":["For PR","BAC","For Quotation","Budget","Accounting","PGO","Approved"],
  "Disbursement":["Process Disbursement","BAC","Accounting","Approved"],
  "Letter/Memo":["For Drafting","For Review","For Signature","Released"],
  "Other Document":["In Progress","Completed"],
  "Document":["For Drafting","For Review","For Signature","Released/Filed"],
  "Activity":["For Coordination","Process Training Design","Sent Communication","Conducted"],
  "PAR":["For Drafting","For Review","For Signature","Released/Filed"],
  "Engineering Task":["Survey","Designing","For Review","For Approval","Submitted"],
  "GIS/Design Task":["Data Gathering","Drafting","For Review","Finalized"],
  "Documentary Requirements Processing":["Initiated","Processing","Pending Requirements","Filed/Released"],
  "Meeting":["Scheduled","Ongoing","Completed","Cancelled"],
};
const DOC_TECH=["Project Proposal","Assessment Report","Concept Note","Feasibility Study","Terms of Reference","Work Plan","MOA/MOU","Resolution","Ordinance","Other Technical Document"];
const STATUSES=["To Do","Scheduled","In Progress","Done","Cancelled"];
const PRIORITIES=["High","Medium","Low"];
const PC={High:"#c0392b",Medium:"#d68910",Low:"#1e8449"};
const PB={High:"#fdf2f2",Medium:"#fef9ec",Low:"#eafaf1"};
const SC={"To Do":"#2471a3","Scheduled":"#7d3c98","In Progress":"#d68910","Done":"#1e8449","Cancelled":"#7f8c8d"};
const SB={"To Do":"#eaf4fb","Scheduled":"#f5eef8","In Progress":"#fef9ec","Done":"#eafaf1","Cancelled":"#f2f3f4"};
const GA={activity:"#1a6eb5",admin:"#2d7d46",pdo:"#0e5c8a",gis:"#3a7d44",engineer:"#155a8a"};

const ini=n=>(n||"?").split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2);
const fmt=d=>d?new Date(d).toLocaleDateString("en-PH",{month:"short",day:"numeric",year:"numeric"}):"—";
const daysLeft=d=>{if(!d)return null;return Math.ceil((new Date(d)-new Date())/86400000);};
const toNum=n=>Number(n)||0;
const uid=()=>Date.now()+"-"+Math.random().toString(36).slice(2,7);

const EMPTY_DB={tasks:{},supTasks:{},requests:{},goals:{},log:{},pins:{...DEFAULT_PINS},staff:[...INIT_STAFF],ela:{acronym:"AKSYON",targets:[]}};

// Firebase helpers
const dbGet=async(key)=>{
  try{
    const snapshot = await get(ref(database, key));
    return snapshot.exists() ? snapshot.val() : null;
  }catch(e){
    console.error("Firebase get error:", e);
    return null;
  }
};

const dbSet=async(key,val)=>{
  try{
    await set(ref(database, key), val);
  }catch(e){
    console.error("Firebase set error:", e);
  }
};

export default function App(){
  const [ready,setReady]=useState(false);
  const [db,setDB]=useState(EMPTY_DB);
  const [sess,setSess]=useState(null);
  const [page,setPage]=useState("dashboard");
  const [activeStaff,setAS]=useState(null);
  const [modal,setModal]=useState(null);
  const [editItem,setEI]=useState(null);
  const [side,setSide]=useState(false);
  const [toast,setToast]=useState(null);
  const [notifOpen,setNO]=useState(false);
  const listenersRef = useRef({});
  const toast$=m=>{setToast(m);setTimeout(()=>setToast(null),2800);};
  const isSup=sess==="supervisor";

  // Load all data from Firebase
  const loadAll=useCallback(async()=>{
    const keys=["tasks","supTasks","requests","goals","log","pins","staff","ela"];
    const result={...EMPTY_DB};
    for(const k of keys){
      const val=await dbGet("ppdopdd/"+k);
      if(val!==null)result[k]=val;
    }
    setDB(result);
    return result;
  },[]);

  // Set up real-time listeners
  useEffect(()=>{
    if(!ready || !sess) return;

    const keys=["tasks","supTasks","requests","goals","log","pins","staff","ela"];
    
    keys.forEach(key => {
      const dbRef = ref(database, "ppdopdd/"+key);
      const unsubscribe = onValue(dbRef, (snapshot) => {
        if(snapshot.exists()){
          setDB(prev => ({...prev, [key]: snapshot.val()}));
        }
      });
      listenersRef.current[key] = unsubscribe;
    });

    return () => {
      Object.values(listenersRef.current).forEach(unsubscribe => {
        if(typeof unsubscribe === 'function') unsubscribe();
      });
      listenersRef.current = {};
    };
  },[ready, sess]);

  // Init
  useEffect(()=>{
    loadAll().then(d=>{
      // Write defaults if first time
      if(!d.pins||Object.keys(d.pins).length===0) dbSet("ppdopdd/pins",DEFAULT_PINS);
      if(!d.staff||d.staff.length===0) dbSet("ppdopdd/staff",INIT_STAFF);
      if(!d.ela||!d.ela.acronym) dbSet("ppdopdd/ela",{acronym:"AKSYON",targets:[]});
      setReady(true);
    });
  },[]);

  // DB mutate helper
  const mutate=async(key,fn)=>{
    const current=db[key];
    const updated=fn(current);
    const newDB={...db,[key]:updated};
    setDB(newDB);
    await dbSet("ppdopdd/"+key,updated);
    return updated;
  };

  const addLog=async(who,action,title)=>{
    const id=uid();
    const entry={id,who,action,title,at:new Date().toISOString()};
    const current=db.log||{};
    const updated={...current,[id]:entry};
    // Keep only last 200
    const entries=Object.entries(updated).sort((a,b)=>b[1].at.localeCompare(a[1].at)).slice(0,200);
    const trimmed=Object.fromEntries(entries);
    setDB(d=>({...d,log:trimmed}));
    await dbSet("ppdopdd/log",trimmed);
  };

  const addTask=async t=>{
    const id=uid();
    const task={...t,id,createdAt:new Date().toISOString(),comments:[]};
    await mutate("tasks",cur=>({...cur,[id]:task}));
    addLog(t.staff||sess,"Added",t.title);
  };
  const updTask=async t=>{
    await mutate("tasks",cur=>({...cur,[t.id]:t}));
    addLog(sess,"Updated",t.title);
  };
  const delTask=async id=>{
    const t=(db.tasks||{})[id];
    await mutate("tasks",cur=>{const n={...cur};delete n[id];return n;});
    addLog(sess,"Deleted",t?t.title:"");
  };
  const addComment=async(id,text)=>{
    const t=(db.tasks||{})[id]; if(!t) return;
    const comments=[...(t.comments||[]),{by:sess,text,at:new Date().toISOString()}];
    await mutate("tasks",cur=>({...cur,[id]:{...t,comments}}));
    addLog(sess,"Commented on",t.title);
  };
  const addSupTask=async t=>{const id=uid();await mutate("supTasks",cur=>({...cur,[id]:{...t,id,createdAt:new Date().toISOString(),comments:[]}}));addLog("Supervisor","Added",t.title);};
  const updSupTask=async t=>{await mutate("supTasks",cur=>({...cur,[t.id]:t}));};
  const delSupTask=async id=>{await mutate("supTasks",cur=>{const n={...cur};delete n[id];return n;});};
  const addReq=async r=>{const id=uid();await mutate("requests",cur=>({...cur,[id]:{...r,id,createdAt:new Date().toISOString()}}));};
  const approveReq=async id=>{
    const r=(db.requests||{})[id]; if(!r) return;
    const tid=uid();
    await mutate("tasks",cur=>({...cur,[tid]:{...r.task,id:tid,createdAt:new Date().toISOString(),comments:[],forwardedBy:r.from}}));
    await mutate("requests",cur=>{const n={...cur};delete n[id];return n;});
    addLog("Supervisor","Approved",r.task.title);
  };
  const rejectReq=async id=>{await mutate("requests",cur=>{const n={...cur};delete n[id];return n;});};
  const saveELA=async e=>{setDB(d=>({...d,ela:e}));await dbSet("ppdopdd/ela",e);};
  const savePins=async p=>{setDB(d=>({...d,pins:p}));await dbSet("ppdopdd/pins",p);};
  const saveStaff=async s=>{setDB(d=>({...d,staff:s}));await dbSet("ppdopdd/staff",s);};
  const addGoal=async g=>{const id=uid();await mutate("goals",cur=>({...cur,[id]:{...g,id,createdAt:new Date().toISOString()}}));};
  const updGoal=async g=>{await mutate("goals",cur=>({...cur,[g.id]:g}));};
  const delGoal=async id=>{await mutate("goals",cur=>{const n={...cur};delete n[id];return n;});};

  // Derived arrays
  const tasks=Object.values(db.tasks||{}).sort((a,b)=>(b.createdAt||"").localeCompare(a.createdAt||""));
  const supTasks=Object.values(db.supTasks||{}).sort((a,b)=>(b.createdAt||"").localeCompare(a.createdAt||""));
  const requests=Object.values(db.requests||{}).sort((a,b)=>(b.createdAt||"").localeCompare(a.createdAt||""));
  const goals=Object.values(db.goals||{}).sort((a,b)=>(b.createdAt||"").localeCompare(a.createdAt||""));
  const log=Object.values(db.log||{}).sort((a,b)=>b.at.localeCompare(a.at));
  const staff=db.staff||INIT_STAFF;
  const ela=db.ela||{acronym:"AKSYON",targets:[]};
  const pins=db.pins||DEFAULT_PINS;

  const getTaskTypes=name=>{
    if(!name)return[];
    if(name==="Alyssa")return TASK_TYPES.activity_alyssa;
    const sf=staff.find(x=>x.name===name);
    return sf?TASK_TYPES[sf.group]||[]:[];
  };

  const T={bg:"#f0f4f8",card:"#fff",border:"#dce6ef",text:"#1a2533",muted:"#6b8099",dark:"#0a2540",blue:"#1a6eb5",green:"#1e8449",red:"#c0392b",amber:"#d68910"};
  const inp={width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #dce6ef",fontSize:13,fontFamily:"inherit",background:"#fff",color:"#1a2533",boxSizing:"border-box"};
  const mkBtn=(bg,cl,br)=>({background:bg||"#fff",color:cl||"#1a2533",border:"1px solid "+(br||"#dce6ef"),borderRadius:8,padding:"7px 14px",fontSize:13,cursor:"pointer",fontFamily:"inherit"});
  const mkBdg=(bg,cl)=>({display:"inline-block",padding:"2px 8px",borderRadius:20,fontSize:11,fontWeight:500,background:bg,color:cl});

  const PBar=({pct,h})=>{const hp=h||6,w=Math.min(toNum(pct),100),bg=pct>=80?T.green:pct>=40?T.amber:T.blue;return(<div style={{background:"#dce6ef",borderRadius:99,height:hp,overflow:"hidden"}}><div style={{width:w+"%",height:"100%",borderRadius:99,background:bg,transition:"width .3s"}}/></div>);};
  const Ring=({pct,sz})=>{const size=sz||50,r=19,c=2*Math.PI*r,off=c-(toNum(pct)/100)*c,cl=pct>=80?T.green:pct>=40?T.amber:T.blue;return(<svg width={size} height={size} viewBox="0 0 50 50"><circle cx="25" cy="25" r={r} fill="none" stroke="#dce6ef" strokeWidth="4"/><circle cx="25" cy="25" r={r} fill="none" stroke={cl} strokeWidth="4" strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round" transform="rotate(-90 25 25)"/><text x="25" y="29" textAnchor="middle" fontSize="9" fontWeight="600" fill={cl}>{pct}%</text></svg>);};

  const alertList=(()=>{const src=isSup?[...tasks,...supTasks]:tasks.filter(t=>t.staff===sess);return src.filter(t=>t.status!=="Done"&&t.status!=="Cancelled"&&t.deadline).map(t=>({...t,dl:daysLeft(t.deadline)})).filter(t=>t.dl!==null&&t.dl<=3).sort((a,b)=>a.dl-b.dl);})();

  if(!ready)return(
    <div style={{minHeight:"100vh",background:"#f0f4f8",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:14}}>
      <div style={{width:48,height:48,borderRadius:12,background:"#0a2540",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:"#7ecfff",fontWeight:700}}>PDD</div>
      <div style={{fontSize:13,color:"#6b8099"}}>Loading from Firebase...</div>
      <div style={{width:30,height:30,border:"3px solid #dce6ef",borderTop:"3px solid #1a6eb5",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
      <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
    </div>
  );

  if(!sess)return <LoginScreen staff={staff} pins={pins} onLogin={setSess} inp={inp} mkBtn={mkBtn} T={T} APP={APP}/>;

  const Sidebar=()=>(
    <div style={{position:"fixed",top:0,left:side?0:-232,width:222,height:"100vh",background:"#0a2540",color:"#fff",display:"flex",flexDirection:"column",transition:"left .22s",zIndex:100,boxShadow:"2px 0 12px rgba(0,0,0,.18)"}}>
      <div style={{padding:"14px 16px 10px",borderBottom:"1px solid rgba(255,255,255,.1)"}}>
        <div style={{fontSize:13,fontWeight:700,letterSpacing:1,color:"#7ecfff"}}>{APP}</div>
        <div style={{fontSize:10,color:"rgba(255,255,255,.4)"}}>Province of Agusan del Norte</div>
        <div style={{marginTop:4,fontSize:11,color:"rgba(255,255,255,.6)"}}>{isSup?"Supervisor — Waylon":sess}</div>
        <div style={{marginTop:3,fontSize:9,color:"rgba(255,255,255,.5)",display:"flex",alignItems:"center",gap:4}}><div style={{width:6,height:6,borderRadius:"50%",background:"#1e8449"}}/>Firebase · real-time sync</div>
      </div>
      <div style={{flex:1,padding:"6px 0",overflowY:"auto"}}>
        {isSup&&[["dashboard","Dashboard","M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"],["kanban","Kanban Board","M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z"],["tasklog","All Tasks","M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10"],["analytics","Analytics","M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10"],["goals","Goal Tracker","M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2"],["ela","ELA / "+ela.acronym,"M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"],["requests","Approvals"+(requests.length>0?" ("+requests.length+")":""),"M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"],["mywork","My Tasks","M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"],["actlog","Activity Log","M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"]].map(function(item){return(<button key={item[0]} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 16px",cursor:"pointer",borderRadius:6,margin:"1px 8px",background:page===item[0]?"rgba(255,255,255,.14)":"transparent",color:"#fff",fontSize:12,border:"none",fontFamily:"inherit",width:"calc(100% - 16px)",textAlign:"left"}} onClick={()=>{setPage(item[0]);setSide(false);}}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d={item[2]}/></svg>{item[1]}</button>);})}
        {isSup&&<div style={{padding:"6px 16px 2px",fontSize:10,color:"rgba(255,255,255,.3)",letterSpacing:1}}>STAFF</div>}
        {(isSup?staff:staff.filter(x=>x.name===sess)).map(sf=>(<button key={sf.name} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 16px",cursor:"pointer",background:page==="staff"&&activeStaff===sf.name?"rgba(255,255,255,.12)":"transparent",color:"#fff",fontSize:12,border:"none",fontFamily:"inherit",width:"100%",textAlign:"left"}} onClick={()=>{setAS(sf.name);setPage("staff");setSide(false);}}><div style={{width:22,height:22,borderRadius:"50%",background:GA[sf.group]||"#555",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#fff",fontWeight:700,flexShrink:0}}>{ini(sf.name)}</div>{sf.name}</button>))}
        {isSup&&<><div style={{padding:"6px 16px 2px",fontSize:10,color:"rgba(255,255,255,.3)",letterSpacing:1}}>SETTINGS</div>{[["pinmgmt","Manage PINs","M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"],["staffmgmt","Manage Staff","M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0"]].map(function(item){return(<button key={item[0]} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 16px",cursor:"pointer",borderRadius:6,margin:"1px 8px",background:modal===item[0]?"rgba(255,255,255,.14)":"transparent",color:"#fff",fontSize:12,border:"none",fontFamily:"inherit",width:"calc(100% - 16px)",textAlign:"left"}} onClick={()=>{setModal(item[0]);setSide(false);}}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d={item[2]}/></svg>{item[1]}</button>);})}</>}
      </div>
      <button style={{background:"none",border:"none",color:"rgba(255,255,255,.4)",fontSize:12,padding:"10px 16px",cursor:"pointer",textAlign:"left",fontFamily:"inherit"}} onClick={()=>{setSess(null);setPage("dashboard");}}>Sign out</button>
    </div>
  );

  const Topbar=({title})=>(
    <div style={{background:T.card,borderBottom:"1px solid #dce6ef",padding:"0 14px",height:50,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:50,boxShadow:"0 1px 3px rgba(0,0,0,.06)"}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <button style={{background:"none",border:"none",cursor:"pointer",padding:3,color:T.dark}} onClick={()=>setSide(o=>!o)}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg></button>
        <span style={{fontSize:14,fontWeight:600,color:T.dark}}>{title}</span>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <div style={{position:"relative"}}>
          <button style={{background:"none",border:"none",cursor:"pointer",padding:4,color:T.dark}} onClick={()=>setNO(o=>!o)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>
            {(alertList.length>0||requests.length>0)&&<span style={{position:"absolute",top:0,right:0,background:T.red,color:"#fff",borderRadius:99,fontSize:9,padding:"0 4px",fontWeight:700,minWidth:14,textAlign:"center"}}>{alertList.length+requests.length}</span>}
          </button>
          {notifOpen&&(<><div style={{position:"fixed",inset:0,zIndex:199}} onClick={()=>setNO(false)}/>
            <div style={{position:"absolute",right:0,top:36,width:280,background:T.card,borderRadius:10,border:"1px solid #dce6ef",boxShadow:"0 4px 20px rgba(0,0,0,.12)",zIndex:200,maxHeight:320,overflowY:"auto"}}>
              <div style={{padding:"9px 12px",borderBottom:"1px solid #dce6ef",fontSize:12,fontWeight:600,color:T.dark}}>Notifications</div>
              {alertList.length===0&&requests.length===0&&<div style={{padding:"14px",fontSize:12,color:T.muted,textAlign:"center"}}>No notifications</div>}
              {requests.length>0&&<div style={{padding:"8px 12px",borderBottom:"1px solid #dce6ef"}}><div style={{fontSize:11,fontWeight:600,color:"#7d3c98",marginBottom:3}}>Pending ({requests.length})</div>{requests.slice(0,3).map(r=><div key={r.id} style={{fontSize:11,color:T.text,padding:"1px 0"}}>{r.from} to {r.to}: {r.task.title}</div>)}</div>}
              {alertList.map(function(a){const cl=a.dl<0?T.red:a.dl<=1?"#e67e22":T.amber;const msg=a.dl<0?"Overdue "+Math.abs(a.dl)+"d":a.dl===0?"Due today":"Due in "+a.dl+"d";return(<div key={a.id} style={{padding:"6px 12px",borderBottom:"1px solid #dce6ef"}}><div style={{fontSize:11,fontWeight:500,color:T.dark}}>{a.title}</div><div style={{fontSize:10,color:cl}}>{msg} · {a.staff||"Supervisor"}</div></div>);})}
            </div></>)}
        </div>
        <div style={{fontSize:11,color:T.muted}}>{new Date().toLocaleDateString("en-PH",{month:"short",day:"numeric",year:"numeric"})}</div>
      </div>
    </div>
  );

  const Overlay=({children,onClose})=>(<div style={{position:"fixed",inset:0,background:"rgba(10,37,64,.45)",zIndex:200,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"14px 10px",overflowY:"auto"}} onClick={function(e){if(e.target===e.currentTarget)onClose();}}>{children}</div>);
  const MBox=({title,children,onClose})=>(<div style={{background:"#fff",borderRadius:14,padding:"18px",width:"100%",maxWidth:460,boxShadow:"0 8px 32px rgba(0,0,0,.18)",marginTop:8}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}><span style={{fontSize:14,fontWeight:600,color:T.dark}}>{title}</span><button style={{background:"none",border:"none",cursor:"pointer",fontSize:18,color:T.muted}} onClick={onClose}>×</button></div>{children}</div>);

  const CountdownWidget=()=>{
    const src=isSup?[...tasks,...supTasks]:tasks.filter(t=>t.staff===sess);
    const up=src.filter(t=>t.status!=="Done"&&t.status!=="Cancelled"&&t.deadline&&daysLeft(t.deadline)!==null&&daysLeft(t.deadline)<=7).sort((a,b)=>daysLeft(a.deadline)-daysLeft(b.deadline)).slice(0,5);
    if(!up.length)return null;
    return(<div style={{background:T.card,borderRadius:10,border:"1px solid #dce6ef",padding:"11px 14px",marginBottom:12}}>
      <div style={{fontSize:12,fontWeight:600,color:T.dark,marginBottom:7}}>Upcoming Deadlines</div>
      {up.map(function(t){const dl=daysLeft(t.deadline),cl=dl<0?T.red:dl<=1?"#e67e22":dl<=3?T.amber:T.green,msg=dl<0?Math.abs(dl)+"d overdue":dl===0?"Today":dl+"d left";return(<div key={t.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 0",borderBottom:"1px solid #dce6ef"}}><div><div style={{fontSize:12,fontWeight:500,color:T.dark}}>{t.title}</div><div style={{fontSize:10,color:T.muted}}>{t.staff||"Supervisor"} · {fmt(t.deadline)}</div></div><div style={{fontSize:11,fontWeight:700,color:cl,minWidth:70,textAlign:"right"}}>{msg}</div></div>);})}
    </div>);
  };

  const TaskCard=({task,showStaff,onUpd,onDel})=>{
    const [exp,setExp]=useState(false);
    const [cmt,setCmt]=useState("");
    const od=task.deadline&&daysLeft(task.deadline)<0&&task.status!=="Done"&&task.status!=="Cancelled";
    const dl=task.deadline?daysLeft(task.deadline):null;
    let dlC=T.muted;if(dl!==null){if(dl<0)dlC=T.red;else if(dl<=1)dlC="#e67e22";else if(dl<=3)dlC=T.amber;else dlC=T.green;}
    let dlMsg="";if(dl!==null){if(dl<0)dlMsg="Overdue "+Math.abs(dl)+"d";else if(dl===0)dlMsg="Due today";else dlMsg="Due in "+dl+"d";}
    const canEdit=isSup||sess===task.staff;
    return(<div style={{background:T.card,borderRadius:8,border:"1px solid "+(od?"#e74c3c":"#dce6ef"),padding:"9px 10px",marginBottom:7,cursor:"pointer"}} onClick={()=>setExp(e=>!e)}>
      <div style={{display:"flex",justifyContent:"space-between",gap:4,marginBottom:3}}><span style={{fontSize:12,fontWeight:500,color:T.dark,flex:1,lineHeight:1.3}}>{task.title}</span><span style={{...mkBdg(PB[task.priority],PC[task.priority]),fontSize:10,flexShrink:0}}>{task.priority}</span></div>
      {showStaff&&<div style={{fontSize:10,color:T.muted,marginBottom:2}}>{task.staff}</div>}
      {task.taskType&&<div style={{fontSize:10,color:T.blue,marginBottom:2,fontWeight:500}}>{task.taskType}{task.docSubType?" · "+task.docSubType:""}{task.techDocType?" · "+task.techDocType:""}</div>}
      {task.stage&&<div style={{fontSize:10,color:T.muted,marginBottom:3}}>Stage: <b style={{color:T.dark}}>{task.stage}</b></div>}
      <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:2}}><div style={{flex:1}}><PBar pct={task.progress||0}/></div><span style={{fontSize:10,fontWeight:600,color:T.muted,minWidth:26}}>{task.progress||0}%</span><span style={{...mkBdg(SB[task.status],SC[task.status]),fontSize:9}}>{task.status}</span></div>
      {task.deadline&&<div style={{fontSize:10,color:dlC}}>{dlMsg} · {fmt(task.deadline)}</div>}
      {exp&&(<div style={{borderTop:"1px solid #dce6ef",marginTop:8,paddingTop:8}} onClick={function(e){e.stopPropagation();}}>
        {task.description&&<p style={{fontSize:11,color:T.muted,margin:"0 0 3px"}}>{task.description}</p>}
        {task.docType&&<p style={{fontSize:11,color:T.muted,margin:"0 0 3px"}}>Type: {task.docType}</p>}
        {task.docAction&&<p style={{fontSize:11,color:T.muted,margin:"0 0 3px"}}>Action: {task.docAction}</p>}
        {task.meetingAgency&&<p style={{fontSize:11,color:T.muted,margin:"0 0 3px"}}>From: {task.meetingAgency} | Venue: {task.meetingVenue||"—"}</p>}
        {task.attendees&&<p style={{fontSize:11,color:T.muted,margin:"0 0 3px"}}>Attendees: {task.attendees}</p>}
        {task.cost&&<p style={{fontSize:11,color:T.muted,margin:"0 0 3px"}}>Cost: ₱{toNum(task.cost).toLocaleString()}</p>}
        {task.projectCost&&<p style={{fontSize:11,color:T.muted,margin:"0 0 3px"}}>Project Cost: ₱{toNum(task.projectCost).toLocaleString()}</p>}
        {task.requiresPAR&&<p style={{fontSize:11,color:"#7d3a00",margin:"0 0 3px",fontWeight:500}}>PAR Required{task.parStage?" · "+task.parStage:""}</p>}
        {task.forwardedBy&&<p style={{fontSize:11,color:T.blue,margin:"0 0 3px"}}>Forwarded by: {task.forwardedBy}</p>}
        {task.elaTarget&&<p style={{fontSize:11,color:"#7d3c98",margin:"0 0 3px"}}>ELA: {task.elaTarget}</p>}
        {task.isReminder&&<p style={{fontSize:11,color:"#7d3c98",margin:"0 0 3px"}}>Reminder · {fmt(task.reminderDate)}</p>}
        {task.remarks&&<div style={{background:"#f7f9fc",borderRadius:6,padding:"5px 8px",marginBottom:4,fontSize:11,color:T.muted}}><b style={{color:T.dark}}>Remarks:</b> {task.remarks}</div>}
        {(task.comments||[]).length>0&&<div style={{marginBottom:6}}><div style={{fontSize:10,fontWeight:600,color:T.dark,marginBottom:3}}>Updates</div>{(task.comments||[]).map(function(c,i){return(<div key={i} style={{background:"#f7f9fc",borderRadius:6,padding:"4px 8px",marginBottom:3}}><div style={{fontSize:10,color:T.blue,fontWeight:500}}>{c.by} · {new Date(c.at).toLocaleDateString("en-PH",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}</div><div style={{fontSize:11,color:T.text}}>{c.text}</div></div>);})}</div>}
        <div style={{display:"flex",gap:5,marginBottom:6}}>
          <input style={{...inp,flex:1,fontSize:11,padding:"5px 8px"}} placeholder="Add update..." value={cmt} onChange={e=>setCmt(e.target.value)} onClick={function(e){e.stopPropagation();}}/>
          <button style={{...mkBtn("#0a2540","#fff","#0a2540"),padding:"4px 10px",fontSize:11}} onClick={function(){if(cmt.trim()){addComment(task.id,cmt);setCmt("");}}}>Post</button>
        </div>
        {canEdit&&<div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          <button style={{...mkBtn(),padding:"3px 8px",fontSize:11}} onClick={function(){setEI(task);setModal("taskForm");}}>Edit</button>
          {STATUSES.filter(x=>x!==task.status).map(x=><button key={x} style={{...mkBtn(SB[x],SC[x],SC[x]),padding:"3px 7px",fontSize:10}} onClick={function(){onUpd({...task,status:x});}}>{x}</button>)}
          {isSup&&<button style={{...mkBtn("#fdf2f2",T.red,"#e74c3c"),padding:"3px 8px",fontSize:11}} onClick={function(){onDel(task.id);}}>Delete</button>}
        </div>}
      </div>)}
    </div>);
  };

  const TaskFormModal=({forStaff,isSuperTask})=>{
    const isST=isSuperTask||false,isEdit=!!(editItem&&editItem.id);
    const defStaff=isSup?(editItem?editItem.staff||forStaff||"":forStaff||""):(sess||"");
    const [f,setF]=useState(isEdit?{...editItem}:{staff:defStaff,title:"",description:"",priority:"Medium",deadline:"",reminderDate:"",isReminder:false,taskType:"",docSubType:"",techDocType:"",docType:"",docAction:"",stage:"",progress:0,remarks:"",status:"To Do",requiresPAR:false,parStage:"",cost:"",projectCost:"",meetingAgency:"",meetingVenue:"",attendees:"",elaTarget:"",isSuperTask:isST});
    const [busy,setBusy]=useState(false);
    const tTypes=isST?TASK_TYPES.supervisor:getTaskTypes(f.staff);
    const getStages=()=>{if(f.taskType==="Activity"&&f.requiresPAR&&f.stage==="Conducted")return STAGES["PAR"];return STAGES[f.taskType]||[];};
    const F=(k,v)=>setF(x=>({...x,[k]:v}));
    const submit=async()=>{
      if(!f.title.trim())return;setBusy(true);
      try{
        if(isST){isEdit?await updSupTask(f):await addSupTask(f);}
        else{
          const sfObj=staff.find(x=>x.name===f.staff);
          const needsApproval=!isSup&&sfObj&&sfObj.group==="admin";
          if(needsApproval&&!isEdit){await addReq({from:sess,to:"supervisor",type:"taskApproval",task:{...f}});toast$("Submitted for approval.");setModal(null);setEI(null);return;}
          isEdit?await updTask(f):await addTask(f);
        }
        toast$(isEdit?"Updated.":"Task added.");setModal(null);setEI(null);
      }catch(e){toast$("Error saving.");}
      setBusy(false);
    };
    const stageList=getStages();
    return(<Overlay onClose={()=>{setModal(null);setEI(null);}}><MBox title={isEdit?"Edit Task":"New Task"} onClose={()=>{setModal(null);setEI(null);}}>
      <div style={{display:"grid",gap:8}}>
        {isSup&&!isST&&<select style={inp} value={f.staff} onChange={e=>{F("staff",e.target.value);F("taskType","");F("stage","");}}><option value="">Assign to staff *</option>{staff.map(x=><option key={x.name}>{x.name}</option>)}</select>}
        <input style={inp} placeholder="Task title *" value={f.title} onChange={e=>F("title",e.target.value)}/>
        <textarea style={{...inp,minHeight:48,resize:"vertical"}} placeholder="Description" value={f.description} onChange={e=>F("description",e.target.value)}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <select style={inp} value={f.priority} onChange={e=>F("priority",e.target.value)}>{PRIORITIES.map(p=><option key={p}>{p}</option>)}</select>
          <input type="date" style={inp} value={f.deadline} onChange={e=>F("deadline",e.target.value)}/>
        </div>
        <label style={{display:"flex",alignItems:"center",gap:7,fontSize:12,color:T.muted,cursor:"pointer"}}><input type="checkbox" checked={f.isReminder} onChange={e=>F("isReminder",e.target.checked)}/> Flag as Reminder/Scheduled</label>
        {f.isReminder&&<input type="date" style={inp} value={f.reminderDate} onChange={e=>F("reminderDate",e.target.value)}/>}
        {tTypes.length>0&&<select style={inp} value={f.taskType} onChange={e=>{F("taskType",e.target.value);F("stage","");F("docSubType","");F("techDocType","");}}><option value="">Task type</option>{tTypes.map(t=><option key={t}>{t}</option>)}</select>}
        {f.taskType==="Document"&&<select style={inp} value={f.docSubType} onChange={e=>{F("docSubType",e.target.value);F("techDocType","");}}><option value="">Technical or Non-Technical?</option><option>Technical</option><option>Non-Technical/Basic</option></select>}
        {f.taskType==="Document"&&f.docSubType==="Technical"&&<select style={inp} value={f.techDocType} onChange={e=>F("techDocType",e.target.value)}><option value="">Document type</option>{DOC_TECH.map(t=><option key={t}>{t}</option>)}</select>}
        {(f.taskType==="Other Document"||f.taskType==="Other Tasks")&&<input style={inp} placeholder={f.taskType==="Other Tasks"?"Specify task type...":"Document type"} value={f.docType} onChange={e=>F("docType",e.target.value)}/>}
        {f.taskType==="Other Document"&&<input style={inp} placeholder="Action needed" value={f.docAction} onChange={e=>F("docAction",e.target.value)}/>}
        {f.taskType==="Documentary Requirements Processing"&&<input style={inp} placeholder="Document/permit type (e.g. ECC, CNC...)" value={f.docType} onChange={e=>F("docType",e.target.value)}/>}
        {f.taskType==="Meeting"&&<><input style={inp} placeholder="Inviting agency/office" value={f.meetingAgency} onChange={e=>F("meetingAgency",e.target.value)}/><input style={inp} placeholder="Venue" value={f.meetingVenue} onChange={e=>F("meetingVenue",e.target.value)}/><input style={inp} placeholder="Attendees" value={f.attendees} onChange={e=>F("attendees",e.target.value)}/></>}
        {stageList.length>0&&<select style={inp} value={f.stage} onChange={e=>F("stage",e.target.value)}><option value="">Process stage</option>{stageList.map(s=><option key={s}>{s}</option>)}</select>}
        {f.taskType==="Activity"&&<label style={{display:"flex",alignItems:"center",gap:7,fontSize:12,color:"#7d3a00",cursor:"pointer",background:"#fef9ec",borderRadius:7,padding:"7px 10px",border:"1px solid #f5cba7"}}><input type="checkbox" checked={f.requiresPAR} onChange={e=>F("requiresPAR",e.target.checked)}/> Requires Post-Activity Report</label>}
        {f.requiresPAR&&<select style={inp} value={f.parStage} onChange={e=>F("parStage",e.target.value)}><option value="">PAR stage</option>{STAGES["PAR"].map(s=><option key={s}>{s}</option>)}</select>}
        {(f.taskType==="Activity Processing"||f.taskType==="Disbursement")&&<input style={inp} type="number" placeholder="Activity cost (₱)" value={f.cost} onChange={e=>F("cost",e.target.value)}/>}
        {f.taskType==="Engineering Task"&&<input style={inp} type="number" placeholder="Project cost (₱)" value={f.projectCost} onChange={e=>F("projectCost",e.target.value)}/>}
        {isSup&&ela.targets&&ela.targets.length>0&&<select style={inp} value={f.elaTarget} onChange={e=>F("elaTarget",e.target.value)}><option value="">Link to {ela.acronym} target</option>{ela.targets.map(t=><option key={t.id}>{t.title}</option>)}</select>}
        <select style={inp} value={f.status} onChange={e=>F("status",e.target.value)}>{STATUSES.map(s=><option key={s}>{s}</option>)}</select>
        <div><div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontSize:11,color:T.muted}}>Progress</span><span style={{fontSize:11,fontWeight:600}}>{f.progress}%</span></div><input type="range" min={0} max={100} step={5} value={f.progress} style={{width:"100%"}} onChange={e=>F("progress",Number(e.target.value))}/></div>
        <textarea style={{...inp,minHeight:40,resize:"vertical"}} placeholder="Remarks" value={f.remarks} onChange={e=>F("remarks",e.target.value)}/>
        <div style={{display:"flex",gap:7}}><button style={{...mkBtn("#0a2540","#fff","#0a2540"),flex:1,opacity:busy?0.6:1}} onClick={submit} disabled={busy}>{busy?"Saving...":isEdit?"Save":"Add task"}</button><button style={mkBtn()} onClick={()=>{setModal(null);setEI(null);}}>Cancel</button></div>
      </div>
    </MBox></Overlay>);
  };

  const ForwardModal=()=>{
    const act=staff.filter(x=>x.group==="activity").map(x=>x.name);
    const [f,setF]=useState({title:"",description:"",priority:"Medium",deadline:"",stage:"",remarks:"",cost:""});
    const [to,setTo]=useState(act[0]||"Peter");const [busy,setBusy]=useState(false);
    const submit=async()=>{if(!f.title.trim())return;setBusy(true);await addReq({from:sess,to,type:"forward",task:{...f,staff:to,taskType:"Activity Processing",status:"To Do",progress:0,comments:[]}});setModal(null);toast$("Forwarded for approval.");setBusy(false);};
    return(<Overlay onClose={()=>setModal(null)}><MBox title="Forward to Activity Processing" onClose={()=>setModal(null)}>
      <div style={{display:"grid",gap:8}}>
        <select style={inp} value={to} onChange={e=>setTo(e.target.value)}>{act.map(n=><option key={n}>{n}</option>)}</select>
        <input style={inp} placeholder="Task title *" value={f.title} onChange={e=>setF(x=>({...x,title:e.target.value}))}/>
        <textarea style={{...inp,minHeight:48}} placeholder="Description" value={f.description} onChange={e=>setF(x=>({...x,description:e.target.value}))}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <select style={inp} value={f.priority} onChange={e=>setF(x=>({...x,priority:e.target.value}))}>{PRIORITIES.map(p=><option key={p}>{p}</option>)}</select>
          <input type="date" style={inp} value={f.deadline} onChange={e=>setF(x=>({...x,deadline:e.target.value}))}/>
        </div>
        <select style={inp} value={f.stage} onChange={e=>setF(x=>({...x,stage:e.target.value}))}><option value="">Processing stage</option>{STAGES["Activity Processing"].map(s=><option key={s}>{s}</option>)}</select>
        <input style={inp} type="number" placeholder="Estimated cost (₱)" value={f.cost} onChange={e=>setF(x=>({...x,cost:e.target.value}))}/>
        <textarea style={{...inp,minHeight:38}} placeholder="Remarks" value={f.remarks} onChange={e=>setF(x=>({...x,remarks:e.target.value}))}/>
        <div style={{display:"flex",gap:7}}><button style={{...mkBtn("#1e8449","#fff","#1e8449"),flex:1,opacity:busy?0.6:1}} onClick={submit} disabled={busy}>{busy?"Submitting...":"Submit"}</button><button style={mkBtn()} onClick={()=>setModal(null)}>Cancel</button></div>
      </div>
    </MBox></Overlay>);
  };

  const ELAModal=()=>{
    const [local,setLocal]=useState(JSON.parse(JSON.stringify(ela)));
    const [nt,setNt]=useState({title:"",assignedTo:"",deadline:"",status:"Pending"});
    const [busy,setBusy]=useState(false);
    const addT=()=>{if(!nt.title.trim())return;setLocal(e=>({...e,targets:[...(e.targets||[]),{...nt,id:uid()}]}));setNt({title:"",assignedTo:"",deadline:"",status:"Pending"});};
    const updT=(id,k,v)=>setLocal(e=>({...e,targets:(e.targets||[]).map(x=>x.id===id?{...x,[k]:v}:x)}));
    return(<Overlay onClose={()=>setModal(null)}><MBox title={"ELA / "+local.acronym+" Targets"} onClose={()=>setModal(null)}>
      <div style={{display:"grid",gap:8}}>
        <div style={{display:"flex",gap:6,alignItems:"center"}}><span style={{fontSize:12,color:T.muted,whiteSpace:"nowrap"}}>Acronym:</span><input style={{...inp,flex:1}} value={local.acronym} onChange={e=>setLocal(x=>({...x,acronym:e.target.value}))}/></div>
        <div style={{maxHeight:"32vh",overflowY:"auto",display:"grid",gap:6}}>
          {(local.targets||[]).map(t=>(<div key={t.id} style={{background:"#f7f9fc",borderRadius:8,padding:"8px",border:"1px solid #dce6ef"}}><div style={{display:"flex",gap:6,alignItems:"flex-start"}}><div style={{flex:1}}><input style={{...inp,marginBottom:4,fontSize:12}} value={t.title} onChange={e=>updT(t.id,"title",e.target.value)}/><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:5}}><select style={{...inp,fontSize:11}} value={t.assignedTo} onChange={e=>updT(t.id,"assignedTo",e.target.value)}><option value="">Assign</option>{staff.map(s=><option key={s.name}>{s.name}</option>)}</select><input type="date" style={{...inp,fontSize:11}} value={t.deadline} onChange={e=>updT(t.id,"deadline",e.target.value)}/><select style={{...inp,fontSize:11}} value={t.status} onChange={e=>updT(t.id,"status",e.target.value)}>{["Pending","In Progress","Completed","Cancelled"].map(s=><option key={s}>{s}</option>)}</select></div></div><button style={{...mkBtn("#fdf2f2",T.red,"#e74c3c"),padding:"2px 7px",fontSize:11}} onClick={()=>setLocal(x=>({...x,targets:x.targets.filter(y=>y.id!==t.id)}))}>×</button></div></div>))}
        </div>
        <div style={{background:"#eafaf1",borderRadius:8,padding:"10px",border:"1px solid #a9dfbf"}}>
          <div style={{fontSize:11,fontWeight:600,color:T.dark,marginBottom:6}}>Add Target</div>
          <input style={{...inp,marginBottom:5}} placeholder="Target title" value={nt.title} onChange={e=>setNt(x=>({...x,title:e.target.value}))}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5,marginBottom:5}}><select style={inp} value={nt.assignedTo} onChange={e=>setNt(x=>({...x,assignedTo:e.target.value}))}><option value="">Assign to</option>{staff.map(s=><option key={s.name}>{s.name}</option>)}</select><input type="date" style={inp} value={nt.deadline} onChange={e=>setNt(x=>({...x,deadline:e.target.value}))}/></div>
          <button style={{...mkBtn("#1e8449","#fff","#1e8449"),width:"100%"}} onClick={addT}>+ Add</button>
        </div>
        <div style={{display:"flex",gap:7}}><button style={{...mkBtn("#0a2540","#fff","#0a2540"),flex:1,opacity:busy?0.6:1}} onClick={async()=>{setBusy(true);await saveELA(local);setModal(null);toast$("ELA updated.");setBusy(false);}} disabled={busy}>{busy?"Saving...":"Save"}</button><button style={mkBtn()} onClick={()=>setModal(null)}>Cancel</button></div>
      </div>
    </MBox></Overlay>);
  };

  const GoalModal=()=>{
    const isE=!!(editItem&&editItem.goalTitle);
    const [f,setF]=useState(isE?{...editItem}:{goalTitle:"",description:"",period:"Monthly",month:"",quarter:"",year:new Date().getFullYear()+"",assignedTo:"",deadline:"",status:"Not Started",progress:0});
    const [busy,setBusy]=useState(false);
    const F=(k,v)=>setF(x=>({...x,[k]:v}));
    const submit=async()=>{if(!f.goalTitle.trim())return;setBusy(true);isE?await updGoal(f):await addGoal(f);setModal(null);setEI(null);toast$(isE?"Goal updated.":"Goal added.");setBusy(false);};
    return(<Overlay onClose={()=>{setModal(null);setEI(null);}}><MBox title={isE?"Edit Goal":"New Goal"} onClose={()=>{setModal(null);setEI(null);}}>
      <div style={{display:"grid",gap:8}}>
        <input style={inp} placeholder="Goal title *" value={f.goalTitle} onChange={e=>F("goalTitle",e.target.value)}/>
        <textarea style={{...inp,minHeight:48}} placeholder="Description" value={f.description} onChange={e=>F("description",e.target.value)}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <select style={inp} value={f.period} onChange={e=>F("period",e.target.value)}><option>Monthly</option><option>Quarterly</option></select>
          {f.period==="Monthly"?<select style={inp} value={f.month} onChange={e=>F("month",e.target.value)}><option value="">Month</option>{["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map(m=><option key={m}>{m}</option>)}</select>:<select style={inp} value={f.quarter} onChange={e=>F("quarter",e.target.value)}><option value="">Quarter</option><option>Q1</option><option>Q2</option><option>Q3</option><option>Q4</option></select>}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}><input style={inp} placeholder="Year" value={f.year} onChange={e=>F("year",e.target.value)}/><input type="date" style={inp} value={f.deadline} onChange={e=>F("deadline",e.target.value)}/></div>
        <select style={inp} value={f.assignedTo} onChange={e=>F("assignedTo",e.target.value)}><option value="">Assign to</option>{staff.map(s=><option key={s.name}>{s.name}</option>)}</select>
        <select style={inp} value={f.status} onChange={e=>F("status",e.target.value)}>{["Not Started","In Progress","Completed","Cancelled"].map(s=><option key={s}>{s}</option>)}</select>
        <div><div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontSize:11,color:T.muted}}>Progress</span><span style={{fontSize:11,fontWeight:600}}>{f.progress}%</span></div><input type="range" min={0} max={100} step={5} value={f.progress} style={{width:"100%"}} onChange={e=>F("progress",Number(e.target.value))}/></div>
        <div style={{display:"flex",gap:7}}><button style={{...mkBtn("#0a2540","#fff","#0a2540"),flex:1,opacity:busy?0.6:1}} onClick={submit} disabled={busy}>{busy?"Saving...":isE?"Save":"Add"}</button><button style={mkBtn()} onClick={()=>{setModal(null);setEI(null);}}>Cancel</button></div>
      </div>
    </MBox></Overlay>);
  };

  const PinModal=()=>{
    const [local,setLocal]=useState({...pins});const [busy,setBusy]=useState(false);
    return(<Overlay onClose={()=>setModal(null)}><MBox title="Manage PINs" onClose={()=>setModal(null)}>
      <div style={{display:"grid",gap:7,maxHeight:"55vh",overflowY:"auto"}}>
        {["supervisor",...staff.map(x=>x.name)].map(k=>(<div key={k} style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:12,minWidth:90,color:T.dark,fontWeight:k==="supervisor"?600:400}}>{k==="supervisor"?"Supervisor":k}</span><input style={{...inp,flex:1}} type="password" maxLength={6} value={local[k]||""} onChange={e=>setLocal(p=>({...p,[k]:e.target.value}))} placeholder="PIN"/></div>))}
      </div>
      <div style={{display:"flex",gap:7,marginTop:10}}><button style={{...mkBtn("#0a2540","#fff","#0a2540"),flex:1,opacity:busy?0.6:1}} onClick={async()=>{setBusy(true);await savePins(local);setModal(null);toast$("PINs saved.");setBusy(false);}} disabled={busy}>{busy?"Saving...":"Save"}</button><button style={mkBtn()} onClick={()=>setModal(null)}>Cancel</button></div>
    </MBox></Overlay>);
  };

  const StaffModal=()=>{
    const groupKeys=Object.keys(GM);
    const [list,setList]=useState(staff.map(x=>({...x})));
    const [newName,setNewName]=useState(""),[newRole,setNewRole]=useState(""),[newGroup,setNewGroup]=useState("pdo");
    const [busy,setBusy]=useState(false);
    const updF=(i,k,v)=>setList(l=>l.map((x,j)=>j===i?{...x,[k]:v}:x));
    const addNew=()=>{if(!newName.trim()||!newRole.trim())return;setList(l=>[...l,{name:newName.trim(),role:newRole.trim(),group:newGroup}]);setNewName("");setNewRole("");setNewGroup("pdo");};
    const save=async()=>{
      setBusy(true);
      const newPins={...pins};
      list.forEach(s=>{if(!newPins[s.name])newPins[s.name]="1234";});
      await saveStaff(list);await savePins(newPins);
      setModal(null);toast$("Staff updated.");setBusy(false);
    };
    return(<Overlay onClose={()=>setModal(null)}><MBox title="Manage Staff" onClose={()=>setModal(null)}>
      <div style={{maxHeight:"42vh",overflowY:"auto",display:"grid",gap:7,marginBottom:10}}>
        {list.map((sf,i)=>(<div key={i} style={{background:"#f7f9fc",borderRadius:8,padding:"8px 10px",border:"1px solid #dce6ef"}}><div style={{display:"flex",gap:6,alignItems:"center",marginBottom:5}}><div style={{width:24,height:24,borderRadius:"50%",background:GA[sf.group]||"#888",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#fff",fontWeight:700,flexShrink:0}}>{ini(sf.name||"?")}</div><input style={{...inp,flex:1,fontSize:12}} placeholder="Name" value={sf.name} onChange={e=>updF(i,"name",e.target.value)}/><button style={{...mkBtn("#fdf2f2",T.red,"#e74c3c"),padding:"2px 8px",fontSize:11,flexShrink:0}} onClick={()=>setList(l=>l.filter((_,j)=>j!==i))}>×</button></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}><input style={{...inp,fontSize:12}} placeholder="Job classification" value={sf.role} onChange={e=>updF(i,"role",e.target.value)}/><select style={{...inp,fontSize:12}} value={sf.group} onChange={e=>updF(i,"group",e.target.value)}>{groupKeys.map(g=><option key={g} value={g}>{GM[g].label}</option>)}</select></div></div>))}
      </div>
      <div style={{background:"#eafaf1",borderRadius:8,padding:"10px 12px",border:"1px solid #a9dfbf",marginBottom:10}}>
        <div style={{fontSize:11,fontWeight:600,color:T.dark,marginBottom:6}}>Add New Staff</div>
        <input style={{...inp,marginBottom:6}} placeholder="Full name *" value={newName} onChange={e=>setNewName(e.target.value)}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:6}}><input style={inp} placeholder="Job classification *" value={newRole} onChange={e=>setNewRole(e.target.value)}/><select style={inp} value={newGroup} onChange={e=>setNewGroup(e.target.value)}>{groupKeys.map(g=><option key={g} value={g}>{GM[g].label}</option>)}</select></div>
        <button style={{...mkBtn("#1e8449","#fff","#1e8449"),width:"100%",fontSize:12}} onClick={addNew}>+ Add Staff</button>
      </div>
      <div style={{display:"flex",gap:7}}><button style={{...mkBtn("#0a2540","#fff","#0a2540"),flex:1,opacity:busy?0.6:1}} onClick={save} disabled={busy}>{busy?"Saving...":"Save All"}</button><button style={mkBtn()} onClick={()=>setModal(null)}>Cancel</button></div>
    </MBox></Overlay>);
  };

  const wrap={padding:"14px",maxWidth:1100,margin:"0 auto"};
  const staffStats=name=>{const m=tasks.filter(t=>t.staff===name),done=m.filter(t=>t.status==="Done").length;return{total:m.length,done,inprog:m.filter(t=>t.status==="In Progress").length,todo:m.filter(t=>t.status==="To Do").length,avg:m.length?Math.round(m.reduce((a,t)=>a+(t.progress||0),0)/m.length):0,overdue:m.filter(t=>t.deadline&&daysLeft(t.deadline)<0&&t.status!=="Done"&&t.status!=="Cancelled").length};};

  const DashPage=()=>{
    const [fg,setFg]=useState("All");
    const vis=fg==="All"?staff:staff.filter(x=>x.group===fg);
    const tot=tasks.length,dn=tasks.filter(t=>t.status==="Done").length,ip=tasks.filter(t=>t.status==="In Progress").length,ov=tasks.filter(t=>t.deadline&&daysLeft(t.deadline)<0&&t.status!=="Done"&&t.status!=="Cancelled").length,pct=tot?Math.round((dn/tot)*100):0;
    return(<div style={wrap}>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>{[["Total",tot,"#e8f4fd","#1a4f7a"],["In Progress",ip,"#fef9ec","#7d5a00"],["Completed",dn,"#eafaf1","#1a5c2e"],["Overdue",ov,"#fdf2f2","#7a1c1c"],["Overall",pct+"%","#f0f4f8","#0a2540"]].map(function(item){return(<div key={item[0]} style={{background:item[2],borderRadius:10,padding:"10px 14px",flex:1,minWidth:80,border:"1px solid #dce6ef"}}><div style={{fontSize:10,color:item[3],marginBottom:1,fontWeight:500}}>{item[0]}</div><div style={{fontSize:22,fontWeight:700,color:item[3]}}>{item[1]}</div></div>);})}</div>
      {ela.targets&&ela.targets.length>0&&<div style={{background:"#f5eef8",borderRadius:10,padding:"10px 14px",marginBottom:12,border:"1px solid #d7bde2"}}><div style={{fontSize:11,fontWeight:600,color:"#7d3c98",marginBottom:5}}>{ela.acronym} — {ela.targets.filter(t=>t.status==="Completed").length}/{ela.targets.length} completed</div><div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{ela.targets.slice(0,6).map(function(t){const bg=t.status==="Completed"?"#eafaf1":t.status==="In Progress"?"#fef9ec":"#f5eef8",cl=t.status==="Completed"?T.green:t.status==="In Progress"?T.amber:"#7d3c98";return(<span key={t.id} style={{...mkBdg(bg,cl),fontSize:10}}>{t.title}</span>);})}{ela.targets.length>6&&<span style={{fontSize:10,color:T.muted}}>+{ela.targets.length-6} more</span>}</div></div>}
      <CountdownWidget/>
      {goals.length>0&&<div style={{background:T.card,borderRadius:10,border:"1px solid #dce6ef",padding:"10px 14px",marginBottom:12}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}><span style={{fontSize:12,fontWeight:600,color:T.dark}}>Goals</span><button style={{fontSize:11,color:T.blue,background:"none",border:"none",cursor:"pointer"}} onClick={()=>setPage("goals")}>View all</button></div><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{goals.slice(0,4).map(g=><div key={g.id} style={{background:"#f7f9fc",borderRadius:8,padding:"7px 10px",minWidth:110,border:"1px solid #dce6ef"}}><div style={{fontSize:11,fontWeight:500,color:T.dark,marginBottom:2}}>{g.goalTitle}</div><PBar pct={g.progress||0}/><div style={{fontSize:10,color:T.muted,marginTop:2}}>{g.period} · {g.month||g.quarter} {g.year}</div></div>)}</div></div>}
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10,alignItems:"center"}}>{["All",...Object.keys(GM)].map(g=><button key={g} style={{...mkBtn(fg===g?"#0a2540":"#fff",fg===g?"#fff":T.text,fg===g?"#0a2540":"#dce6ef"),fontSize:11,padding:"4px 10px"}} onClick={()=>setFg(g)}>{g==="All"?"All":GM[g].label}</button>)}<button style={{...mkBtn("#0a2540","#fff","#0a2540"),fontSize:11,padding:"4px 12px",marginLeft:"auto"}} onClick={()=>{setEI(null);setModal("taskForm");}}>+ Add Task</button></div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(230px,1fr))",gap:10}}>{vis.map(function(sf){const ss=staffStats(sf.name),gm=GM[sf.group]||{color:"#888"};return(<div key={sf.name} style={{background:T.card,borderRadius:12,border:"1px solid #dce6ef",padding:"12px 13px",cursor:"pointer"}} onClick={()=>{setAS(sf.name);setPage("staff");}}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}><div style={{width:34,height:34,borderRadius:"50%",background:gm.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#fff",fontWeight:700,flexShrink:0}}>{ini(sf.name)}</div><div style={{flex:1,minWidth:0}}><div style={{fontSize:13,fontWeight:600,color:T.dark}}>{sf.name}</div><div style={{fontSize:10,color:T.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{sf.role}</div></div><Ring pct={ss.avg}/></div><PBar pct={ss.avg}/><div style={{display:"flex",gap:4,marginTop:7}}>{[["Todo",ss.todo,SB["To Do"],SC["To Do"]],["Active",ss.inprog,SB["In Progress"],SC["In Progress"]],["Done",ss.done,SB["Done"],SC["Done"]]].map(function(item){return(<div key={item[0]} style={{flex:1,background:item[2],borderRadius:7,padding:"4px 2px",textAlign:"center"}}><div style={{fontSize:14,fontWeight:700,color:item[3]}}>{item[1]}</div><div style={{fontSize:9,color:item[3]}}>{item[0]}</div></div>);})}{ss.overdue>0&&<div style={{flex:1,background:"#fdf2f2",borderRadius:7,padding:"4px 2px",textAlign:"center"}}><div style={{fontSize:14,fontWeight:700,color:T.red}}>{ss.overdue}</div><div style={{fontSize:9,color:T.red}}>Late</div></div>}</div></div>);})}</div>
    </div>);
  };

  const StaffPage=()=>{
    const sf=staff.find(x=>x.name===activeStaff);if(!sf)return null;
    const gm=GM[sf.group]||{color:"#888"},mine=tasks.filter(t=>t.staff===sf.name),avg=mine.length?Math.round(mine.reduce((a,t)=>a+(t.progress||0),0)/mine.length):0;
    const canAdd=isSup||sess===sf.name,isPDO=sf.group==="pdo";
    return(<div style={wrap}>
      <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:11,flexWrap:"wrap"}}>
        {isSup&&<button style={{...mkBtn(),fontSize:12}} onClick={()=>setPage("dashboard")}>← Back</button>}
        <div style={{width:36,height:36,borderRadius:"50%",background:gm.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#fff",fontWeight:700,flexShrink:0}}>{ini(sf.name)}</div>
        <div style={{flex:1}}><div style={{fontSize:14,fontWeight:600,color:T.dark}}>{sf.name}</div><div style={{fontSize:11,color:T.muted}}>{sf.role}</div></div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {canAdd&&<button style={{...mkBtn("#0a2540","#fff","#0a2540"),fontSize:12}} onClick={()=>{setEI(null);setModal("taskForm");}}>+ Add Task</button>}
          {isPDO&&sess!=="supervisor"&&<button style={{...mkBtn("#1e8449","#fff","#1e8449"),fontSize:12}} onClick={()=>setModal("forward")}>Forward to Processing</button>}
        </div>
      </div>
      <CountdownWidget/>
      <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:11}}>{[["Total",mine.length,"#e8f4fd","#1a4f7a"],["Active",mine.filter(t=>t.status==="In Progress").length,"#fef9ec","#7d5a00"],["Done",mine.filter(t=>t.status==="Done").length,"#eafaf1","#1a5c2e"],["Avg",avg+"%","#f0f4f8","#0a2540"]].map(function(item){return(<div key={item[0]} style={{background:item[2],borderRadius:9,padding:"9px 12px",minWidth:65}}><div style={{fontSize:9,color:item[3],marginBottom:1}}>{item[0]}</div><div style={{fontSize:19,fontWeight:700,color:item[3]}}>{item[1]}</div></div>);})}</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))",gap:9}}>{STATUSES.map(col=>{const ct=mine.filter(t=>t.status===col);return(<div key={col} style={{background:"#f7f9fc",borderRadius:10,border:"1px solid #dce6ef",padding:"9px 8px"}}><div style={{display:"flex",alignItems:"center",gap:5,marginBottom:6}}><div style={{width:7,height:7,borderRadius:"50%",background:SC[col]}}/><span style={{fontSize:11,fontWeight:600,color:T.dark}}>{col}</span><span style={{marginLeft:"auto",fontSize:10,background:SB[col],color:SC[col],borderRadius:20,padding:"1px 6px",fontWeight:600}}>{ct.length}</span></div>{ct.map(t=><TaskCard key={t.id} task={t} onUpd={updTask} onDel={delTask}/>)}{ct.length===0&&<div style={{fontSize:10,color:"#a0b0c0",textAlign:"center",padding:"12px 0"}}>—</div>}</div>);})}</div>
    </div>);
  };

  const KanbanPage=()=>(<div style={wrap}><div style={{display:"flex",justifyContent:"flex-end",marginBottom:10}}><button style={{...mkBtn("#0a2540","#fff","#0a2540"),fontSize:12}} onClick={()=>{setEI(null);setModal("taskForm");}}>+ Add Task</button></div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:9}}>{STATUSES.map(col=>{const ct=tasks.filter(t=>t.status===col);return(<div key={col} style={{background:"#f7f9fc",borderRadius:10,border:"1px solid #dce6ef",padding:"9px 8px"}}><div style={{display:"flex",alignItems:"center",gap:5,marginBottom:6}}><div style={{width:7,height:7,borderRadius:"50%",background:SC[col]}}/><span style={{fontSize:11,fontWeight:600,color:T.dark}}>{col}</span><span style={{marginLeft:"auto",fontSize:10,background:SB[col],color:SC[col],borderRadius:20,padding:"1px 6px",fontWeight:600}}>{ct.length}</span></div>{ct.map(t=><TaskCard key={t.id} task={t} showStaff={true} onUpd={updTask} onDel={delTask}/>)}{ct.length===0&&<div style={{fontSize:10,color:"#a0b0c0",textAlign:"center",padding:"12px 0"}}>—</div>}</div>);})}</div></div>);

  const TaskLogPage=()=>{
    const [q,setQ]=useState(""),[fs,setFs]=useState("All");
    const rows=tasks.filter(t=>(!q||t.title.toLowerCase().includes(q.toLowerCase())||t.staff.toLowerCase().includes(q.toLowerCase()))&&(fs==="All"||t.status===fs));
    return(<div style={wrap}>
      <div style={{display:"flex",gap:7,marginBottom:10,flexWrap:"wrap",alignItems:"center"}}><input style={{...inp,maxWidth:200}} placeholder="Search..." value={q} onChange={e=>setQ(e.target.value)}/><select style={{...inp,maxWidth:130}} value={fs} onChange={e=>setFs(e.target.value)}><option value="All">All statuses</option>{STATUSES.map(s=><option key={s}>{s}</option>)}</select><button style={{...mkBtn("#0a2540","#fff","#0a2540"),fontSize:12,marginLeft:"auto"}} onClick={()=>{setEI(null);setModal("taskForm");}}>+ Add Task</button></div>
      <div style={{background:T.card,borderRadius:12,border:"1px solid #dce6ef",overflow:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:720}}><thead><tr style={{background:"#f0f4f8"}}>{["Staff","Task","Type/Stage","Priority","Status","Progress","Deadline","Remarks",""].map(h=><th key={h} style={{padding:"8px 9px",textAlign:"left",fontWeight:600,color:T.dark,borderBottom:"1px solid #dce6ef",fontSize:11,whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead><tbody>
        {rows.length===0&&<tr><td colSpan={9} style={{padding:"20px",textAlign:"center",color:"#a0b0c0",fontSize:12}}>No tasks.</td></tr>}
        {rows.map(function(t,i){const od=t.deadline&&daysLeft(t.deadline)<0&&t.status!=="Done"&&t.status!=="Cancelled",sfObj=staff.find(x=>x.name===t.staff),avatarBg=sfObj?GA[sfObj.group]:T.blue;return(<tr key={t.id} style={{borderBottom:"1px solid #f0f4f8",background:i%2===0?"#fff":"#fafcfe"}}><td style={{padding:"6px 9px"}}><div style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:20,height:20,borderRadius:"50%",background:avatarBg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,color:"#fff",fontWeight:700,flexShrink:0}}>{ini(t.staff||"?")}</div>{t.staff}</div></td><td style={{padding:"6px 9px",maxWidth:150}}><div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:500,color:T.dark}}>{t.title}</div></td><td style={{padding:"6px 9px",fontSize:11,color:T.muted,whiteSpace:"nowrap"}}>{t.taskType||"—"}{t.stage?" / "+t.stage:""}</td><td style={{padding:"6px 9px"}}><span style={mkBdg(PB[t.priority],PC[t.priority])}>{t.priority}</span></td><td style={{padding:"6px 9px"}}><span style={mkBdg(SB[t.status],SC[t.status])}>{t.status}</span></td><td style={{padding:"6px 9px",minWidth:75}}><div style={{display:"flex",alignItems:"center",gap:4}}><div style={{flex:1,background:"#dce6ef",borderRadius:99,height:4,overflow:"hidden"}}><div style={{width:(t.progress||0)+"%",height:"100%",background:T.blue,borderRadius:99}}/></div><span style={{fontSize:10,fontWeight:600,color:T.muted}}>{t.progress||0}%</span></div></td><td style={{padding:"6px 9px",fontSize:11,color:od?T.red:T.muted,whiteSpace:"nowrap"}}>{fmt(t.deadline)}</td><td style={{padding:"6px 9px",fontSize:11,color:T.muted,maxWidth:140}}><div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.remarks||"—"}</div></td><td style={{padding:"6px 9px"}}><div style={{display:"flex",gap:3}}><button style={{...mkBtn(),padding:"2px 7px",fontSize:10}} onClick={()=>{setEI(t);setModal("taskForm");}}>Edit</button>{isSup&&<button style={{...mkBtn("#fdf2f2",T.red,"#e74c3c"),padding:"2px 7px",fontSize:10}} onClick={()=>delTask(t.id)}>Del</button>}</div></td></tr>);})}
      </tbody></table></div>
    </div>);
  };

  const AnalyticsPage=()=>{
    const all=tasks,tot=all.length,done=all.filter(t=>t.status==="Done").length,cancelled=all.filter(t=>t.status==="Cancelled").length,inprog=all.filter(t=>t.status==="In Progress").length,todo=all.filter(t=>t.status==="To Do"||t.status==="Scheduled").length;
    const onTime=all.filter(t=>t.status==="Done"&&(!t.deadline||daysLeft(t.deadline)>=0)).length;
    const overdue=all.filter(t=>t.status!=="Done"&&t.status!=="Cancelled"&&t.deadline&&daysLeft(t.deadline)<0).length;
    const compRate=tot?Math.round((done/tot)*100):0,onTimeRate=done?Math.round((onTime/done)*100):0;
    const totalCost=all.reduce((a,t)=>a+toNum(t.cost)+toNum(t.projectCost),0);
    const byStaff=staff.map(sf=>{const m=all.filter(t=>t.staff===sf.name);return{name:sf.name,group:sf.group,total:m.length,done:m.filter(t=>t.status==="Done").length,inprog:m.filter(t=>t.status==="In Progress").length,overdue:m.filter(t=>t.status!=="Done"&&t.status!=="Cancelled"&&t.deadline&&daysLeft(t.deadline)<0).length,avg:m.length?Math.round(m.reduce((a,t)=>a+(t.progress||0),0)/m.length):0,cost:m.reduce((a,t)=>a+toNum(t.cost)+toNum(t.projectCost),0)};}).sort((a,b)=>b.total-a.total);
    const byType={};all.forEach(t=>{const k=t.taskType||"Unclassified";byType[k]=(byType[k]||0)+1;});
    const typeEntries=Object.entries(byType).sort((a,b)=>b[1]-a[1]),maxType=typeEntries.length>0?typeEntries[0][1]:1;
    const recs=[];
    if(overdue>0)recs.push({icon:"!",title:"Address Overdue Tasks",text:overdue+" task(s) past deadline. Prioritize or reschedule.",color:"#fdf2f2",cl:T.red});
    if(compRate<50&&tot>5)recs.push({icon:"~",title:"Low Completion Rate",text:"Completion at "+compRate+"%. Consider redistributing workload.",color:"#fef9ec",cl:T.amber});
    if(onTimeRate<70&&done>3)recs.push({icon:"@",title:"Improve On-Time Delivery",text:"Only "+onTimeRate+"% completed on time. Strengthen deadline monitoring.",color:"#fef9ec",cl:T.amber});
    const busySf=byStaff.find(s=>s.inprog>4);if(busySf)recs.push({icon:"*",title:"Workload Imbalance",text:busySf.name+" has "+busySf.inprog+" active tasks. Consider redistribution.",color:"#eaf4fb",cl:T.blue});
    if(recs.length===0)recs.push({icon:"+",title:"On Track!",text:"All key metrics look healthy. Keep it up!",color:"#eafaf1",cl:T.green});
    const exportCSV=()=>{const rows=[["Staff","Task","Type","Stage","Priority","Status","Progress","Deadline","Cost","Remarks"],...all.map(t=>[t.staff,t.title,t.taskType||"",t.stage||"",t.priority,t.status,t.progress||0,t.deadline||"",toNum(t.cost)+toNum(t.projectCost),t.remarks||""])];const csv=rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(",")).join("\n");const a=document.createElement("a");a.href="data:text/csv;charset=utf-8,"+encodeURIComponent(csv);a.download="PPDO-PDD_Tasks.csv";a.click();toast$("CSV exported.");};
    const printReport=()=>{const sRows=byStaff.map(s=>"<tr><td>"+s.name+"</td><td>"+s.total+"</td><td>"+s.done+"</td><td>"+s.inprog+"</td><td>"+s.overdue+"</td><td>"+s.avg+"%</td><td>"+(s.cost>0?"₱"+s.cost.toLocaleString():"—")+"</td></tr>").join(""),tRows=typeEntries.map(function(e){return"<tr><td>"+e[0]+"</td><td>"+e[1]+"</td></tr>";}).join(""),aRows=all.map(t=>"<tr><td>"+t.staff+"</td><td>"+t.title+"</td><td>"+(t.taskType||"")+"</td><td>"+(t.stage||"")+"</td><td>"+t.status+"</td><td>"+(t.progress||0)+"%</td><td>"+fmt(t.deadline)+"</td><td>"+(t.remarks||"")+"</td></tr>").join(""),rHTML=recs.map(r=>"<p><b>"+r.title+":</b> "+r.text+"</p>").join("");const html="<!DOCTYPE html><html><head><title>PPDO-PDD Report</title><style>body{font-family:Arial,sans-serif;padding:32px;color:#1a2533}h1{color:#0a2540}h2{color:#0a2540;border-bottom:1px solid #dce6ef;padding-bottom:6px;margin-top:24px}table{width:100%;border-collapse:collapse;font-size:13px;margin-top:8px}th{background:#f0f4f8;padding:7px 10px;text-align:left;border:1px solid #dce6ef}td{padding:6px 10px;border:1px solid #dce6ef}.m{display:inline-block;background:#f0f4f8;border-radius:8px;padding:10px 16px;margin:4px}.ml{font-size:11px;color:#6b8099}.mv{font-size:20px;font-weight:700;color:#0a2540}</style></head><body><h1>"+APP+" Performance Report</h1><p>"+new Date().toLocaleDateString("en-PH",{weekday:"long",year:"numeric",month:"long",day:"numeric"})+"</p><h2>Summary</h2><div><div class='m'><div class='ml'>Total</div><div class='mv'>"+tot+"</div></div><div class='m'><div class='ml'>Completed</div><div class='mv'>"+done+"</div></div><div class='m'><div class='ml'>In Progress</div><div class='mv'>"+inprog+"</div></div><div class='m'><div class='ml'>Overdue</div><div class='mv'>"+overdue+"</div></div><div class='m'><div class='ml'>Completion</div><div class='mv'>"+compRate+"%</div></div><div class='m'><div class='ml'>On-Time</div><div class='mv'>"+onTimeRate+"%</div></div></div><h2>Staff Performance</h2><table><tr><th>Staff</th><th>Total</th><th>Done</th><th>Active</th><th>Overdue</th><th>Avg</th><th>Cost</th></tr>"+sRows+"</table><h2>Task Types</h2><table><tr><th>Type</th><th>Count</th></tr>"+tRows+"</table><h2>Recommendations</h2>"+rHTML+"<h2>All Tasks</h2><table><tr><th>Staff</th><th>Task</th><th>Type</th><th>Stage</th><th>Status</th><th>Progress</th><th>Deadline</th><th>Remarks</th></tr>"+aRows+"</table></body></html>";const w=window.open("","_blank");w.document.write(html);w.document.close();w.print();toast$("Report ready.");};
    return(<div style={wrap}>
      <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:14,alignItems:"center"}}><button style={{...mkBtn("#0a2540","#fff","#0a2540"),fontSize:12}} onClick={printReport}>Print / PDF</button><button style={{...mkBtn("#1e8449","#fff","#1e8449"),fontSize:12}} onClick={exportCSV}>Export CSV</button></div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:9,marginBottom:14}}>{[["Total",tot,"#e8f4fd","#1a4f7a"],["Completed",done,"#eafaf1","#1a5c2e"],["In Progress",inprog,"#fef9ec","#7d5a00"],["To Do",todo,"#f5eef8","#7d3c98"],["Overdue",overdue,"#fdf2f2","#7a1c1c"],["Cancelled",cancelled,"#f2f3f4","#5d6d7e"],["Completion",compRate+"%","#f0f4f8","#0a2540"],["On-Time",onTimeRate+"%","#eafaf1","#1a5c2e"]].map(function(item){return(<div key={item[0]} style={{background:item[2],borderRadius:10,padding:"10px 13px",border:"1px solid #dce6ef"}}><div style={{fontSize:10,color:item[3],fontWeight:500,marginBottom:1}}>{item[0]}</div><div style={{fontSize:20,fontWeight:700,color:item[3]}}>{item[1]}</div></div>);})}
        {totalCost>0&&<div style={{background:"#fef9ec",borderRadius:10,padding:"10px 13px",border:"1px solid #dce6ef"}}><div style={{fontSize:10,color:"#7d5a00",fontWeight:500,marginBottom:1}}>Total Cost</div><div style={{fontSize:16,fontWeight:700,color:"#7d5a00"}}>₱{totalCost.toLocaleString()}</div></div>}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
        <div style={{background:T.card,borderRadius:12,border:"1px solid #dce6ef",padding:"13px 14px"}}><div style={{fontSize:12,fontWeight:600,color:T.dark,marginBottom:10}}>Status Distribution</div>{STATUSES.map(function(s){const count=all.filter(t=>t.status===s).length,pct=tot?Math.round((count/tot)*100):0;return(<div key={s} style={{marginBottom:7}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}><span style={{fontSize:11,color:T.dark}}>{s}</span><span style={{fontSize:11,fontWeight:600,color:SC[s]}}>{count} ({pct}%)</span></div><div style={{background:"#dce6ef",borderRadius:99,height:7,overflow:"hidden"}}><div style={{width:pct+"%",height:"100%",background:SC[s],borderRadius:99}}/></div></div>);})}</div>
        <div style={{background:T.card,borderRadius:12,border:"1px solid #dce6ef",padding:"13px 14px"}}><div style={{fontSize:12,fontWeight:600,color:T.dark,marginBottom:10}}>Task Type Breakdown</div>{typeEntries.slice(0,8).map(function(entry){const pct=Math.round((entry[1]/maxType)*100);return(<div key={entry[0]} style={{marginBottom:6}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}><span style={{fontSize:11,color:T.dark}}>{entry[0]}</span><span style={{fontSize:11,fontWeight:600,color:T.blue}}>{entry[1]}</span></div><div style={{background:"#dce6ef",borderRadius:99,height:6,overflow:"hidden"}}><div style={{width:pct+"%",height:"100%",background:T.blue,borderRadius:99}}/></div></div>);})}</div>
      </div>
      <div style={{background:T.card,borderRadius:12,border:"1px solid #dce6ef",padding:"13px 14px",marginBottom:14}}><div style={{fontSize:12,fontWeight:600,color:T.dark,marginBottom:10}}>Staff Performance</div><div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:560}}><thead><tr style={{background:"#f0f4f8"}}>{["Staff","Group","Total","Done","Active","Overdue","Avg","Cost"].map(h=><th key={h} style={{padding:"7px 9px",textAlign:"left",fontWeight:600,color:T.dark,borderBottom:"1px solid #dce6ef",fontSize:11}}>{h}</th>)}</tr></thead><tbody>{byStaff.map(function(s,i){const gObj=GM[s.group];return(<tr key={s.name} style={{borderBottom:"1px solid #f0f4f8",background:i%2===0?"#fff":"#fafcfe"}}><td style={{padding:"6px 9px",fontWeight:500}}><div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:22,height:22,borderRadius:"50%",background:GA[s.group]||"#888",display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,color:"#fff",fontWeight:700}}>{ini(s.name)}</div>{s.name}</div></td><td style={{padding:"6px 9px",fontSize:11}}><span style={mkBdg((GA[s.group]||"#888")+"22",GA[s.group]||"#888")}>{gObj?gObj.label:s.group}</span></td><td style={{padding:"6px 9px",fontWeight:600,color:T.blue}}>{s.total}</td><td style={{padding:"6px 9px",fontWeight:600,color:T.green}}>{s.done}</td><td style={{padding:"6px 9px",color:T.amber}}>{s.inprog}</td><td style={{padding:"6px 9px",color:s.overdue>0?T.red:T.muted}}>{s.overdue}</td><td style={{padding:"6px 9px",minWidth:80}}><div style={{display:"flex",alignItems:"center",gap:5}}><div style={{flex:1,background:"#dce6ef",borderRadius:99,height:5,overflow:"hidden"}}><div style={{width:s.avg+"%",height:"100%",background:s.avg>=80?T.green:s.avg>=40?T.amber:T.blue,borderRadius:99}}/></div><span style={{fontSize:10,fontWeight:600}}>{s.avg}%</span></div></td><td style={{padding:"6px 9px",fontSize:11,color:T.muted}}>{s.cost>0?"₱"+s.cost.toLocaleString():"—"}</td></tr>);})}</tbody></table></div></div>
      <div style={{background:T.card,borderRadius:12,border:"1px solid #dce6ef",padding:"13px 14px"}}><div style={{fontSize:12,fontWeight:600,color:T.dark,marginBottom:10}}>AI-Powered Recommendations</div><div style={{display:"grid",gap:8}}>{recs.map(function(r,i){return(<div key={i} style={{background:r.color,borderRadius:8,padding:"10px 12px",border:"1px solid "+r.cl+"33"}}><div style={{fontSize:12,fontWeight:600,color:r.cl,marginBottom:2}}>{r.icon} {r.title}</div><div style={{fontSize:11,color:T.text,lineHeight:1.5}}>{r.text}</div></div>);})}</div></div>
    </div>);
  };

  const RequestsPage=()=>(<div style={wrap}><h3 style={{fontSize:14,fontWeight:600,color:T.dark,marginBottom:10}}>Pending Approvals</h3>{requests.length===0&&<div style={{background:T.card,borderRadius:10,border:"1px solid #dce6ef",padding:"28px",textAlign:"center",color:T.muted,fontSize:13}}>No pending approvals.</div>}{requests.map(r=>(<div key={r.id} style={{background:T.card,borderRadius:10,border:"1px solid #dce6ef",padding:"12px 14px",marginBottom:9}}><div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:8}}><div><div style={{fontSize:13,fontWeight:600,color:T.dark,marginBottom:2}}>{r.task.title}</div><div style={{fontSize:11,color:T.muted}}>{r.type==="forward"?"Forward":"Approval"} · From: {r.from}{r.to?" to "+r.to:""}</div>{r.task.description&&<div style={{fontSize:11,color:T.muted,marginTop:1}}>{r.task.description}</div>}{r.task.cost&&<div style={{fontSize:11,color:T.muted}}>Cost: ₱{toNum(r.task.cost).toLocaleString()}</div>}</div><div style={{display:"flex",gap:6}}><button style={{...mkBtn("#eafaf1",T.green,"#1e8449"),fontSize:12}} onClick={()=>{approveReq(r.id);toast$("Approved.");}}>Approve</button><button style={{...mkBtn("#fdf2f2",T.red,"#e74c3c"),fontSize:12}} onClick={()=>{rejectReq(r.id);toast$("Rejected.");}}>Reject</button></div></div></div>))}</div>);

  const MyWorkPage=()=>{const mine=supTasks,avg=mine.length?Math.round(mine.reduce((a,t)=>a+(t.progress||0),0)/mine.length):0;return(<div style={wrap}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:11,flexWrap:"wrap",gap:7}}><h3 style={{fontSize:14,fontWeight:600,color:T.dark,margin:0}}>My Tasks</h3><button style={{...mkBtn("#0a2540","#fff","#0a2540"),fontSize:12}} onClick={()=>{setEI(null);setModal("supTaskForm");}}>+ Add My Task</button></div><CountdownWidget/><div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:11}}>{[["Total",mine.length,"#e8f4fd","#1a4f7a"],["Active",mine.filter(t=>t.status==="In Progress").length,"#fef9ec","#7d5a00"],["Done",mine.filter(t=>t.status==="Done").length,"#eafaf1","#1a5c2e"],["Avg",avg+"%","#f0f4f8","#0a2540"]].map(function(item){return(<div key={item[0]} style={{background:item[2],borderRadius:9,padding:"9px 12px",minWidth:65}}><div style={{fontSize:9,color:item[3],marginBottom:1}}>{item[0]}</div><div style={{fontSize:19,fontWeight:700,color:item[3]}}>{item[1]}</div></div>);})}</div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))",gap:9}}>{STATUSES.map(col=>{const ct=mine.filter(t=>t.status===col);return(<div key={col} style={{background:"#f7f9fc",borderRadius:10,border:"1px solid #dce6ef",padding:"9px 8px"}}><div style={{display:"flex",alignItems:"center",gap:5,marginBottom:6}}><div style={{width:7,height:7,borderRadius:"50%",background:SC[col]}}/><span style={{fontSize:11,fontWeight:600,color:T.dark}}>{col}</span><span style={{marginLeft:"auto",fontSize:10,background:SB[col],color:SC[col],borderRadius:20,padding:"1px 6px",fontWeight:600}}>{ct.length}</span></div>{ct.map(t=><div key={t.id} style={{background:T.card,borderRadius:8,border:"1px solid #dce6ef",padding:"8px 9px",marginBottom:6}}><div style={{fontSize:12,fontWeight:500,color:T.dark,marginBottom:2}}>{t.title}</div>{t.taskType&&<div style={{fontSize:10,color:T.blue,marginBottom:2}}>{t.taskType}</div>}<PBar pct={t.progress||0}/><div style={{display:"flex",gap:4,marginTop:5,flexWrap:"wrap"}}><button style={{...mkBtn(),padding:"2px 7px",fontSize:10}} onClick={()=>{setEI(t);setModal("supTaskForm");}}>Edit</button><button style={{...mkBtn("#fdf2f2",T.red,"#e74c3c"),padding:"2px 7px",fontSize:10}} onClick={()=>delSupTask(t.id)}>Del</button></div></div>)}{ct.length===0&&<div style={{fontSize:10,color:"#a0b0c0",textAlign:"center",padding:"12px 0"}}>—</div>}</div>);})}</div></div>);};

  const ELAPage=()=>(<div style={wrap}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:11}}><h3 style={{fontSize:14,fontWeight:600,color:T.dark,margin:0}}>ELA / {ela.acronym} Targets</h3><button style={{...mkBtn("#7d3c98","#fff","#7d3c98"),fontSize:12}} onClick={()=>setModal("ela")}>Manage Targets</button></div>{(!ela.targets||ela.targets.length===0)&&<div style={{background:T.card,borderRadius:10,border:"1px solid #dce6ef",padding:"28px",textAlign:"center",color:T.muted,fontSize:13}}>No targets yet.</div>}<div style={{display:"grid",gap:9}}>{(ela.targets||[]).map(function(t){const dl=t.deadline?daysLeft(t.deadline):null,cl=t.status==="Completed"?T.green:t.status==="In Progress"?T.amber:"#7d3c98",bg=t.status==="Completed"?"#eafaf1":t.status==="In Progress"?"#fef9ec":"#f5eef8";let dlStr="";if(dl!==null){dlStr=dl<0?" (overdue)":" ("+dl+"d left)";}return(<div key={t.id} style={{background:T.card,borderRadius:10,border:"1px solid #dce6ef",padding:"12px 14px"}}><div style={{display:"flex",justifyContent:"space-between",gap:8,flexWrap:"wrap"}}><div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:T.dark,marginBottom:2}}>{t.title}</div><div style={{fontSize:11,color:T.muted}}>Assigned: {t.assignedTo||"—"} · Deadline: {fmt(t.deadline)}{dlStr}</div></div><span style={mkBdg(bg,cl)}>{t.status}</span></div></div>);})}</div></div>);

  const GoalsPage=()=>{const [pf,setPf]=useState("All"),rows=pf==="All"?goals:goals.filter(g=>g.period===pf),sc={Completed:T.green,"In Progress":T.amber,Cancelled:T.muted,"Not Started":T.blue},sb={Completed:"#eafaf1","In Progress":"#fef9ec",Cancelled:"#f2f3f4","Not Started":"#eaf4fb"};return(<div style={wrap}><div style={{display:"flex",gap:6,alignItems:"center",marginBottom:11,flexWrap:"wrap"}}>{["All","Monthly","Quarterly"].map(p=><button key={p} style={{...mkBtn(pf===p?"#0a2540":"#fff",pf===p?"#fff":T.text,pf===p?"#0a2540":"#dce6ef"),fontSize:11,padding:"4px 10px"}} onClick={()=>setPf(p)}>{p}</button>)}<button style={{...mkBtn("#0a2540","#fff","#0a2540"),fontSize:12,marginLeft:"auto"}} onClick={()=>{setEI(null);setModal("goalForm");}}>+ Add Goal</button></div>{rows.length===0&&<div style={{background:T.card,borderRadius:10,border:"1px solid #dce6ef",padding:"28px",textAlign:"center",color:T.muted,fontSize:13}}>No goals yet.</div>}<div style={{display:"grid",gap:9}}>{rows.map(function(g){const cl=sc[g.status]||T.blue,bg=sb[g.status]||"#eaf4fb";return(<div key={g.id} style={{background:T.card,borderRadius:10,border:"1px solid #dce6ef",padding:"12px 14px"}}><div style={{display:"flex",justifyContent:"space-between",gap:8,flexWrap:"wrap",marginBottom:7}}><div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:T.dark,marginBottom:2}}>{g.goalTitle}</div>{g.description&&<div style={{fontSize:11,color:T.muted,marginBottom:2}}>{g.description}</div>}<div style={{fontSize:11,color:T.muted}}>{g.period} · {g.month||g.quarter} {g.year}{g.assignedTo?" · "+g.assignedTo:""} · Deadline: {fmt(g.deadline)}</div></div><div style={{display:"flex",gap:5,alignItems:"flex-start"}}><span style={mkBdg(bg,cl)}>{g.status}</span><button style={{...mkBtn(),padding:"2px 7px",fontSize:10}} onClick={()=>{setEI(g);setModal("goalForm");}}>Edit</button><button style={{...mkBtn("#fdf2f2",T.red,"#e74c3c"),padding:"2px 7px",fontSize:10}} onClick={()=>delGoal(g.id)}>Del</button></div></div><PBar pct={g.progress||0}/><div style={{fontSize:10,color:T.muted,marginTop:2}}>{g.progress||0}% complete</div></div>);})}</div></div>);};

  const ActivityLogPage=()=>(<div style={wrap}><h3 style={{fontSize:14,fontWeight:600,color:T.dark,marginBottom:9}}>Activity Log</h3><div style={{background:T.card,borderRadius:12,border:"1px solid #dce6ef",overflow:"hidden"}}>{log.length===0&&<div style={{padding:"24px",textAlign:"center",color:T.muted,fontSize:12}}>No activity yet.</div>}{log.slice(0,100).map(function(l,i){const sfObj=staff.find(x=>x.name===l.who),avatarBg=sfObj?GA[sfObj.group]:"#0a2540",label=l.who==="Supervisor"?"SU":(l.who||"?");return(<div key={l.id||i} style={{display:"flex",gap:9,padding:"7px 13px",borderBottom:"1px solid #f0f4f8",alignItems:"center"}}><div style={{width:26,height:26,borderRadius:"50%",background:avatarBg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#fff",fontWeight:700,flexShrink:0}}>{ini(label)}</div><div style={{flex:1}}><span style={{fontSize:12,fontWeight:500,color:T.dark}}>{l.who}</span><span style={{fontSize:12,color:T.muted}}> {l.action} </span><span style={{fontSize:12,color:T.blue}}>{l.title}</span></div><div style={{fontSize:10,color:T.muted,flexShrink:0}}>{new Date(l.at).toLocaleDateString("en-PH",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}</div></div>);})}</div></div>);

  const ptitle={dashboard:"Dashboard",staff:activeStaff||"Staff",kanban:"Kanban Board",tasklog:"All Tasks",analytics:"Analytics & Performance",goals:"Goal Tracker",ela:"ELA / "+ela.acronym,requests:"Pending Approvals",mywork:"My Tasks",actlog:"Activity Log"};
  const renderPage=()=>{
    if(!isSup)return page==="goals"?<GoalsPage/>:<StaffPage/>;
    if(page==="dashboard")return <DashPage/>;if(page==="staff")return <StaffPage/>;if(page==="kanban")return <KanbanPage/>;if(page==="tasklog")return <TaskLogPage/>;if(page==="analytics")return <AnalyticsPage/>;if(page==="goals")return <GoalsPage/>;if(page==="ela")return <ELAPage/>;if(page==="requests")return <RequestsPage/>;if(page==="mywork")return <MyWorkPage/>;if(page==="actlog")return <ActivityLogPage/>;
    return <DashPage/>;
  };

  return(<div style={{fontFamily:"system-ui,-apple-system,sans-serif",minHeight:"100vh",background:T.bg,color:T.text}}>
    {side&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.28)",zIndex:99}} onClick={()=>setSide(false)}/>}
    <Sidebar/><Topbar title={ptitle[page]||""}/> {renderPage()}
    {modal==="taskForm"&&<TaskFormModal forStaff={page==="staff"?activeStaff:null}/>}
    {modal==="supTaskForm"&&<TaskFormModal isSuperTask={true}/>}
    {modal==="forward"&&<ForwardModal/>}
    {modal==="ela"&&isSup&&<ELAModal/>}
    {modal==="goalForm"&&<GoalModal/>}
    {modal==="pinmgmt"&&isSup&&<PinModal/>}
    {modal==="staffmgmt"&&isSup&&<StaffModal/>}
    {toast&&<div style={{position:"fixed",bottom:18,left:"50%",transform:"translateX(-50%)",background:"#0a2540",color:"#fff",borderRadius:8,padding:"8px 18px",fontSize:13,zIndex:300,boxShadow:"0 4px 16px rgba(0,0,0,.18)",whiteSpace:"nowrap"}}>{toast}</div>}
  </div>);
}

function LoginScreen({staff,pins,onLogin,inp,mkBtn,T,APP}){
  const [who,setWho]=useState(""),[pin,setPin]=useState(""),[ err,setErr]=useState("");
  const go=()=>{if(!who){setErr("Select an account.");return;}const k=who==="supervisor"?"supervisor":who;if((pins[k]||"1234")===pin){setErr("");onLogin(who);}else setErr("Incorrect PIN.");};
  return(<div style={{minHeight:"100vh",background:"#f0f4f8",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}><div style={{background:"#fff",borderRadius:16,padding:"26px 22px",width:"100%",maxWidth:330,boxShadow:"0 4px 24px rgba(0,0,0,.08)",border:"1px solid #dce6ef"}}><div style={{textAlign:"center",marginBottom:20}}><div style={{width:46,height:46,borderRadius:12,background:"#0a2540",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 9px",fontSize:14,color:"#7ecfff",fontWeight:700}}>PDD</div><div style={{fontSize:17,fontWeight:700,color:"#0a2540"}}>{APP}</div><div style={{fontSize:11,color:T.muted,marginTop:2}}>Province of Agusan del Norte</div></div><div style={{display:"grid",gap:8}}><select style={inp} value={who} onChange={e=>{setWho(e.target.value);setPin("");setErr("");}}><option value="">Select account</option><option value="supervisor">Supervisor — Waylon</option>{(staff||[]).map(x=><option key={x.name} value={x.name}>{x.name} ({x.role})</option>)}</select><input style={inp} type="password" placeholder="Enter PIN" maxLength={6} value={pin} onChange={e=>{setPin(e.target.value);setErr("");}} onKeyDown={e=>e.key==="Enter"&&go()}/>{err&&<div style={{fontSize:12,color:"#c0392b",textAlign:"center"}}>{err}</div>}<button style={{...mkBtn("#0a2540","#fff","#0a2540"),width:"100%",padding:"10px"}} onClick={go}>Sign In</button></div><div style={{marginTop:12,fontSize:11,color:T.muted,textAlign:"center"}}>Default: Supervisor <b>0000</b> · Staff <b>1234</b></div></div></div>);
}
