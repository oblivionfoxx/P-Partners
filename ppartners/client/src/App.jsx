import { useState, useEffect, useRef, useCallback } from "react";
import "./index.css";

// ── helpers ──────────────────────────────────────────────────────────────────
const SUBJECTS = ["Mathematics","Physics","Chemistry","Biology","History","Literature","Computer Science","Economics","Philosophy","Languages","Art","Music","Engineering","Law","Medicine"];
const LANGUAGES = ["English","Spanish","French","German","Japanese","Mandarin","Arabic","Portuguese","Korean","Italian","Hindi","Russian"];
const COUNTRIES = ["United States","United Kingdom","Germany","France","Japan","Brazil","India","Canada","Australia","South Korea","Spain","Mexico","Pakistan","Turkey","Nigeria"];
const EDU_LEVELS = ["High School","Undergraduate","Graduate","PhD","Self-Learner","Professional"];

const BADGES = [
  { id:"first_session", name:"First Steps",    desc:"Complete first study session", icon:"🌱" },
  { id:"streak_7",      name:"Week Warrior",   desc:"7-day study streak",           icon:"🔥" },
  { id:"streak_30",     name:"Monthly Master", desc:"30-day streak",                icon:"⚡" },
  { id:"hours_10",      name:"Dedicated",      desc:"10 hours studied",             icon:"📚" },
  { id:"hours_100",     name:"Scholar",        desc:"100 hours studied",            icon:"🎓" },
  { id:"matches_5",     name:"Connector",      desc:"5 study matches",              icon:"🤝" },
  { id:"game_master",   name:"Game Master",    desc:"Score 100 in a game",          icon:"🏆" },
  { id:"polyglot",      name:"Polyglot",       desc:"Practice 3 languages",         icon:"🌍" },
];

const MOCK_PROFILES = [
  { id:"p1", name:"Aiko Tanaka",   country:"Japan",       educationLevel:"Graduate",     subjects:["Mathematics","Physics"],          languages:["Japanese","English"],            bio:"Passionate about quantum mechanics!",                studyHours:87,  studyStreak:14, badges:["first_session","streak_7","hours_10"],                         color:"#FF6B6B", emoji:"🌸" },
  { id:"p2", name:"Marco Silva",   country:"Brazil",      educationLevel:"Undergraduate",subjects:["Literature","History"],           languages:["Portuguese","Spanish","English"],bio:"History buff and literature enthusiast.",            studyHours:42,  studyStreak:5,  badges:["first_session"],                                              color:"#4ECDC4", emoji:"🌴" },
  { id:"p3", name:"Sofia Müller",  country:"Germany",     educationLevel:"PhD",          subjects:["Chemistry","Biology"],            languages:["German","English","French"],     bio:"Biochemistry researcher. Love complex concepts!",   studyHours:203, studyStreak:45, badges:["first_session","streak_7","streak_30","hours_10","hours_100"],color:"#A29BFE", emoji:"🔬" },
  { id:"p4", name:"James Park",    country:"South Korea", educationLevel:"Undergraduate",subjects:["Computer Science","Mathematics"], languages:["Korean","English"],              bio:"CS student focusing on ML and algorithms.",          studyHours:156, studyStreak:21, badges:["first_session","streak_7","hours_10","game_master"],           color:"#FDCB6E", emoji:"💻" },
  { id:"p5", name:"Priya Sharma",  country:"India",       educationLevel:"Graduate",     subjects:["Economics","Mathematics"],        languages:["Hindi","English"],               bio:"Econometrics and data science enthusiast.",          studyHours:98,  studyStreak:12, badges:["first_session","streak_7","hours_10"],                         color:"#55EFC4", emoji:"📊" },
  { id:"p6", name:"Luca Romano",   country:"Spain",       educationLevel:"Undergraduate",subjects:["Art","Philosophy"],              languages:["Italian","Spanish","English"],   bio:"Art history and aesthetics lover.",                  studyHours:61,  studyStreak:8,  badges:["first_session","streak_7"],                                   color:"#FD79A8", emoji:"🎨" },
];

const STUDY_ROOMS = [
  { id:"r1", name:"Calculus Collective",    category:"Mathematics",     participants:12, maxP:20, icon:"∑",  color:"#6c63ff", online:true  },
  { id:"r2", name:"Code & Coffee",          category:"Computer Science",participants:8,  maxP:15, icon:"⌨",  color:"#43e97b", online:true  },
  { id:"r3", name:"History Circle",         category:"History",         participants:5,  maxP:10, icon:"📜", color:"#f7971e", online:true  },
  { id:"r4", name:"Language Lab: Spanish",  category:"Languages",       participants:15, maxP:25, icon:"🗣", color:"#FF6B6B", online:true  },
  { id:"r5", name:"Physics Frontier",       category:"Physics",         participants:7,  maxP:12, icon:"⚛",  color:"#4ECDC4", online:false },
  { id:"r6", name:"Writers Workshop",       category:"Literature",      participants:9,  maxP:15, icon:"✍",  color:"#A29BFE", online:true  },
  { id:"r7", name:"Bio Lab Discussions",    category:"Biology",         participants:4,  maxP:10, icon:"🧬", color:"#FDCB6E", online:false },
  { id:"r8", name:"Econ & Finance Hub",     category:"Economics",       participants:11, maxP:20, icon:"📈", color:"#55EFC4", online:true  },
];

const VOCAB_DATA = {
  Spanish: [
    {word:"Mariposa",answer:"Butterfly"},{word:"Cielo",answer:"Sky"},{word:"Lluvia",answer:"Rain"},
    {word:"Amigo",answer:"Friend"},{word:"Libro",answer:"Book"},{word:"Casa",answer:"House"},
    {word:"Perro",answer:"Dog"},{word:"Gato",answer:"Cat"},{word:"Agua",answer:"Water"},{word:"Fuego",answer:"Fire"},
  ],
  French: [
    {word:"Papillon",answer:"Butterfly"},{word:"Ciel",answer:"Sky"},{word:"Pluie",answer:"Rain"},
    {word:"Ami",answer:"Friend"},{word:"Livre",answer:"Book"},{word:"Maison",answer:"House"},
    {word:"Chien",answer:"Dog"},{word:"Chat",answer:"Cat"},{word:"Eau",answer:"Water"},{word:"Feu",answer:"Fire"},
  ],
  Japanese: [
    {word:"蝶 (chō)",answer:"Butterfly"},{word:"空 (sora)",answer:"Sky"},{word:"雨 (ame)",answer:"Rain"},
    {word:"友達 (tomodachi)",answer:"Friend"},{word:"本 (hon)",answer:"Book"},{word:"家 (ie)",answer:"House"},
    {word:"犬 (inu)",answer:"Dog"},{word:"猫 (neko)",answer:"Cat"},{word:"水 (mizu)",answer:"Water"},{word:"火 (hi)",answer:"Fire"},
  ],
  German: [
    {word:"Schmetterling",answer:"Butterfly"},{word:"Himmel",answer:"Sky"},{word:"Regen",answer:"Rain"},
    {word:"Freund",answer:"Friend"},{word:"Buch",answer:"Book"},{word:"Haus",answer:"House"},
    {word:"Hund",answer:"Dog"},{word:"Katze",answer:"Cat"},{word:"Wasser",answer:"Water"},{word:"Feuer",answer:"Fire"},
  ],
};

const shuffle = arr => [...arr].sort(() => Math.random() - 0.5);
const genId   = () => Math.random().toString(36).substr(2, 9);
const getInitials = name => name.split(" ").map(n => n[0]).join("").toUpperCase();

// ── Avatar ────────────────────────────────────────────────────────────────────
const Avatar = ({ user, size = 40 }) => {
  const colors = ["#6c63ff","#ff6584","#43e97b","#f7971e","#4ECDC4","#A29BFE","#FDCB6E","#FF6B6B"];
  const color  = user?.color || colors[(user?.name?.charCodeAt(0) || 0) % colors.length];
  return (
    <div style={{
      width:size, height:size, borderRadius:"50%",
      background:`linear-gradient(135deg,${color},${color}99)`,
      display:"flex", alignItems:"center", justifyContent:"center",
      fontFamily:"Syne,sans-serif", fontWeight:700, fontSize:size*0.35,
      color:"white", flexShrink:0, boxShadow:`0 4px 12px ${color}44`,
    }}>
      {user?.emoji || getInitials(user?.name || "?")}
    </div>
  );
};

// ── Notification system ───────────────────────────────────────────────────────
let _setNotif = null;
const notify = (msg, type = "info", icon = "💬") => {
  if (_setNotif) _setNotif({ msg, type, icon, id: genId() });
};

const NotificationToast = () => {
  const [notif, setNotif] = useState(null);
  _setNotif = setNotif;
  useEffect(() => {
    if (!notif) return;
    const t = setTimeout(() => setNotif(null), 3500);
    return () => clearTimeout(t);
  }, [notif]);
  if (!notif) return null;
  const colors = { info:"var(--accent)", success:"var(--accent3)", error:"var(--accent2)", warning:"var(--accent4)" };
  return (
    <div className="notification" style={{ borderLeft:`3px solid ${colors[notif.type]}` }}>
      <span style={{ fontSize:24 }}>{notif.icon}</span>
      <div style={{ fontWeight:500, fontSize:14 }}>{notif.msg}</div>
      <button onClick={() => setNotif(null)} style={{ background:"none", color:"var(--text3)", marginLeft:"auto", fontSize:18 }}>×</button>
    </div>
  );
};

// ── Auth ──────────────────────────────────────────────────────────────────────
const AuthScreen = ({ onLogin }) => {
  const [mode, setMode]     = useState("login");
  const [step, setStep]     = useState(1);
  const [form, setForm]     = useState({ name:"", email:"", password:"", country:"", educationLevel:"", subjects:[], languages:[], bio:"" });
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");

  const toggleSubject = s => setForm(f => ({ ...f, subjects: f.subjects.includes(s) ? f.subjects.filter(x=>x!==s) : [...f.subjects, s] }));
  const toggleLang    = l => setForm(f => ({ ...f, languages: f.languages.includes(l) ? f.languages.filter(x=>x!==l) : [...f.languages, l] }));

  const handleSubmit = () => {
    setLoading(true); setError("");
    setTimeout(() => {
      if (mode === "login") {
        if (!form.email || !form.password) { setError("Please fill all fields"); setLoading(false); return; }
        onLogin({ id:"u1", name: form.email.split("@")[0], email:form.email, country:"United States", educationLevel:"Undergraduate", subjects:["Mathematics","Computer Science"], languages:["English"], bio:"", studyHours:24, studyStreak:3, badges:["first_session"], color:"#6c63ff", emoji:"⭐" });
      } else {
        if (step < 3) { setStep(s=>s+1); setLoading(false); return; }
        if (!form.name || !form.email) { setError("Please fill required fields"); setLoading(false); return; }
        onLogin({ id:"u1", ...form, studyHours:0, studyStreak:0, badges:[], color:"#6c63ff", emoji:"⭐" });
      }
      setLoading(false);
    }, 800);
  };

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--bg)", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:"10%", left:"5%",  width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle,rgba(108,99,255,.15),transparent 70%)", pointerEvents:"none" }}/>
      <div style={{ position:"absolute", bottom:"10%", right:"5%", width:300, height:300, borderRadius:"50%", background:"radial-gradient(circle,rgba(255,101,132,.12),transparent 70%)", pointerEvents:"none" }}/>

      <div style={{ width:"100%", maxWidth:440, padding:"0 20px" }} className="fade-up">
        <div style={{ textAlign:"center", marginBottom:40 }}>
          <div style={{ width:64, height:64, borderRadius:18, background:"linear-gradient(135deg,var(--accent),#8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, margin:"0 auto 16px", boxShadow:"0 8px 32px rgba(108,99,255,.4)" }}>🎓</div>
          <h1 className="syne" style={{ fontSize:28, fontWeight:800 }}>P Partners</h1>
          <p style={{ color:"var(--text2)", fontSize:14, marginTop:6 }}>Global collaborative learning platform</p>
        </div>

        <div className="card" style={{ padding:32 }}>
          <div style={{ display:"flex", background:"var(--bg3)", borderRadius:12, padding:4, marginBottom:28 }}>
            {["login","signup"].map(m => (
              <button key={m} onClick={() => { setMode(m); setStep(1); setError(""); }} style={{ flex:1, padding:"8px 0", borderRadius:9, fontWeight:600, fontSize:14, transition:"all .2s", background:mode===m?"var(--card2)":"transparent", color:mode===m?"var(--text)":"var(--text2)", boxShadow:mode===m?"0 2px 8px rgba(0,0,0,.3)":"none" }}>
                {m === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          {error && <div style={{ background:"rgba(255,101,132,.1)", border:"1px solid rgba(255,101,132,.3)", borderRadius:10, padding:"10px 14px", marginBottom:16, color:"#ff6584", fontSize:14 }}>{error}</div>}

          {mode === "login" ? (
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div><label style={{ fontSize:13, color:"var(--text2)", marginBottom:6, display:"block" }}>Email</label>
                <input className="input-field" type="email" placeholder="you@university.edu" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}/></div>
              <div><label style={{ fontSize:13, color:"var(--text2)", marginBottom:6, display:"block" }}>Password</label>
                <input className="input-field" type="password" placeholder="••••••••" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))}/></div>
              <button className="btn-primary" onClick={handleSubmit} disabled={loading} style={{ marginTop:8, opacity:loading?.7:1 }}>{loading?"Signing in...":"Sign In"}</button>
              <div style={{ textAlign:"center", fontSize:13, color:"var(--text2)" }}>Demo: any email + password works</div>
            </div>
          ) : (
            <div>
              <div style={{ display:"flex", gap:6, marginBottom:24 }}>
                {[1,2,3].map(s => <div key={s} style={{ flex:1, height:4, borderRadius:2, background:step>=s?"var(--accent)":"var(--border)", transition:"background .3s" }}/>)}
              </div>
              {step===1 && (
                <div style={{ display:"flex", flexDirection:"column", gap:14 }} className="fade-up">
                  <div style={{ fontSize:13, color:"var(--text2)", marginBottom:4 }}>Basic Information</div>
                  <input className="input-field" placeholder="Full Name *" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/>
                  <input className="input-field" type="email" placeholder="Email Address *" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}/>
                  <input className="input-field" type="password" placeholder="Password *" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))}/>
                  <select className="input-field" value={form.country} onChange={e=>setForm(f=>({...f,country:e.target.value}))}>
                    <option value="">Select Country</option>{COUNTRIES.map(c=><option key={c}>{c}</option>)}
                  </select>
                  <select className="input-field" value={form.educationLevel} onChange={e=>setForm(f=>({...f,educationLevel:e.target.value}))}>
                    <option value="">Education Level</option>{EDU_LEVELS.map(l=><option key={l}>{l}</option>)}
                  </select>
                </div>
              )}
              {step===2 && (
                <div className="fade-up">
                  <div style={{ fontSize:13, color:"var(--text2)", marginBottom:12 }}>Select subjects (up to 5)</div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:20 }}>
                    {SUBJECTS.map(s => (
                      <button key={s} onClick={()=>toggleSubject(s)} style={{ padding:"6px 14px", borderRadius:8, fontSize:13, fontWeight:500, background:form.subjects.includes(s)?"rgba(108,99,255,.2)":"var(--bg3)", color:form.subjects.includes(s)?"var(--accent)":"var(--text2)", border:form.subjects.includes(s)?"1px solid rgba(108,99,255,.4)":"1px solid var(--border)", transition:"all .15s" }}>{s}</button>
                    ))}
                  </div>
                  <div style={{ fontSize:13, color:"var(--text2)", marginBottom:12 }}>Languages you speak</div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                    {LANGUAGES.map(l => (
                      <button key={l} onClick={()=>toggleLang(l)} style={{ padding:"6px 14px", borderRadius:8, fontSize:13, fontWeight:500, background:form.languages.includes(l)?"rgba(67,233,123,.15)":"var(--bg3)", color:form.languages.includes(l)?"var(--accent3)":"var(--text2)", border:form.languages.includes(l)?"1px solid rgba(67,233,123,.3)":"1px solid var(--border)", transition:"all .15s" }}>{l}</button>
                    ))}
                  </div>
                </div>
              )}
              {step===3 && (
                <div style={{ display:"flex", flexDirection:"column", gap:14 }} className="fade-up">
                  <div style={{ fontSize:13, color:"var(--text2)" }}>Almost done! Tell us about yourself</div>
                  <textarea className="input-field" rows={4} placeholder="Bio – what do you want to learn? What can you teach?" value={form.bio} onChange={e=>setForm(f=>({...f,bio:e.target.value}))} style={{ resize:"none" }}/>
                  <div style={{ background:"rgba(108,99,255,.08)", border:"1px solid rgba(108,99,255,.2)", borderRadius:10, padding:14, fontSize:13, color:"var(--text2)" }}>
                    🎉 You're about to join <strong style={{color:"var(--text)"}}>P Partners</strong> — a global study community.
                  </div>
                </div>
              )}
              <button className="btn-primary" onClick={handleSubmit} disabled={loading} style={{ width:"100%", marginTop:20, opacity:loading?.7:1 }}>
                {loading ? "..." : step < 3 ? "Continue →" : "Create Account 🚀"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Sidebar ───────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id:"dashboard", icon:"🏠", label:"Dashboard"      },
  { id:"random",    icon:"⚡", label:"Random Match"   },
  { id:"swipe",     icon:"💫", label:"Discover"       },
  { id:"rooms",     icon:"🏛", label:"Study Rooms"    },
  { id:"messages",  icon:"💬", label:"Messages"       },
  { id:"games",     icon:"🎮", label:"Language Games" },
  { id:"profile",   icon:"👤", label:"Profile"        },
];

const Sidebar = ({ user, page, onNav, matches }) => {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <aside style={{ width:collapsed?70:220, flexShrink:0, background:"var(--bg2)", borderRight:"1px solid var(--border)", display:"flex", flexDirection:"column", padding:"20px 12px", transition:"width .3s ease", overflow:"hidden", position:"relative", zIndex:10 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:28, paddingLeft:4 }}>
        {!collapsed && <span className="syne" style={{ fontWeight:800, fontSize:18, whiteSpace:"nowrap" }}>P Partners</span>}
        <button onClick={()=>setCollapsed(c=>!c)} style={{ background:"none", color:"var(--text2)", fontSize:18, padding:4, borderRadius:8 }}>{collapsed?"→":"←"}</button>
      </div>
      <nav style={{ display:"flex", flexDirection:"column", gap:4, flex:1 }}>
        {NAV_ITEMS.map(item => (
          <button key={item.id} onClick={()=>onNav(item.id)} className={`nav-link ${page===item.id?"active":""}`} style={{ justifyContent:collapsed?"center":"flex-start" }}>
            <span style={{ fontSize:18, flexShrink:0 }}>{item.icon}</span>
            {!collapsed && <span style={{ whiteSpace:"nowrap" }}>{item.label}</span>}
            {!collapsed && item.id==="messages" && matches.length>0 && (
              <span style={{ marginLeft:"auto", background:"var(--accent2)", color:"white", borderRadius:"50%", width:18, height:18, fontSize:11, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700 }}>{matches.length}</span>
            )}
          </button>
        ))}
      </nav>
      <div style={{ borderTop:"1px solid var(--border)", paddingTop:16 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, paddingLeft:4, overflow:"hidden" }}>
          <Avatar user={user} size={32}/>
          {!collapsed && (
            <div style={{ overflow:"hidden" }}>
              <div style={{ fontWeight:600, fontSize:13, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{user.name}</div>
              <div style={{ fontSize:11, color:"var(--accent3)" }}>● Online</div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
const Dashboard = ({ user, matches, onNav }) => {
  const stats = [
    { label:"Study Hours", value:user.studyHours,         icon:"⏱", color:"var(--accent)"  },
    { label:"Day Streak",  value:user.studyStreak,        icon:"🔥", color:"var(--accent4)" },
    { label:"Matches",     value:matches.length,          icon:"🤝", color:"var(--accent3)" },
    { label:"Badges",      value:user.badges?.length||0,  icon:"🏆", color:"var(--accent2)" },
  ];
  const earned = BADGES.filter(b=>user.badges?.includes(b.id));

  return (
    <div style={{ padding:32, overflow:"auto", height:"100%", maxWidth:1100, margin:"0 auto" }}>
      <div style={{ marginBottom:32 }} className="fade-up">
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <Avatar user={user} size={52}/>
          <div>
            <h2 className="syne" style={{ fontSize:26, fontWeight:800 }}>Welcome back, {user.name.split(" ")[0]}! 👋</h2>
            <p style={{ color:"var(--text2)", fontSize:14 }}>{user.educationLevel} · {user.country}</p>
          </div>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:28 }}>
        {stats.map((s,i) => (
          <div key={i} className="card fade-up" style={{ animationDelay:`${i*.08}s`, display:"flex", flexDirection:"column", gap:8 }}>
            <div style={{ fontSize:28 }}>{s.icon}</div>
            <div className="syne" style={{ fontSize:28, fontWeight:800, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:13, color:"var(--text2)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
        <div className="card fade-up" style={{ animationDelay:".2s" }}>
          <h3 className="syne" style={{ fontWeight:700, marginBottom:16, fontSize:16 }}>Quick Actions</h3>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {[
              { icon:"⚡", label:"Random Study Session",   action:"random", color:"var(--accent)",  desc:"Match instantly with a compatible partner" },
              { icon:"💫", label:"Discover Partners",      action:"swipe",  color:"var(--accent2)", desc:"Browse and swipe on profiles"              },
              { icon:"🏛", label:"Join a Study Room",      action:"rooms",  color:"var(--accent3)", desc:"Collaborative group study spaces"          },
              { icon:"🎮", label:"Play Language Games",    action:"games",  color:"var(--accent4)", desc:"Practice vocabulary & grammar"             },
            ].map(a => (
              <button key={a.action} onClick={()=>onNav(a.action)} style={{ background:"var(--bg3)", border:"1px solid var(--border)", borderRadius:12, padding:"12px 16px", display:"flex", alignItems:"center", gap:12, textAlign:"left", transition:"all .2s", color:"var(--text)", width:"100%" }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=a.color;e.currentTarget.style.transform="translateX(4px)";}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.transform="translateX(0)";}}>
                <span style={{ fontSize:22 }}>{a.icon}</span>
                <div><div style={{ fontWeight:600, fontSize:14 }}>{a.label}</div><div style={{ fontSize:12, color:"var(--text2)" }}>{a.desc}</div></div>
              </button>
            ))}
          </div>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
          <div className="card fade-up" style={{ animationDelay:".25s" }}>
            <h3 className="syne" style={{ fontWeight:700, marginBottom:12, fontSize:16 }}>Your Subjects</h3>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
              {(user.subjects?.length?user.subjects:["Mathematics","Computer Science"]).map(s=><span key={s} className="tag">{s}</span>)}
            </div>
          </div>
          <div className="card fade-up" style={{ animationDelay:".3s", flex:1 }}>
            <h3 className="syne" style={{ fontWeight:700, marginBottom:12, fontSize:16 }}>Badges Earned</h3>
            {earned.length===0
              ? <div style={{ color:"var(--text2)", fontSize:14 }}>Complete activities to earn badges! 🌟</div>
              : <div style={{ display:"flex", flexWrap:"wrap", gap:12 }}>{earned.map(b=><div key={b.id} title={b.desc} style={{ textAlign:"center" }}><div style={{ fontSize:28 }}>{b.icon}</div><div style={{ fontSize:11, color:"var(--text2)", marginTop:4 }}>{b.name}</div></div>)}</div>
            }
          </div>
          {matches.length>0 && (
            <div className="card fade-up" style={{ animationDelay:".35s" }}>
              <h3 className="syne" style={{ fontWeight:700, marginBottom:12, fontSize:16 }}>Recent Matches</h3>
              {matches.slice(0,3).map(m=>(
                <div key={m.id} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                  <Avatar user={m} size={34}/>
                  <div><div style={{ fontSize:14, fontWeight:500 }}>{m.name}</div><div style={{ fontSize:12, color:"var(--text2)" }}>{m.country}</div></div>
                  <button onClick={()=>onNav("messages")} style={{ marginLeft:"auto", background:"rgba(108,99,255,.15)", color:"var(--accent)", border:"1px solid rgba(108,99,255,.3)", borderRadius:8, padding:"4px 10px", fontSize:12, fontWeight:500 }}>Chat</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Random Match ──────────────────────────────────────────────────────────────
const RandomMatch = ({ user }) => {
  const [state, setState]     = useState("idle");
  const [partner, setPartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput]     = useState("");
  const [sessionTime, setSessionTime] = useState(0);
  const [pomodoro, setPomodoro] = useState({ running:false, seconds:25*60, phase:"focus" });
  const messagesEnd = useRef(null);

  useEffect(()=>{ if(state!=="session") return; const t=setInterval(()=>setSessionTime(s=>s+1),1000); return ()=>clearInterval(t); },[state]);
  useEffect(()=>{
    if(!pomodoro.running) return;
    const t = setInterval(()=>{
      setPomodoro(p => {
        if(p.seconds<=1){ notify(p.phase==="focus"?"Break time! 🎉":"Focus time! 💪","success"); return {running:false,seconds:p.phase==="focus"?5*60:25*60,phase:p.phase==="focus"?"break":"focus"}; }
        return {...p,seconds:p.seconds-1};
      });
    },1000);
    return ()=>clearInterval(t);
  },[pomodoro.running]);
  useEffect(()=>{ messagesEnd.current?.scrollIntoView({behavior:"smooth"}); },[messages]);

  const startSearch = () => {
    setState("searching");
    setTimeout(()=>{
      const p = MOCK_PROFILES[Math.floor(Math.random()*MOCK_PROFILES.length)];
      setPartner(p); setState("matched");
      setTimeout(()=>{ setState("session"); setMessages([{id:genId(),sender:"partner",text:`Hey! I'm ${p.name} from ${p.country}. Nice to meet you! What are we studying today?`,time:new Date()}]); },1500);
    },2000+Math.random()*2000);
  };

  const sendMsg = () => {
    if(!input.trim()) return;
    setMessages(m=>[...m,{id:genId(),sender:"me",text:input,time:new Date()}]);
    setInput("");
    setTimeout(()=>{
      const r=["Great point!","Exactly!","Hmm, can you explain more?","That's clever!","Let me share my notes.","Have you tried the practice problems?","Yes! And also consider..."];
      setMessages(m=>[...m,{id:genId(),sender:"partner",text:r[Math.floor(Math.random()*r.length)],time:new Date()}]);
    },1200+Math.random()*1000);
  };

  const fmt = s => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
  const pct  = pomodoro.seconds/(pomodoro.phase==="focus"?25*60:5*60);
  const circ = 2*Math.PI*54;

  if(state==="idle") return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", padding:40 }}>
      <div className="float" style={{ fontSize:80, marginBottom:24 }}>⚡</div>
      <h2 className="syne" style={{ fontSize:32, fontWeight:800, marginBottom:12, textAlign:"center" }}>Random Study Match</h2>
      <p style={{ color:"var(--text2)", textAlign:"center", maxWidth:440, lineHeight:1.6, marginBottom:32 }}>Connect instantly with a compatible study partner worldwide. Real-time video, chat, and shared study tools.</p>
      <div style={{ display:"flex", gap:12, marginBottom:40, flexWrap:"wrap", justifyContent:"center" }}>
        {["Video Call","Live Chat","Pomodoro Timer","Skip Anytime"].map(f=><span key={f} className="tag">{f}</span>)}
      </div>
      <button className="btn-primary" onClick={startSearch} style={{ fontSize:17, padding:"16px 48px" }}>Find Study Partner ⚡</button>
    </div>
  );

  if(state==="searching") return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", gap:24 }}>
      <div style={{ position:"relative", width:80, height:80 }}>
        <div style={{ position:"absolute", inset:0, borderRadius:"50%", border:"3px solid var(--border)", borderTopColor:"var(--accent)", animation:"spin 1s linear infinite" }}/>
        <div style={{ position:"absolute", inset:8, borderRadius:"50%", border:"2px solid var(--border)", borderBottomColor:"var(--accent2)", animation:"spin 1.5s linear infinite reverse" }}/>
        <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:28 }}>⚡</div>
      </div>
      <div style={{ textAlign:"center" }}>
        <h3 className="syne" style={{ fontSize:22, fontWeight:700 }}>Searching for a partner...</h3>
        <p style={{ color:"var(--text2)", marginTop:8 }}>Analyzing compatibility across subjects, languages, timezone</p>
      </div>
      <button className="btn-secondary" onClick={()=>setState("idle")}>Cancel</button>
    </div>
  );

  if(state==="matched") return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", gap:20 }}>
      <div style={{ fontSize:60 }}>🎉</div>
      <h3 className="syne" style={{ fontSize:26, fontWeight:800 }}>Match Found!</h3>
      <Avatar user={partner} size={72}/><p style={{ fontSize:18, fontWeight:600 }}>{partner?.name}</p>
      <p style={{ color:"var(--text2)" }}>{partner?.country} · {partner?.educationLevel}</p>
      <p style={{ color:"var(--accent3)" }}>Starting session...</p>
    </div>
  );

  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 320px", height:"100%", overflow:"hidden" }}>
      <div style={{ display:"flex", flexDirection:"column", borderRight:"1px solid var(--border)" }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, padding:16 }}>
          {[{u:partner,label:"Partner"},{u:user,label:"You"}].map(({u,label})=>(
            <div key={label} style={{ background:"var(--bg3)", borderRadius:14, aspectRatio:"16/9", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:8, position:"relative", border:"1px solid var(--border)" }}>
              <Avatar user={u} size={52}/><span style={{ fontSize:14, fontWeight:500 }}>{u?.name}</span>
              <span style={{ position:"absolute", bottom:8, left:12, fontSize:12, color:"var(--text2)" }}>{label}</span>
              <span style={{ position:"absolute", top:8, right:8, fontSize:10, background:"rgba(67,233,123,.2)", color:"var(--accent3)", padding:"2px 8px", borderRadius:6, fontWeight:600 }}>LIVE</span>
            </div>
          ))}
        </div>
        <div style={{ flex:1, overflow:"auto", padding:"0 16px", display:"flex", flexDirection:"column", gap:10 }}>
          {messages.map(m=>(
            <div key={m.id} style={{ display:"flex", flexDirection:"column", alignItems:m.sender==="me"?"flex-end":"flex-start" }} className="fade-up">
              {m.sender!=="me"&&<span style={{ fontSize:11, color:"var(--text2)", marginBottom:3 }}>{partner?.name}</span>}
              <div className={`message-bubble ${m.sender==="me"?"sent":"received"}`}>{m.text}</div>
            </div>
          ))}
          <div ref={messagesEnd}/>
        </div>
        <div style={{ padding:16, display:"flex", gap:10 }}>
          <input className="input-field" style={{ flex:1 }} placeholder="Type a message..." value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendMsg()}/>
          <button className="btn-primary" onClick={sendMsg} style={{ padding:"12px 18px" }}>Send</button>
        </div>
      </div>

      <div style={{ display:"flex", flexDirection:"column", overflow:"auto" }}>
        <div style={{ padding:20, borderBottom:"1px solid var(--border)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
            <Avatar user={partner} size={40}/>
            <div><div style={{ fontWeight:600 }}>{partner?.name}</div><div style={{ fontSize:12, color:"var(--text2)" }}>{partner?.country}</div></div>
            <span style={{ marginLeft:"auto", fontSize:13, color:"var(--accent3)", fontWeight:600 }}>{fmt(sessionTime)}</span>
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {partner?.subjects?.map(s=><span key={s} className="tag" style={{ fontSize:11 }}>{s}</span>)}
          </div>
        </div>
        <div style={{ padding:20, borderBottom:"1px solid var(--border)", textAlign:"center" }}>
          <div className="syne" style={{ fontSize:13, fontWeight:700, color:"var(--text2)", marginBottom:12, textTransform:"uppercase", letterSpacing:1 }}>Pomodoro</div>
          <div style={{ position:"relative", width:130, height:130, margin:"0 auto 12px" }}>
            <svg width="130" height="130" style={{ transform:"rotate(-90deg)" }}>
              <circle cx="65" cy="65" r="54" fill="none" stroke="var(--border)" strokeWidth="8"/>
              <circle cx="65" cy="65" r="54" fill="none" stroke={pomodoro.phase==="focus"?"var(--accent)":"var(--accent3)"} strokeWidth="8" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ*(1-pct)} className="timer-ring"/>
            </svg>
            <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
              <div className="syne" style={{ fontSize:22, fontWeight:700 }}>{fmt(pomodoro.seconds)}</div>
              <div style={{ fontSize:11, color:"var(--text2)", textTransform:"uppercase" }}>{pomodoro.phase}</div>
            </div>
          </div>
          <button onClick={()=>setPomodoro(p=>({...p,running:!p.running}))} className={pomodoro.running?"btn-secondary":"btn-primary"} style={{ width:"100%", padding:"10px" }}>
            {pomodoro.running?"⏸ Pause":"▶ Start"}
          </button>
        </div>
        <div style={{ padding:20, display:"flex", flexDirection:"column", gap:10, marginTop:"auto" }}>
          <button onClick={()=>{ notify("Looking for a new partner...","info","🔄"); setMessages([]); setSessionTime(0); setPomodoro({running:false,seconds:25*60,phase:"focus"}); startSearch(); }} className="btn-secondary" style={{ width:"100%" }}>⏭ Skip Partner</button>
          <button onClick={()=>notify(`${partner?.name} added! 🤝`,"success","🤝")} className="btn-secondary" style={{ width:"100%", borderColor:"var(--accent3)", color:"var(--accent3)" }}>➕ Add Friend</button>
          <button onClick={()=>{ notify(`Session ended! ${Math.floor(sessionTime/60)}m studied 🎉`,"success","🎓"); setState("idle"); setPartner(null); setMessages([]); setSessionTime(0); }} style={{ background:"rgba(255,101,132,.1)", border:"1px solid rgba(255,101,132,.3)", color:"var(--accent2)", borderRadius:12, padding:"11px", fontWeight:600, fontSize:14 }}>⏹ End Session</button>
        </div>
      </div>
    </div>
  );
};

// ── Swipe ─────────────────────────────────────────────────────────────────────
const SwipeDiscover = ({ user, onMatch }) => {
  const [profiles, setProfiles] = useState(shuffle(MOCK_PROFILES));
  const [current, setCurrent]   = useState(0);
  const [swipeAnim, setSwipeAnim] = useState(null);
  const [matches, setMatches]   = useState([]);
  const [showModal, setShowModal] = useState(null);

  const doSwipe = dir => {
    setSwipeAnim(dir);
    setTimeout(()=>{
      if(dir==="right"){
        const p=profiles[current];
        if(Math.random()>.4){
          const m={...p};
          setMatches(ms=>[...ms,m]);
          setShowModal(m);
          onMatch(m);
          notify(`It's a match with ${p.name}! 🎉`,"success","💫");
        }
      }
      setCurrent(c=>c+1); setSwipeAnim(null);
    },400);
  };

  const p = profiles[current];

  if(!p||current>=profiles.length) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", gap:20 }}>
      <div style={{ fontSize:60 }}>✨</div>
      <h3 className="syne" style={{ fontSize:22, fontWeight:700 }}>You've seen everyone!</h3>
      <p style={{ color:"var(--text2)" }}>Come back later for new study partners.</p>
      <button className="btn-primary" onClick={()=>{setCurrent(0);setProfiles(shuffle(MOCK_PROFILES));}}>Start Over 🔄</button>
    </div>
  );

  return (
    <div style={{ display:"flex", gap:32, height:"100%", padding:32, overflow:"auto", alignItems:"flex-start", justifyContent:"center" }}>
      <div style={{ flex:"0 0 360px" }}>
        <div style={{ position:"relative", height:500 }}>
          {profiles.slice(current,current+2).reverse().map((prof,i)=>{
            const isTop=i===(Math.min(2,profiles.length-current)-1);
            return (
              <div key={prof.id} style={{ position:"absolute", width:"100%", height:"100%", borderRadius:20, overflow:"hidden", background:`linear-gradient(160deg,${prof.color}22,var(--card))`, border:`1px solid ${prof.color}44`, transform:isTop?"none":"scale(0.95) translateY(16px)", animation:isTop&&swipeAnim?(swipeAnim==="left"?"swipeLeft .4s forwards":"swipeRight .4s forwards"):"none", zIndex:isTop?2:1 }}>
                <div style={{ height:"50%", display:"flex", alignItems:"center", justifyContent:"center", background:`radial-gradient(circle at 50% 100%,${prof.color}33,transparent 70%)` }}>
                  <div style={{ width:110, height:110, borderRadius:"50%", background:`linear-gradient(135deg,${prof.color},${prof.color}88)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:52, boxShadow:`0 8px 40px ${prof.color}66` }}>{prof.emoji}</div>
                </div>
                <div style={{ padding:24 }}>
                  <div style={{ display:"flex", alignItems:"baseline", gap:10, marginBottom:4 }}>
                    <h3 className="syne" style={{ fontSize:20, fontWeight:800 }}>{prof.name}</h3>
                    <span style={{ color:"var(--text2)", fontSize:13 }}>{prof.educationLevel}</span>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:10, color:"var(--text2)", fontSize:13 }}>
                    <span>📍 {prof.country}</span><span style={{ margin:"0 4px" }}>·</span><span>🔥 {prof.studyStreak}d</span>
                  </div>
                  <p style={{ color:"var(--text2)", fontSize:13, lineHeight:1.6, marginBottom:12 }}>{prof.bio}</p>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                    {prof.subjects.slice(0,3).map(s=><span key={s} className="tag" style={{ fontSize:11 }}>{s}</span>)}
                    {prof.languages.slice(0,2).map(l=><span key={l} style={{ background:"rgba(67,233,123,.12)", color:"var(--accent3)", border:"1px solid rgba(67,233,123,.25)", borderRadius:8, padding:"3px 10px", fontSize:11 }}>{l}</span>)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ display:"flex", justifyContent:"center", gap:20, marginTop:20 }}>
          <button onClick={()=>doSwipe("left")}  style={{ width:64, height:64, borderRadius:"50%", background:"rgba(255,101,132,.1)", border:"2px solid rgba(255,101,132,.4)", color:"var(--accent2)", fontSize:24, transition:"all .2s" }} onMouseEnter={e=>e.currentTarget.style.transform="scale(1.1)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>✕</button>
          <button onClick={()=>doSwipe("right")} style={{ width:64, height:64, borderRadius:"50%", background:"rgba(67,233,123,.1)",   border:"2px solid rgba(67,233,123,.4)",   color:"var(--accent3)", fontSize:24, transition:"all .2s" }} onMouseEnter={e=>e.currentTarget.style.transform="scale(1.1)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>♥</button>
        </div>
        <div style={{ textAlign:"center", marginTop:12, fontSize:13, color:"var(--text3)" }}>{profiles.length-current} profiles remaining</div>
      </div>

      <div style={{ flex:"0 0 260px" }}>
        <h3 className="syne" style={{ fontSize:16, fontWeight:700, marginBottom:16 }}>Your Matches ({matches.length})</h3>
        {matches.length===0
          ? <div className="card" style={{ textAlign:"center", color:"var(--text2)", fontSize:14, padding:24 }}>Swipe right to match! 💫</div>
          : <div style={{ display:"flex", flexDirection:"column", gap:10 }}>{matches.map(m=>(
            <div key={m.id} className="card" style={{ display:"flex", alignItems:"center", gap:12, padding:14 }}>
              <Avatar user={m} size={42}/><div style={{ flex:1, overflow:"hidden" }}><div style={{ fontWeight:600, fontSize:14 }}>{m.name}</div><div style={{ fontSize:12, color:"var(--text2)" }}>{m.country}</div></div>
              <span style={{ width:8, height:8, borderRadius:"50%", background:"var(--accent3)", flexShrink:0 }}/>
            </div>
          ))}</div>
        }
      </div>

      {showModal&&(
        <div className="modal-overlay" onClick={()=>setShowModal(null)}>
          <div className="modal-content" style={{ textAlign:"center" }} onClick={e=>e.stopPropagation()}>
            <div style={{ fontSize:64, marginBottom:16 }}>💫</div>
            <h2 className="syne" style={{ fontSize:28, fontWeight:800, marginBottom:8 }}>It's a Match!</h2>
            <Avatar user={showModal} size={72}/>
            <p style={{ fontWeight:600, fontSize:18, marginTop:12 }}>{showModal.name}</p>
            <p style={{ color:"var(--text2)", marginBottom:24 }}>{showModal.country} · {showModal.educationLevel}</p>
            <div style={{ display:"flex", gap:12 }}>
              <button className="btn-secondary" style={{ flex:1 }} onClick={()=>setShowModal(null)}>Keep Swiping</button>
              <button className="btn-primary"   style={{ flex:1 }} onClick={()=>setShowModal(null)}>Send Message 💬</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Study Rooms ───────────────────────────────────────────────────────────────
const StudyRooms = ({ user }) => {
  const [joined,  setJoined]  = useState(null);
  const [convos,  setConvos]  = useState({});
  const [input,   setInput]   = useState("");
  const [filter,  setFilter]  = useState("All");
  const messagesEnd = useRef(null);

  const categories = ["All", ...new Set(STUDY_ROOMS.map(r=>r.category))];
  const filtered   = filter==="All" ? STUDY_ROOMS : STUDY_ROOMS.filter(r=>r.category===filter);

  const joinRoom = room => {
    setJoined(room);
    if(!convos[room.id]){
      setConvos(c=>({...c,[room.id]:[
        {id:genId(),sender:MOCK_PROFILES[0].name,text:`Welcome to ${room.name}! 📚`,time:new Date(Date.now()-120000)},
        {id:genId(),sender:MOCK_PROFILES[1].name,text:"Hey everyone! Ready to study?",time:new Date(Date.now()-60000)},
        {id:genId(),sender:MOCK_PROFILES[2].name,text:"Let's do this! 💪",time:new Date(Date.now()-30000)},
      ]}));
    }
    notify(`Joined ${room.name}!`,"success","🏛");
  };

  const sendMsg = () => {
    if(!input.trim()||!joined) return;
    const msg={id:genId(),sender:user.name,text:input,time:new Date(),isMe:true};
    setConvos(c=>({...c,[joined.id]:[...(c[joined.id]||[]),msg]}));
    setInput("");
    setTimeout(()=>{
      const rand=MOCK_PROFILES[Math.floor(Math.random()*MOCK_PROFILES.length)];
      const r=["Great point!","Interesting!","Can you explain?","I agree!","Let's check the formula."];
      setConvos(c=>({...c,[joined.id]:[...(c[joined.id]||[]),{id:genId(),sender:rand.name,text:r[Math.floor(Math.random()*r.length)],time:new Date()}]}));
    },1500);
  };

  useEffect(()=>{ messagesEnd.current?.scrollIntoView({behavior:"smooth"}); },[convos,joined]);

  if(joined) return (
    <div style={{ display:"flex", height:"100%", overflow:"hidden" }}>
      <div style={{ width:190, borderRight:"1px solid var(--border)", overflow:"auto", padding:10 }}>
        <button onClick={()=>setJoined(null)} style={{ display:"flex", alignItems:"center", gap:8, color:"var(--text2)", background:"none", marginBottom:14, fontSize:13 }}>← Rooms</button>
        {STUDY_ROOMS.map(r=>(
          <button key={r.id} onClick={()=>joinRoom(r)} style={{ width:"100%", textAlign:"left", padding:"8px 10px", borderRadius:8, marginBottom:4, background:joined.id===r.id?"rgba(108,99,255,.15)":"transparent", color:joined.id===r.id?"var(--accent)":"var(--text2)", fontSize:12, border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ width:7, height:7, borderRadius:"50%", background:r.online?"var(--accent3)":"var(--text3)", flexShrink:0 }}/>
            <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.name}</span>
          </button>
        ))}
      </div>
      <div style={{ flex:1, display:"flex", flexDirection:"column" }}>
        <div style={{ padding:"16px 20px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:40, height:40, borderRadius:12, background:`${joined.color}22`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>{joined.icon}</div>
          <div><div className="syne" style={{ fontWeight:700, fontSize:15 }}>{joined.name}</div><div style={{ fontSize:12, color:"var(--text2)" }}>{joined.category} · {joined.participants} online</div></div>
        </div>
        <div style={{ flex:1, overflow:"auto", padding:"16px 20px", display:"flex", flexDirection:"column", gap:12 }}>
          {(convos[joined.id]||[]).map(m=>(
            <div key={m.id} style={{ display:"flex", gap:10 }} className="fade-up">
              <div style={{ width:30, height:30, borderRadius:"50%", background:`linear-gradient(135deg,${joined.color},${joined.color}88)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:"white", flexShrink:0 }}>{m.sender[0]}</div>
              <div>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:2 }}>
                  <span style={{ fontWeight:600, fontSize:13, color:m.isMe?"var(--accent)":"var(--text)" }}>{m.sender}</span>
                  <span style={{ fontSize:11, color:"var(--text3)" }}>{m.time.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</span>
                </div>
                <div style={{ background:"var(--bg3)", borderRadius:10, padding:"8px 12px", fontSize:13, color:"var(--text)", maxWidth:460 }}>{m.text}</div>
              </div>
            </div>
          ))}
          <div ref={messagesEnd}/>
        </div>
        <div style={{ padding:"12px 20px", display:"flex", gap:10 }}>
          <input className="input-field" style={{ flex:1 }} placeholder={`Message #${joined.name.toLowerCase().replace(/\s/g,"-")}`} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendMsg()}/>
          <button className="btn-primary" onClick={sendMsg} style={{ padding:"12px 16px" }}>Send</button>
        </div>
      </div>
      <div style={{ width:170, borderLeft:"1px solid var(--border)", padding:14 }}>
        <div className="syne" style={{ fontSize:11, fontWeight:700, color:"var(--text2)", textTransform:"uppercase", letterSpacing:1, marginBottom:12 }}>Members</div>
        {MOCK_PROFILES.slice(0,5).map(p=>(
          <div key={p.id} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
            <div style={{ position:"relative" }}>
              <Avatar user={p} size={26}/>
              <span style={{ position:"absolute", bottom:-1, right:-1, width:7, height:7, borderRadius:"50%", background:"var(--accent3)", border:"2px solid var(--bg2)" }}/>
            </div>
            <span style={{ fontSize:12, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.name.split(" ")[0]}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ padding:32, overflow:"auto", height:"100%" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24 }}>
        <div>
          <h2 className="syne" style={{ fontSize:26, fontWeight:800 }}>Study Rooms</h2>
          <p style={{ color:"var(--text2)", fontSize:14 }}>Join collaborative study spaces organized by subject</p>
        </div>
        <button className="btn-primary" onClick={()=>notify("Room creation coming soon!","info","🏛")}>+ Create Room</button>
      </div>
      <div style={{ display:"flex", gap:8, marginBottom:24, flexWrap:"wrap" }}>
        {categories.map(c=>(
          <button key={c} onClick={()=>setFilter(c)} style={{ padding:"6px 16px", borderRadius:20, fontSize:13, fontWeight:500, transition:"all .2s", background:filter===c?"var(--accent)":"var(--card2)", color:filter===c?"white":"var(--text2)", border:`1px solid ${filter===c?"var(--accent)":"var(--border)"}` }}>{c}</button>
        ))}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:16 }}>
        {filtered.map(r=>(
          <div key={r.id} className="room-card" onClick={()=>joinRoom(r)}>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
              <div style={{ width:42, height:42, borderRadius:12, background:`${r.color}22`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>{r.icon}</div>
              <div style={{ flex:1 }}><div style={{ fontWeight:700, fontSize:14 }}>{r.name}</div><div style={{ fontSize:12, color:"var(--text2)" }}>{r.category}</div></div>
              <span style={{ width:8, height:8, borderRadius:"50%", background:r.online?"var(--accent3)":"var(--text3)" }}/>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ flex:1 }}><div className="progress-bar"><div className="progress-fill" style={{ width:`${(r.participants/r.maxP)*100}%`, background:`linear-gradient(90deg,${r.color},${r.color}88)` }}/></div></div>
              <span style={{ fontSize:12, color:"var(--text2)", whiteSpace:"nowrap" }}>{r.participants}/{r.maxP} 👥</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Messages ──────────────────────────────────────────────────────────────────
const Messages = ({ user, matches }) => {
  const [active,  setActive]  = useState(null);
  const [convos,  setConvos]  = useState({});
  const [input,   setInput]   = useState("");
  const messagesEnd = useRef(null);

  const contacts = matches.length>0 ? matches : MOCK_PROFILES.slice(0,3);
  const getConvo = id => convos[id] || [
    {id:genId(),sender:"them",text:"Hey! I saw we matched. Would love to study together!",time:new Date(Date.now()-7200000)},
    {id:genId(),sender:"them",text:"What subjects are you focusing on this week?",time:new Date(Date.now()-3600000)},
  ];

  const sendMsg = () => {
    if(!input.trim()||!active) return;
    const base = getConvo(active.id);
    const msg  = {id:genId(),sender:"me",text:input,time:new Date()};
    setConvos(c=>({...c,[active.id]:[...base,msg]}));
    setInput("");
    setTimeout(()=>{
      const r=["Sounds great!","I'd love that!","Let's do it tomorrow?","Perfect timing!","Let me check my schedule."];
      setConvos(c=>({...c,[active.id]:[...(c[active.id]||base),msg,{id:genId(),sender:"them",text:r[Math.floor(Math.random()*r.length)],time:new Date()}]}));
    },1200);
  };

  useEffect(()=>{ messagesEnd.current?.scrollIntoView({behavior:"smooth"}); },[convos,active]);

  return (
    <div style={{ display:"flex", height:"100%", overflow:"hidden" }}>
      <div style={{ width:260, borderRight:"1px solid var(--border)", overflow:"auto" }}>
        <div style={{ padding:"20px 16px 12px", borderBottom:"1px solid var(--border)" }}>
          <h3 className="syne" style={{ fontWeight:700, fontSize:16, marginBottom:12 }}>Messages</h3>
          <input className="input-field" placeholder="Search..." style={{ padding:"8px 12px", fontSize:13 }}/>
        </div>
        {contacts.map(c=>(
          <button key={c.id} onClick={()=>setActive(c)} style={{ width:"100%", padding:"14px 16px", display:"flex", alignItems:"center", gap:12, textAlign:"left", background:active?.id===c.id?"rgba(108,99,255,.1)":"transparent", borderBottom:"1px solid var(--border)", border:"none", cursor:"pointer" }}>
            <div style={{ position:"relative" }}><Avatar user={c} size={40}/><span style={{ position:"absolute", bottom:0, right:0, width:10, height:10, borderRadius:"50%", background:"var(--accent3)", border:"2px solid var(--bg2)" }}/></div>
            <div style={{ flex:1, overflow:"hidden" }}>
              <div style={{ fontWeight:600, fontSize:14 }}>{c.name}</div>
              <div style={{ fontSize:12, color:"var(--text2)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{getConvo(c.id).slice(-1)[0]?.text||"Say hello!"}</div>
            </div>
          </button>
        ))}
      </div>

      {active ? (
        <div style={{ flex:1, display:"flex", flexDirection:"column" }}>
          <div style={{ padding:"16px 20px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", gap:12 }}>
            <Avatar user={active} size={40}/>
            <div><div className="syne" style={{ fontWeight:700 }}>{active.name}</div><div style={{ fontSize:12, color:"var(--accent3)" }}>● Online</div></div>
            <button onClick={()=>notify("Starting video call...","info","📹")} style={{ marginLeft:"auto", background:"rgba(108,99,255,.15)", color:"var(--accent)", border:"1px solid rgba(108,99,255,.3)", borderRadius:10, padding:"8px 14px", fontSize:13, fontWeight:500 }}>📹 Video</button>
          </div>
          <div style={{ flex:1, overflow:"auto", padding:20, display:"flex", flexDirection:"column", gap:12 }}>
            {getConvo(active.id).map(m=>(
              <div key={m.id} style={{ display:"flex", flexDirection:"column", alignItems:m.sender==="me"?"flex-end":"flex-start" }} className="fade-up">
                {m.sender==="them"&&<span style={{ fontSize:11, color:"var(--text2)", marginBottom:3 }}>{active.name}</span>}
                <div className={`message-bubble ${m.sender==="me"?"sent":"received"}`}>{m.text}</div>
                <span style={{ fontSize:10, color:"var(--text3)", marginTop:3 }}>{m.time.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</span>
              </div>
            ))}
            <div ref={messagesEnd}/>
          </div>
          <div style={{ padding:"12px 20px", display:"flex", gap:10 }}>
            <input className="input-field" style={{ flex:1 }} placeholder="Type a message..." value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendMsg()}/>
            <button className="btn-primary" onClick={sendMsg} style={{ padding:"12px 16px" }}>Send</button>
          </div>
        </div>
      ) : (
        <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", color:"var(--text2)" }}>
          <div style={{ fontSize:56, marginBottom:16 }}>💬</div>
          <h3 className="syne" style={{ fontSize:18, fontWeight:700, marginBottom:8, color:"var(--text)" }}>Select a conversation</h3>
          <p style={{ fontSize:14 }}>Choose a contact from the left to start chatting</p>
        </div>
      )}
    </div>
  );
};

// ── Language Games ────────────────────────────────────────────────────────────
const LanguageGames = () => {
  const [game,    setGame]    = useState(null);
  const [lang,    setLang]    = useState("Spanish");
  const [score,   setScore]   = useState(0);
  const [qIdx,    setQIdx]    = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selected,setSelected]= useState(null);
  const [gameOver,setGameOver]= useState(false);
  const [streak,  setStreak]  = useState(0);

  // Flashcard
  const [fcIdx,   setFcIdx]   = useState(0);
  const [flipped, setFlipped] = useState(false);

  // Memory
  const [cards,       setCards]       = useState([]);
  const [flippedCards,setFlippedCards]= useState([]);
  const [matched,     setMatched]     = useState([]);

  // Word Match
  const [wmLeft,    setWmLeft]    = useState([]);
  const [wmRight,   setWmRight]   = useState([]);
  const [wmSel,     setWmSel]     = useState(null);
  const [wmMatched, setWmMatched] = useState([]);

  const dataset = VOCAB_DATA[lang] || VOCAB_DATA.Spanish;

  const GAMES = [
    {id:"vocab",     name:"Vocabulary Quiz",   icon:"📖", desc:"Translate words via multiple choice",     color:"#6c63ff"},
    {id:"flashcard", name:"Flashcard Trainer",  icon:"🃏", desc:"Memorize vocabulary with flip cards",      color:"#43e97b"},
    {id:"memory",    name:"Memory Match",       icon:"🧩", desc:"Match word pairs in a card memory game",   color:"#f7971e"},
    {id:"wordmatch", name:"Word Match",         icon:"🔗", desc:"Connect words to correct translations",    color:"#4ECDC4"},
    {id:"speedround",name:"Speed Round",        icon:"⚡", desc:"Answer fast — beat the clock!",           color:"#FF6B6B"},
    {id:"spelling",  name:"Spelling Challenge", icon:"✍", desc:"Type the word in the target language",     color:"#A29BFE"},
  ];

  const buildAnswers = qi => {
    const correct = dataset[qi % dataset.length];
    const wrong   = shuffle(dataset.filter((_,i)=>i!==qi%dataset.length)).slice(0,3);
    setAnswers(shuffle([correct,...wrong]));
  };

  const startGame = gId => {
    setGame(gId); setScore(0); setQIdx(0); setSelected(null); setGameOver(false); setStreak(0);
    buildAnswers(0);
    if(gId==="memory"){
      const pairs=dataset.slice(0,6).flatMap(d=>[{id:genId(),text:d.word,pair:d.answer,type:"word"},{id:genId(),text:d.answer,pair:d.word,type:"tr"}]);
      setCards(shuffle(pairs)); setFlippedCards([]); setMatched([]);
    }
    if(gId==="wordmatch"){
      const pairs=dataset.slice(0,6);
      setWmLeft(shuffle(pairs.map(p=>p.word))); setWmRight(shuffle(pairs.map(p=>p.answer))); setWmSel(null); setWmMatched([]);
    }
  };

  const answer = a => {
    if(selected!==null) return;
    setSelected(a);
    const correct=dataset[qIdx%dataset.length];
    const isRight=a.answer===correct.answer;
    if(isRight){ setScore(s=>s+10+streak*2); setStreak(s=>s+1); notify(`✅ Correct! +${10+streak*2} pts`,"success","✅"); }
    else{ setStreak(0); notify(`❌ It was "${correct.answer}"`,"error","❌"); }
    setTimeout(()=>{
      const next=qIdx+1;
      if(next>=dataset.length){ setGameOver(true); return; }
      setQIdx(next); setSelected(null); buildAnswers(next);
    },1200);
  };

  const flipCard = card => {
    if(flippedCards.length===2||matched.includes(card.id)||flippedCards.find(c=>c.id===card.id)) return;
    const nf=[...flippedCards,card];
    setFlippedCards(nf);
    if(nf.length===2){
      const [a,b]=nf;
      if(a.text===b.pair||a.pair===b.text){ setMatched(m=>[...m,a.id,b.id]); setScore(s=>s+20); setFlippedCards([]); if(matched.length+2>=cards.length) notify("🎉 Memory complete!","success","🎉"); }
      else setTimeout(()=>setFlippedCards([]),1000);
    }
  };

  const wmClick = (val,side) => {
    if(wmSel===null){ setWmSel({val,side}); return; }
    if(wmSel.side===side){ setWmSel({val,side}); return; }
    const pair=dataset.find(d=>(wmSel.side==="left"&&wmSel.val===d.word&&val===d.answer)||(wmSel.side==="right"&&wmSel.val===d.answer&&val===d.word));
    if(pair){ setWmMatched(m=>[...m,pair.word,pair.answer]); setScore(s=>s+15); notify("✅ Match!","success","✅"); }
    else notify("❌ Not a match","error","❌");
    setWmSel(null);
  };

  if(!game) return (
    <div style={{ padding:32, overflow:"auto", height:"100%" }}>
      <div style={{ marginBottom:28 }}>
        <h2 className="syne" style={{ fontSize:26, fontWeight:800, marginBottom:12 }}>Language Games 🎮</h2>
        <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
          <span style={{ color:"var(--text2)", fontSize:14 }}>Practice:</span>
          {Object.keys(VOCAB_DATA).map(l=>(
            <button key={l} onClick={()=>setLang(l)} style={{ padding:"5px 14px", borderRadius:20, fontSize:13, fontWeight:500, background:lang===l?"var(--accent)":"var(--card2)", color:lang===l?"white":"var(--text2)", border:`1px solid ${lang===l?"var(--accent)":"var(--border)"}` }}>{l}</button>
          ))}
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:16 }}>
        {GAMES.map(g=>(
          <div key={g.id} className="game-option" onClick={()=>startGame(g.id)} style={{ borderTop:`3px solid ${g.color}` }}>
            <div style={{ fontSize:38, marginBottom:10 }}>{g.icon}</div>
            <h3 className="syne" style={{ fontWeight:700, fontSize:15, marginBottom:6 }}>{g.name}</h3>
            <p style={{ fontSize:13, color:"var(--text2)", lineHeight:1.5 }}>{g.desc}</p>
            <div style={{ marginTop:10, fontSize:12, color:g.color, fontWeight:600 }}>Play →</div>
          </div>
        ))}
      </div>
    </div>
  );

  if(gameOver) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", gap:16 }}>
      <div style={{ fontSize:64 }}>🏆</div>
      <h2 className="syne" style={{ fontSize:28, fontWeight:800 }}>Game Over!</h2>
      <div className="syne" style={{ fontSize:48, fontWeight:800, color:"var(--accent)" }}>{score}</div>
      <div style={{ color:"var(--text2)" }}>points earned</div>
      <div style={{ display:"flex", gap:12, marginTop:12 }}>
        <button className="btn-secondary" onClick={()=>setGame(null)}>← Menu</button>
        <button className="btn-primary"   onClick={()=>startGame(game)}>Play Again 🔄</button>
      </div>
    </div>
  );

  const current = dataset[qIdx%dataset.length];

  const renderGame = () => {
    if(game==="vocab"||game==="speedround") return (
      <div style={{ maxWidth:540, margin:"0 auto", padding:32 }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:20 }}>
          <span style={{ fontSize:14, color:"var(--text2)" }}>Q {qIdx+1}/{dataset.length}</span>
          <span style={{ fontSize:14, color:"var(--accent)", fontWeight:600 }}>Score: {score}</span>
          {streak>1&&<span style={{ fontSize:13, color:"var(--accent4)" }}>🔥 {streak}× streak</span>}
        </div>
        <div className="progress-bar" style={{ marginBottom:24 }}><div className="progress-fill" style={{ width:`${(qIdx/dataset.length)*100}%` }}/></div>
        <div className="card" style={{ textAlign:"center", padding:48, marginBottom:20 }}>
          <div style={{ fontSize:13, color:"var(--text2)", marginBottom:8 }}>Translate from {lang}</div>
          <div className="syne" style={{ fontSize:38, fontWeight:800 }}>{current.word}</div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          {answers.map((a,i)=>{
            const isCorrect=a.answer===current.answer, isSel=selected?.answer===a.answer;
            let bg="var(--card2)",border="var(--border)",color="var(--text)";
            if(selected){ if(isCorrect){bg="rgba(67,233,123,.15)";border="var(--accent3)";color="var(--accent3)";}else if(isSel){bg="rgba(255,101,132,.15)";border="var(--accent2)";color="var(--accent2)";} }
            return (
              <button key={i} onClick={()=>answer(a)} style={{ padding:16, borderRadius:12, background:bg, border:`1px solid ${border}`, color, fontWeight:500, fontSize:15, transition:"all .15s" }}
                onMouseEnter={e=>{if(!selected){e.currentTarget.style.borderColor="var(--accent)";e.currentTarget.style.background="rgba(108,99,255,.1)";}}}
                onMouseLeave={e=>{if(!selected){e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.background="var(--card2)";}}}>
                {a.answer}
              </button>
            );
          })}
        </div>
      </div>
    );

    if(game==="flashcard") return (
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", gap:24 }}>
        <div style={{ fontSize:14, color:"var(--text2)" }}>Card {fcIdx+1}/{dataset.length} · Score: {score}</div>
        <div onClick={()=>setFlipped(f=>!f)} style={{ width:340, height:210, cursor:"pointer" }}>
          <div style={{ width:"100%", height:"100%", borderRadius:20, background:flipped?"linear-gradient(135deg,var(--accent),#8b5cf6)":"var(--card)", border:"1px solid var(--border)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", boxShadow:"0 8px 32px rgba(0,0,0,.3)", transition:"background .3s" }}>
            <div style={{ fontSize:11, color:flipped?"rgba(255,255,255,.7)":"var(--text2)", textTransform:"uppercase", letterSpacing:1, marginBottom:8 }}>{flipped?"Translation":"Word"}</div>
            <div className="syne" style={{ fontSize:32, fontWeight:800, color:flipped?"white":"var(--text)" }}>{flipped?dataset[fcIdx].answer:dataset[fcIdx].word}</div>
            <div style={{ fontSize:12, color:flipped?"rgba(255,255,255,.6)":"var(--text3)", marginTop:8 }}>Tap to {flipped?"flip back":"reveal"}</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:12 }}>
          <button className="btn-secondary" onClick={()=>{setFcIdx(i=>(i-1+dataset.length)%dataset.length);setFlipped(false);}}>← Prev</button>
          <button onClick={()=>{setScore(s=>s+5);notify("+5 pts ✅","success","✅");}} style={{ background:"rgba(67,233,123,.15)", border:"1px solid rgba(67,233,123,.3)", color:"var(--accent3)", borderRadius:12, padding:"12px 20px", fontWeight:600 }}>✅ Got it</button>
          <button className="btn-secondary" onClick={()=>{setFcIdx(i=>(i+1)%dataset.length);setFlipped(false);}}>Next →</button>
        </div>
      </div>
    );

    if(game==="memory") return (
      <div style={{ padding:24, overflow:"auto", height:"100%" }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:20 }}>
          <h3 className="syne" style={{ fontWeight:700 }}>Memory Match – {lang}</h3>
          <span style={{ color:"var(--accent)", fontWeight:600 }}>Score: {score} · {matched.length/2}/{cards.length/2} pairs</span>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:10, maxWidth:580 }}>
          {cards.map(card=>{
            const isFlipped=!!flippedCards.find(c=>c.id===card.id)||matched.includes(card.id);
            const isMatched=matched.includes(card.id);
            return (
              <button key={card.id} onClick={()=>flipCard(card)} style={{ aspectRatio:"1", borderRadius:10, border:`2px solid ${isMatched?"var(--accent3)":isFlipped?"var(--accent)":"var(--border)"}`, background:isMatched?"rgba(67,233,123,.1)":isFlipped?"rgba(108,99,255,.15)":"var(--card2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:600, color:isMatched?"var(--accent3)":isFlipped?"var(--accent)":"var(--text3)", transition:"all .2s", cursor:isMatched?"default":"pointer", padding:4, textAlign:"center", lineHeight:1.3 }}>
                {isFlipped?card.text:"?"}
              </button>
            );
          })}
        </div>
      </div>
    );

    if(game==="wordmatch") return (
      <div style={{ padding:32, overflow:"auto", height:"100%" }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:20 }}>
          <h3 className="syne" style={{ fontWeight:700 }}>Word Match – {lang}</h3>
          <span style={{ color:"var(--accent)", fontWeight:600 }}>Score: {score} · {wmMatched.length/2}/{wmLeft.length}</span>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 32px 1fr", gap:8, maxWidth:480 }}>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {wmLeft.map(w=>(
              <button key={w} onClick={()=>wmClick(w,"left")} style={{ padding:"12px 16px", borderRadius:10, border:`2px solid ${wmSel?.val===w&&wmSel?.side==="left"?"var(--accent)":wmMatched.includes(w)?"var(--accent3)":"var(--border)"}`, background:wmMatched.includes(w)?"rgba(67,233,123,.1)":wmSel?.val===w&&wmSel?.side==="left"?"rgba(108,99,255,.15)":"var(--card2)", color:wmMatched.includes(w)?"var(--accent3)":"var(--text)", fontWeight:500, fontSize:14, cursor:wmMatched.includes(w)?"default":"pointer", textDecoration:wmMatched.includes(w)?"line-through":"none" }}>{w}</button>
            ))}
          </div>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"space-around" }}>
            {wmLeft.map((_,i)=><div key={i} style={{ width:2, height:20, background:"var(--border)" }}/>)}
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {wmRight.map(w=>(
              <button key={w} onClick={()=>wmClick(w,"right")} style={{ padding:"12px 16px", borderRadius:10, border:`2px solid ${wmSel?.val===w&&wmSel?.side==="right"?"var(--accent)":wmMatched.includes(w)?"var(--accent3)":"var(--border)"}`, background:wmMatched.includes(w)?"rgba(67,233,123,.1)":wmSel?.val===w&&wmSel?.side==="right"?"rgba(108,99,255,.15)":"var(--card2)", color:wmMatched.includes(w)?"var(--accent3)":"var(--text)", fontWeight:500, fontSize:14, cursor:wmMatched.includes(w)?"default":"pointer", textDecoration:wmMatched.includes(w)?"line-through":"none" }}>{w}</button>
            ))}
          </div>
        </div>
      </div>
    );

    if(game==="spelling") return (
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", gap:20 }}>
        <div style={{ fontSize:14, color:"var(--text2)" }}>Q {qIdx+1}/{dataset.length} · Score: {score}</div>
        <div className="card" style={{ textAlign:"center", padding:40, minWidth:320 }}>
          <div style={{ fontSize:13, color:"var(--text2)", marginBottom:8 }}>How do you say this in {lang}?</div>
          <div className="syne" style={{ fontSize:34, fontWeight:800, marginBottom:20 }}>{current.answer}</div>
          <input className="input-field" id="spellInput" placeholder={`Type in ${lang}...`} style={{ textAlign:"center", fontSize:20 }}
            onKeyDown={e=>{
              if(e.key==="Enter"){
                const val=e.target.value.trim();
                const ok=val.toLowerCase()===current.word.toLowerCase();
                if(ok){setScore(s=>s+15);notify("✅ Perfect!","success","✅");}
                else notify(`❌ It was "${current.word}"`,"error","❌");
                e.target.value="";
                setTimeout(()=>{ if(qIdx+1>=dataset.length){setGameOver(true);}else{setQIdx(qi=>qi+1);} },900);
              }
            }}/>
          <div style={{ fontSize:12, color:"var(--text3)", marginTop:8 }}>Press Enter to submit</div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ height:"100%", display:"flex", flexDirection:"column" }}>
      <div style={{ padding:"14px 24px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", gap:12 }}>
        <button onClick={()=>setGame(null)} style={{ background:"none", color:"var(--text2)", fontSize:14 }}>← Games</button>
        <span style={{ color:"var(--border)" }}>|</span>
        <span className="syne" style={{ fontWeight:700 }}>{GAMES.find(g=>g.id===game)?.name}</span>
        <span className="tag" style={{ marginLeft:"auto" }}>{lang}</span>
      </div>
      <div style={{ flex:1, overflow:"auto" }}>{renderGame()}</div>
    </div>
  );
};

// ── Profile ───────────────────────────────────────────────────────────────────
const Profile = ({ user, setUser }) => {
  const [editing, setEditing] = useState(false);
  const [form,    setForm]    = useState(user);

  const save = () => { setUser({...user,...form}); setEditing(false); notify("Profile updated! ✅","success","✅"); };
  const earned   = BADGES.filter(b=>user.badges?.includes(b.id));

  return (
    <div style={{ padding:32, overflow:"auto", height:"100%", maxWidth:800, margin:"0 auto" }}>
      <div className="card" style={{ marginBottom:20 }}>
        <div style={{ display:"flex", alignItems:"flex-start", gap:24 }}>
          <div style={{ position:"relative" }}>
            <Avatar user={user} size={80}/>
            <button onClick={()=>notify("Photo upload coming soon!","info","📷")} style={{ position:"absolute", bottom:0, right:0, width:24, height:24, borderRadius:"50%", background:"var(--accent)", color:"white", fontSize:12, display:"flex", alignItems:"center", justifyContent:"center" }}>+</button>
          </div>
          <div style={{ flex:1 }}>
            {editing ? (
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                <input className="input-field" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Name"/>
                <textarea className="input-field" rows={3} value={form.bio||""} onChange={e=>setForm(f=>({...f,bio:e.target.value}))} placeholder="Bio" style={{ resize:"none" }}/>
                <div style={{ display:"flex", gap:10 }}>
                  <button className="btn-primary" onClick={save}>Save</button>
                  <button className="btn-secondary" onClick={()=>setEditing(false)}>Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:6 }}>
                  <h2 className="syne" style={{ fontSize:22, fontWeight:800 }}>{user.name}</h2>
                  <button onClick={()=>setEditing(true)} className="btn-secondary" style={{ padding:"4px 12px", fontSize:13 }}>Edit</button>
                </div>
                <p style={{ color:"var(--text2)", fontSize:14, marginBottom:10, lineHeight:1.6 }}>{user.bio||"No bio yet. Tell others about yourself!"}</p>
                <div style={{ display:"flex", gap:16, fontSize:13, color:"var(--text2)" }}>
                  <span>📍 {user.country||"Unknown"}</span>
                  <span>🎓 {user.educationLevel||"Unknown"}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:20 }}>
        {[{label:"Study Hours",value:user.studyHours,icon:"⏱",color:"var(--accent)"},{label:"Day Streak",value:user.studyStreak,icon:"🔥",color:"var(--accent4)"}].map(s=>(
          <div key={s.label} className="card" style={{ display:"flex", alignItems:"center", gap:16 }}>
            <span style={{ fontSize:30 }}>{s.icon}</span>
            <div><div className="syne" style={{ fontSize:26, fontWeight:800, color:s.color }}>{s.value}</div><div style={{ fontSize:13, color:"var(--text2)" }}>{s.label}</div></div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom:16 }}>
        <h3 className="syne" style={{ fontWeight:700, marginBottom:12, fontSize:16 }}>Subjects</h3>
        <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
          {(user.subjects||[]).map(s=><span key={s} className="tag">{s}</span>)}
          {!(user.subjects?.length)&&<span style={{ color:"var(--text2)", fontSize:14 }}>No subjects yet.</span>}
        </div>
      </div>

      <div className="card" style={{ marginBottom:16 }}>
        <h3 className="syne" style={{ fontWeight:700, marginBottom:12, fontSize:16 }}>Languages</h3>
        <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
          {(user.languages||[]).map(l=><span key={l} style={{ background:"rgba(67,233,123,.12)", color:"var(--accent3)", border:"1px solid rgba(67,233,123,.25)", borderRadius:8, padding:"4px 12px", fontSize:13 }}>{l}</span>)}
        </div>
      </div>

      <div className="card">
        <h3 className="syne" style={{ fontWeight:700, marginBottom:14, fontSize:16 }}>Badges</h3>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(110px,1fr))", gap:12 }}>
          {BADGES.map(b=>{
            const has=user.badges?.includes(b.id);
            return (
              <div key={b.id} title={b.desc} style={{ textAlign:"center", padding:14, borderRadius:12, background:has?"rgba(108,99,255,.1)":"var(--bg3)", border:`1px solid ${has?"rgba(108,99,255,.3)":"var(--border)"}`, opacity:has?1:.4 }}>
                <div style={{ fontSize:30, marginBottom:6, filter:has?"none":"grayscale(1)" }}>{b.icon}</div>
                <div style={{ fontSize:11, fontWeight:600, color:has?"var(--text)":"var(--text2)" }}>{b.name}</div>
                <div style={{ fontSize:10, color:"var(--text3)", marginTop:2 }}>{b.desc}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ── Root App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [user,    setUser]    = useState(null);
  const [page,    setPage]    = useState("dashboard");
  const [matches, setMatches] = useState([]);

  const onMatch  = useCallback(m => setMatches(ms=>[...ms.filter(x=>x.id!==m.id),m]),[]);
  const onLogout = () => { setUser(null); setPage("dashboard"); setMatches([]); notify("Logged out 👋","info","👋"); };

  if(!user) return (
    <>
      <NotificationToast/>
      <AuthScreen onLogin={u=>{ setUser(u); notify(`Welcome to P Partners, ${u.name.split(" ")[0]}! 🎉`,"success","🎓"); }}/>
    </>
  );

  const renderPage = () => {
    switch(page){
      case "dashboard": return <Dashboard user={user} matches={matches} onNav={setPage}/>;
      case "random":    return <RandomMatch user={user}/>;
      case "swipe":     return <SwipeDiscover user={user} onMatch={onMatch}/>;
      case "rooms":     return <StudyRooms user={user}/>;
      case "messages":  return <Messages user={user} matches={matches}/>;
      case "games":     return <LanguageGames/>;
      case "profile":   return <Profile user={user} setUser={setUser}/>;
      default:          return <Dashboard user={user} matches={matches} onNav={setPage}/>;
    }
  };

  return (
    <>
      <NotificationToast/>
      <div style={{ display:"flex", height:"100vh", overflow:"hidden" }}>
        <Sidebar user={user} page={page} onNav={setPage} matches={matches}/>
        <main style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column" }}>
          <header style={{ padding:"0 24px", height:56, borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0, background:"var(--bg2)" }}>
            <div className="syne" style={{ fontWeight:700, fontSize:15, color:"var(--text2)" }}>
              {NAV_ITEMS.find(n=>n.id===page)?.icon} {NAV_ITEMS.find(n=>n.id===page)?.label}
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <button onClick={()=>notify("Notifications coming soon!","info","🔔")} style={{ background:"none", color:"var(--text2)", fontSize:18, padding:"4px 8px", borderRadius:8 }}>🔔</button>
              <button onClick={onLogout} style={{ background:"rgba(255,101,132,.1)", color:"var(--accent2)", border:"1px solid rgba(255,101,132,.3)", borderRadius:8, padding:"5px 12px", fontSize:13, fontWeight:500 }}>Log out</button>
            </div>
          </header>
          <div style={{ flex:1, overflow:"hidden" }}>{renderPage()}</div>
        </main>
      </div>
    </>
  );
}
