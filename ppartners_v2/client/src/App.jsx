import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "./api.js";
import { connectSocket, disconnectSocket, getSocket } from "./socket.js";
import "./index.css";

// ── Constants ─────────────────────────────────────────────────────────────────
const SUBJECTS  = ["Mathematics","Physics","Chemistry","Biology","History","Literature","Computer Science","Economics","Philosophy","Languages","Art","Music","Engineering","Law","Medicine"];
const LANGUAGES = ["English","Spanish","French","German","Japanese","Mandarin","Arabic","Portuguese","Korean","Italian","Hindi","Russian"];
const COUNTRIES = ["Afghanistan","Albania","Algeria","Argentina","Australia","Austria","Bangladesh","Belgium","Bolivia","Brazil","Canada","Chile","China","Colombia","Croatia","Czech Republic","Denmark","Ecuador","Egypt","Ethiopia","Finland","France","Germany","Ghana","Greece","Hungary","India","Indonesia","Iran","Iraq","Ireland","Israel","Italy","Japan","Jordan","Kenya","Malaysia","Mexico","Morocco","Netherlands","New Zealand","Nigeria","Norway","Pakistan","Peru","Philippines","Poland","Portugal","Romania","Russia","Saudi Arabia","Serbia","Singapore","South Africa","South Korea","Spain","Sweden","Switzerland","Tanzania","Thailand","Tunisia","Turkey","Uganda","Ukraine","United Kingdom","United States","Venezuela","Vietnam"];
const EDU_LEVELS = ["High School","Undergraduate","Graduate","PhD","Self-Learner","Professional"];
const VOCAB_DATA = {
  Spanish:[{word:"Mariposa",answer:"Butterfly"},{word:"Cielo",answer:"Sky"},{word:"Lluvia",answer:"Rain"},{word:"Amigo",answer:"Friend"},{word:"Libro",answer:"Book"},{word:"Casa",answer:"House"},{word:"Perro",answer:"Dog"},{word:"Gato",answer:"Cat"},{word:"Agua",answer:"Water"},{word:"Fuego",answer:"Fire"},{word:"Sol",answer:"Sun"},{word:"Luna",answer:"Moon"}],
  French:[{word:"Papillon",answer:"Butterfly"},{word:"Ciel",answer:"Sky"},{word:"Pluie",answer:"Rain"},{word:"Ami",answer:"Friend"},{word:"Livre",answer:"Book"},{word:"Maison",answer:"House"},{word:"Chien",answer:"Dog"},{word:"Chat",answer:"Cat"},{word:"Eau",answer:"Water"},{word:"Feu",answer:"Fire"},{word:"Soleil",answer:"Sun"},{word:"Lune",answer:"Moon"}],
  Japanese:[{word:"蝶 (chō)",answer:"Butterfly"},{word:"空 (sora)",answer:"Sky"},{word:"雨 (ame)",answer:"Rain"},{word:"友達 (tomodachi)",answer:"Friend"},{word:"本 (hon)",answer:"Book"},{word:"家 (ie)",answer:"House"},{word:"犬 (inu)",answer:"Dog"},{word:"猫 (neko)",answer:"Cat"},{word:"水 (mizu)",answer:"Water"},{word:"火 (hi)",answer:"Fire"},{word:"太陽 (taiyō)",answer:"Sun"},{word:"月 (tsuki)",answer:"Moon"}],
  German:[{word:"Schmetterling",answer:"Butterfly"},{word:"Himmel",answer:"Sky"},{word:"Regen",answer:"Rain"},{word:"Freund",answer:"Friend"},{word:"Buch",answer:"Book"},{word:"Haus",answer:"House"},{word:"Hund",answer:"Dog"},{word:"Katze",answer:"Cat"},{word:"Wasser",answer:"Water"},{word:"Feuer",answer:"Fire"},{word:"Sonne",answer:"Sun"},{word:"Mond",answer:"Moon"}],
};
const BADGES = [
  {id:"first_session",name:"First Steps",    desc:"Complete first session",  icon:"🌱"},
  {id:"streak_7",     name:"Week Warrior",   desc:"7-day study streak",      icon:"🔥"},
  {id:"streak_30",    name:"Monthly Master", desc:"30-day streak",           icon:"⚡"},
  {id:"hours_10",     name:"Dedicated",      desc:"10 hours studied",        icon:"📚"},
  {id:"hours_100",    name:"Scholar",        desc:"100 hours studied",       icon:"🎓"},
  {id:"matches_5",    name:"Connector",      desc:"5 study matches",         icon:"🤝"},
  {id:"game_master",  name:"Game Master",    desc:"Score 100 in a game",     icon:"🏆"},
  {id:"polyglot",     name:"Polyglot",       desc:"Practice 3 languages",    icon:"🌍"},
];

// ── Utilities ─────────────────────────────────────────────────────────────────
const shuffle   = a => [...a].sort(() => Math.random() - .5);
const genId     = () => Math.random().toString(36).substr(2,9);
const initials  = n => n?.split(" ").map(w=>w[0]).join("").toUpperCase() || "?";
const fmtTime   = s => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
const fmtDate   = d => new Date(d).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});
const COLORS    = ["#7c6aff","#ff5f7e","#3de88a","#ffb347","#4fd1c5","#b794f4","#fc8181","#68d391"];
const userColor = u => u?.color || COLORS[(u?.name?.charCodeAt(0)||0) % COLORS.length];

// ── Toast system ──────────────────────────────────────────────────────────────
let _toast = null;
const toast = (msg, type="info", icon="💬") => _toast?.({ msg, type, icon, id:genId() });

const Toast = () => {
  const [t, setT] = useState(null);
  _toast = setT;
  useEffect(() => { if(!t) return; const x=setTimeout(()=>setT(null),3500); return ()=>clearTimeout(x); }, [t]);
  if(!t) return null;
  const c={info:"var(--accent)",success:"var(--accent3)",error:"var(--accent2)",warning:"var(--accent4)"};
  return (
    <div className="toast" style={{borderLeft:`3px solid ${c[t.type]}`}}>
      <span style={{fontSize:22}}>{t.icon}</span>
      <span style={{fontSize:14,fontWeight:500,flex:1}}>{t.msg}</span>
      <button onClick={()=>setT(null)} style={{color:"var(--text3)",fontSize:18,lineHeight:1}}>×</button>
    </div>
  );
};

// ── Avatar ────────────────────────────────────────────────────────────────────
const Avatar = ({user,size=40,style={}}) => {
  const c = userColor(user);
  return (
    <div style={{width:size,height:size,borderRadius:"50%",background:`linear-gradient(135deg,${c},${c}88)`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:size*.36,color:"white",flexShrink:0,boxShadow:`0 4px 14px ${c}44`,...style}}>
      {user?.emoji || initials(user?.name)}
    </div>
  );
};

// ── Spinner ───────────────────────────────────────────────────────────────────
const Spinner = ({size=32,color="var(--accent)"}) => (
  <div style={{width:size,height:size,borderRadius:"50%",border:`3px solid var(--border)`,borderTopColor:color,animation:"spin .8s linear infinite",flexShrink:0}}/>
);

// ── Landing Page ──────────────────────────────────────────────────────────────
const Landing = ({onGetStarted}) => {
  const features = [
    {icon:"⚡",title:"Random Match",desc:"Instantly connect with a compatible study partner worldwide"},
    {icon:"💫",title:"Swipe Discover",desc:"Browse student profiles and match with study partners"},
    {icon:"🏛",title:"Study Rooms",desc:"Join group study spaces organized by subject"},
    {icon:"🎮",title:"Language Games",desc:"Practice vocabulary with interactive games"},
    {icon:"💬",title:"Real-time Chat",desc:"Message your matches and study together"},
    {icon:"🏆",title:"Gamification",desc:"Earn badges and track your study streaks"},
  ];
  const stats = [{n:"10K+",l:"Students"},{n:"80+",l:"Countries"},{n:"50K+",l:"Sessions"},{n:"4.9★",l:"Rating"}];
  return (
    <div style={{minHeight:"100vh",background:"var(--bg)",overflow:"auto"}}>
      {/* Header */}
      <header style={{padding:"20px 40px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid var(--border)",position:"sticky",top:0,background:"rgba(7,7,15,.9)",backdropFilter:"blur(12px)",zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:40,height:40,borderRadius:12,background:"linear-gradient(135deg,var(--accent),#9f5cf6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>🎓</div>
          <span className="syne" style={{fontWeight:800,fontSize:20}}>P Partners</span>
        </div>
        <button className="btn btn-primary btn-sm" onClick={onGetStarted}>Get Started →</button>
      </header>

      {/* Hero */}
      <section style={{padding:"100px 40px 80px",textAlign:"center",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:"20%",left:"10%",width:400,height:400,borderRadius:"50%",background:"radial-gradient(circle,rgba(124,106,255,.12),transparent 70%)",pointerEvents:"none",animation:"orbMove 8s ease-in-out infinite"}}/>
        <div style={{position:"absolute",bottom:"10%",right:"10%",width:300,height:300,borderRadius:"50%",background:"radial-gradient(circle,rgba(255,95,126,.1),transparent 70%)",pointerEvents:"none",animation:"orbMove 10s ease-in-out infinite reverse"}}/>
        <div className="float" style={{fontSize:72,marginBottom:24}}>🎓</div>
        <h1 className="syne fade-up" style={{fontSize:"clamp(36px,6vw,72px)",fontWeight:800,lineHeight:1.1,marginBottom:20,background:"linear-gradient(135deg,var(--text),var(--accent))",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
          Study Together,<br/>Grow Together
        </h1>
        <p className="fade-up" style={{fontSize:"clamp(16px,2vw,20px)",color:"var(--text2)",maxWidth:580,margin:"0 auto 40px",lineHeight:1.7,animationDelay:".1s"}}>
          Connect with students worldwide. Match with study partners, join group rooms, practice languages, and level up your learning.
        </p>
        <div className="fade-up" style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap",animationDelay:".2s"}}>
          <button className="btn btn-primary btn-lg" onClick={onGetStarted}>Start Learning Free 🚀</button>
          <button className="btn btn-secondary btn-lg" onClick={onGetStarted}>Sign In</button>
        </div>
        {/* Stats */}
        <div className="fade-up" style={{display:"flex",gap:32,justifyContent:"center",marginTop:64,flexWrap:"wrap",animationDelay:".3s"}}>
          {stats.map(s=>(
            <div key={s.l} style={{textAlign:"center"}}>
              <div className="syne" style={{fontSize:28,fontWeight:800,color:"var(--accent)"}}>{s.n}</div>
              <div style={{fontSize:13,color:"var(--text2)"}}>{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{padding:"60px 40px",maxWidth:1100,margin:"0 auto"}}>
        <h2 className="syne" style={{fontSize:32,fontWeight:800,textAlign:"center",marginBottom:48}}>Everything you need to study smarter</h2>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:20}}>
          {features.map((f,i)=>(
            <div key={i} className="card fade-up" style={{animationDelay:`${i*.07}s`,transition:"all .2s"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--accent)";e.currentTarget.style.transform="translateY(-4px)";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.transform="translateY(0)";}}>
              <div style={{fontSize:36,marginBottom:14}}>{f.icon}</div>
              <h3 className="syne" style={{fontWeight:700,fontSize:17,marginBottom:8}}>{f.title}</h3>
              <p style={{color:"var(--text2)",fontSize:14,lineHeight:1.6}}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{padding:"80px 40px",textAlign:"center"}}>
        <div className="card" style={{maxWidth:600,margin:"0 auto",background:"linear-gradient(135deg,rgba(124,106,255,.12),rgba(255,95,126,.08))",borderColor:"rgba(124,106,255,.3)"}}>
          <h2 className="syne" style={{fontSize:28,fontWeight:800,marginBottom:12}}>Ready to find your study partner?</h2>
          <p style={{color:"var(--text2)",marginBottom:24}}>Join thousands of students already learning together on P Partners.</p>
          <button className="btn btn-primary btn-lg" onClick={onGetStarted}>Create Free Account →</button>
        </div>
      </section>

      <footer style={{borderTop:"1px solid var(--border)",padding:"24px 40px",textAlign:"center",color:"var(--text3)",fontSize:13}}>
        © 2024 P Partners — Global Collaborative Learning Platform
      </footer>
    </div>
  );
};

// ── Auth Screen ───────────────────────────────────────────────────────────────
const AuthScreen = ({onAuth}) => {
  const [mode, setMode]   = useState("login");
  const [step, setStep]   = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm]   = useState({name:"",email:"",password:"",confirmPassword:"",country:"",educationLevel:"",subjects:[],languages:[],bio:""});

  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const toggleArr = (k,v) => setForm(f=>({...f,[k]:f[k].includes(v)?f[k].filter(x=>x!==v):[...f[k],v]}));

  const validate = () => {
    if(mode==="login"){
      if(!form.email.trim()) return "Email is required";
      if(!/\S+@\S+\.\S+/.test(form.email)) return "Enter a valid email";
      if(!form.password) return "Password is required";
    } else {
      if(step===1){
        if(!form.name.trim()) return "Full name is required";
        if(!form.email.trim()) return "Email is required";
        if(!/\S+@\S+\.\S+/.test(form.email)) return "Enter a valid email";
        if(form.password.length < 8) return "Password must be at least 8 characters";
        if(form.password !== form.confirmPassword) return "Passwords do not match";
        if(!form.country) return "Please select your country";
        if(!form.educationLevel) return "Please select your education level";
      }
      if(step===2){
        if(form.subjects.length===0) return "Please select at least one subject";
        if(form.languages.length===0) return "Please select at least one language";
      }
    }
    return null;
  };

  const submit = async () => {
    const err = validate();
    if(err){ setError(err); return; }
    setError(""); setLoading(true);
    try {
      if(mode==="login"){
        const res = await api.login({email:form.email,password:form.password});
        api.setToken(res.token);
        onAuth(res.user);
        toast(`Welcome back, ${res.user.name.split(" ")[0]}! 👋`,"success","🎓");
      } else {
        if(step < 3){ setStep(s=>s+1); setLoading(false); return; }
        const res = await api.signup({name:form.name,email:form.email,password:form.password,country:form.country,educationLevel:form.educationLevel,subjects:form.subjects,languages:form.languages,bio:form.bio});
        api.setToken(res.token);
        onAuth(res.user);
        toast(`Welcome to P Partners, ${res.user.name.split(" ")[0]}! 🎉`,"success","🎓");
      }
    } catch(e){
      setError(e.message);
    }
    setLoading(false);
  };

  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"var(--bg)",padding:16,position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:"15%",left:"8%",width:360,height:360,borderRadius:"50%",background:"radial-gradient(circle,rgba(124,106,255,.13),transparent 70%)",pointerEvents:"none"}}/>
      <div style={{position:"absolute",bottom:"15%",right:"8%",width:280,height:280,borderRadius:"50%",background:"radial-gradient(circle,rgba(255,95,126,.1),transparent 70%)",pointerEvents:"none"}}/>

      <div style={{width:"100%",maxWidth:440}} className="fade-up">
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{width:56,height:56,borderRadius:16,background:"linear-gradient(135deg,var(--accent),#9f5cf6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,margin:"0 auto 14px",boxShadow:"0 8px 32px rgba(124,106,255,.4)"}}>🎓</div>
          <h1 className="syne" style={{fontSize:26,fontWeight:800}}>P Partners</h1>
          <p style={{color:"var(--text2)",fontSize:14,marginTop:4}}>Global collaborative learning</p>
        </div>

        <div className="card" style={{padding:28}}>
          {/* Mode toggle */}
          <div style={{display:"flex",background:"var(--bg3)",borderRadius:11,padding:3,marginBottom:24}}>
            {["login","signup"].map(m=>(
              <button key={m} onClick={()=>{setMode(m);setStep(1);setError("");}} style={{flex:1,padding:"8px 0",borderRadius:9,fontWeight:600,fontSize:14,transition:"all .2s",background:mode===m?"var(--card2)":"transparent",color:mode===m?"var(--text)":"var(--text2)",boxShadow:mode===m?"0 2px 8px rgba(0,0,0,.3)":"none"}}>
                {m==="login"?"Sign In":"Sign Up"}
              </button>
            ))}
          </div>

          {error && (
            <div style={{background:"rgba(255,95,126,.1)",border:"1px solid rgba(255,95,126,.3)",borderRadius:10,padding:"10px 14px",marginBottom:16,color:"var(--accent2)",fontSize:14,display:"flex",alignItems:"center",gap:8}}>
              ⚠️ {error}
            </div>
          )}

          {mode==="login" ? (
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <div>
                <label style={{fontSize:13,color:"var(--text2)",marginBottom:5,display:"block"}}>Email Address</label>
                <input className="input" type="email" placeholder="you@university.edu" value={form.email} onChange={e=>set("email",e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}/>
              </div>
              <div>
                <label style={{fontSize:13,color:"var(--text2)",marginBottom:5,display:"block"}}>Password</label>
                <input className="input" type="password" placeholder="••••••••" value={form.password} onChange={e=>set("password",e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}/>
              </div>
              <button className="btn btn-primary btn-full" onClick={submit} disabled={loading} style={{marginTop:4}}>
                {loading ? <Spinner size={18} color="white"/> : "Sign In →"}
              </button>
            </div>
          ) : (
            <div>
              <div style={{display:"flex",gap:5,marginBottom:20}}>
                {[1,2,3].map(s=>(
                  <div key={s} style={{flex:1,height:4,borderRadius:2,background:step>=s?"var(--accent)":"var(--border)",transition:"background .3s"}}/>
                ))}
              </div>

              {step===1 && (
                <div style={{display:"flex",flexDirection:"column",gap:13}} className="fade-in">
                  <div style={{fontSize:13,color:"var(--text2)",marginBottom:2,fontWeight:500}}>👤 Basic Information</div>
                  <input className="input" placeholder="Full Name *" value={form.name} onChange={e=>set("name",e.target.value)}/>
                  <input className="input" type="email" placeholder="Email Address *" value={form.email} onChange={e=>set("email",e.target.value)}/>
                  <input className="input" type="password" placeholder="Password * (min 8 chars)" value={form.password} onChange={e=>set("password",e.target.value)}/>
                  <input className="input" type="password" placeholder="Confirm Password *" value={form.confirmPassword} onChange={e=>set("confirmPassword",e.target.value)}/>
                  <select className="input" value={form.country} onChange={e=>set("country",e.target.value)}>
                    <option value="">Select Country *</option>
                    {COUNTRIES.map(c=><option key={c}>{c}</option>)}
                  </select>
                  <select className="input" value={form.educationLevel} onChange={e=>set("educationLevel",e.target.value)}>
                    <option value="">Education Level *</option>
                    {EDU_LEVELS.map(l=><option key={l}>{l}</option>)}
                  </select>
                </div>
              )}

              {step===2 && (
                <div className="fade-in">
                  <div style={{fontSize:13,color:"var(--text2)",marginBottom:10,fontWeight:500}}>📚 Subjects (select at least 1)</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:7,marginBottom:18}}>
                    {SUBJECTS.map(s=>(
                      <button key={s} onClick={()=>toggleArr("subjects",s)} style={{padding:"5px 12px",borderRadius:8,fontSize:13,fontWeight:500,background:form.subjects.includes(s)?"rgba(124,106,255,.2)":"var(--bg3)",color:form.subjects.includes(s)?"var(--accent)":"var(--text2)",border:form.subjects.includes(s)?"1px solid rgba(124,106,255,.4)":"1px solid var(--border)",transition:"all .15s"}}>{s}</button>
                    ))}
                  </div>
                  <div style={{fontSize:13,color:"var(--text2)",marginBottom:10,fontWeight:500}}>🌍 Languages you speak (select at least 1)</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
                    {LANGUAGES.map(l=>(
                      <button key={l} onClick={()=>toggleArr("languages",l)} style={{padding:"5px 12px",borderRadius:8,fontSize:13,fontWeight:500,background:form.languages.includes(l)?"rgba(61,232,138,.15)":"var(--bg3)",color:form.languages.includes(l)?"var(--accent3)":"var(--text2)",border:form.languages.includes(l)?"1px solid rgba(61,232,138,.3)":"1px solid var(--border)",transition:"all .15s"}}>{l}</button>
                    ))}
                  </div>
                </div>
              )}

              {step===3 && (
                <div style={{display:"flex",flexDirection:"column",gap:13}} className="fade-in">
                  <div style={{fontSize:13,color:"var(--text2)",fontWeight:500}}>✍️ About You (optional)</div>
                  <textarea className="input" rows={4} placeholder="Tell others what you want to learn and what you can teach..." value={form.bio} onChange={e=>set("bio",e.target.value)} style={{resize:"none"}}/>
                  <div style={{background:"rgba(124,106,255,.08)",border:"1px solid rgba(124,106,255,.2)",borderRadius:10,padding:14,fontSize:13,color:"var(--text2)"}}>
                    🎉 Almost there! Click <strong style={{color:"var(--text)"}}>Create Account</strong> to join P Partners.
                  </div>
                </div>
              )}

              <button className="btn btn-primary btn-full" onClick={submit} disabled={loading} style={{marginTop:18}}>
                {loading ? <Spinner size={18} color="white"/> : step<3 ? "Continue →" : "Create Account 🚀"}
              </button>
              {step>1 && <button onClick={()=>setStep(s=>s-1)} style={{width:"100%",marginTop:10,color:"var(--text2)",fontSize:13,background:"none",textAlign:"center"}}>← Back</button>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Sidebar ───────────────────────────────────────────────────────────────────
const NAV = [
  {id:"dashboard",icon:"🏠",label:"Dashboard"},
  {id:"random",   icon:"⚡",label:"Random Match"},
  {id:"swipe",    icon:"💫",label:"Discover"},
  {id:"rooms",    icon:"🏛",label:"Study Rooms"},
  {id:"messages", icon:"💬",label:"Messages"},
  {id:"games",    icon:"🎮",label:"Language Games"},
  {id:"profile",  icon:"👤",label:"Profile"},
];

const Sidebar = ({user,page,onNav,unread,onLogout}) => {
  const [collapsed,setCollapsed] = useState(false);
  return (
    <aside style={{width:collapsed?68:220,flexShrink:0,background:"var(--bg2)",borderRight:"1px solid var(--border)",display:"flex",flexDirection:"column",padding:"18px 10px",transition:"width .3s ease",overflow:"hidden",position:"relative",zIndex:10}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24,paddingLeft:4}}>
        {!collapsed && <span className="syne" style={{fontWeight:800,fontSize:17,whiteSpace:"nowrap"}}>P Partners</span>}
        <button onClick={()=>setCollapsed(c=>!c)} style={{color:"var(--text2)",fontSize:17,padding:4,borderRadius:8,background:"none"}}>{collapsed?"→":"←"}</button>
      </div>
      <nav style={{display:"flex",flexDirection:"column",gap:3,flex:1}}>
        {NAV.map(item=>(
          <button key={item.id} onClick={()=>onNav(item.id)} className={`nav-link ${page===item.id?"active":""}`} style={{justifyContent:collapsed?"center":"flex-start"}}>
            <span style={{fontSize:17,flexShrink:0}}>{item.icon}</span>
            {!collapsed && <span style={{whiteSpace:"nowrap",flex:1}}>{item.label}</span>}
            {!collapsed && item.id==="messages" && unread>0 && (
              <span style={{background:"var(--accent2)",color:"white",borderRadius:"50%",width:18,height:18,fontSize:11,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,flexShrink:0}}>{unread}</span>
            )}
          </button>
        ))}
      </nav>
      <div style={{borderTop:"1px solid var(--border)",paddingTop:14,marginTop:8}}>
        <div style={{display:"flex",alignItems:"center",gap:10,paddingLeft:4,overflow:"hidden",marginBottom:10}}>
          <Avatar user={user} size={30}/>
          {!collapsed && (
            <div style={{overflow:"hidden",flex:1}}>
              <div style={{fontWeight:600,fontSize:13,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{user.name}</div>
              <div style={{fontSize:11,color:"var(--accent3)",display:"flex",alignItems:"center",gap:4}}>
                <span style={{width:6,height:6,borderRadius:"50%",background:"var(--accent3)",display:"inline-block"}}/>Online
              </div>
            </div>
          )}
        </div>
        {!collapsed && (
          <button onClick={onLogout} className="btn btn-danger btn-sm" style={{width:"100%",fontSize:12}}>Log Out</button>
        )}
      </div>
    </aside>
  );
};

// ── Mobile Nav ────────────────────────────────────────────────────────────────
const MobileNav = ({page,onNav}) => (
  <nav style={{position:"fixed",bottom:0,left:0,right:0,background:"var(--bg2)",borderTop:"1px solid var(--border)",display:"flex",zIndex:100,padding:"8px 0"}}>
    {NAV.slice(0,5).map(item=>(
      <button key={item.id} onClick={()=>onNav(item.id)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"6px 0",color:page===item.id?"var(--accent)":"var(--text3)",fontSize:10,fontWeight:500,background:"none"}}>
        <span style={{fontSize:20}}>{item.icon}</span>
        <span>{item.label.split(" ")[0]}</span>
      </button>
    ))}
  </nav>
);

// ── Dashboard ─────────────────────────────────────────────────────────────────
const Dashboard = ({user,onNav}) => {
  const [matches,setMatches] = useState([]);
  const [loading,setLoading] = useState(true);

  useEffect(()=>{
    api.getMatches().then(r=>setMatches(r.matches||[])).catch(()=>{}).finally(()=>setLoading(false));
  },[]);

  const earned = BADGES.filter(b=>user.badges?.includes(b.id));
  const stats  = [
    {label:"Study Hours",   value: (user.studyHours||0).toFixed(1), icon:"⏱", color:"var(--accent)"},
    {label:"Day Streak",    value: user.studyStreak||0,              icon:"🔥", color:"var(--accent4)"},
    {label:"Matches",       value: matches.length,                   icon:"🤝", color:"var(--accent3)"},
    {label:"Badges",        value: user.badges?.length||0,           icon:"🏆", color:"var(--accent2)"},
  ];

  return (
    <div style={{padding:"24px",overflow:"auto",height:"100%",maxWidth:1100,margin:"0 auto"}}>
      <div style={{marginBottom:28}} className="fade-up">
        <div style={{display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
          <Avatar user={user} size={52}/>
          <div>
            <h2 className="syne" style={{fontSize:"clamp(20px,3vw,26px)",fontWeight:800}}>Welcome back, {user.name.split(" ")[0]}! 👋</h2>
            <p style={{color:"var(--text2)",fontSize:14}}>{user.educationLevel||"Student"} · {user.country||"Worldwide"}</p>
          </div>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:14,marginBottom:24}}>
        {stats.map((s,i)=>(
          <div key={i} className="card fade-up" style={{animationDelay:`${i*.07}s`,display:"flex",flexDirection:"column",gap:6,padding:18}}>
            <span style={{fontSize:24}}>{s.icon}</span>
            <span className="syne" style={{fontSize:26,fontWeight:800,color:s.color}}>{s.value}</span>
            <span style={{fontSize:12,color:"var(--text2)"}}>{s.label}</span>
          </div>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:18}}>
        {/* Quick Actions */}
        <div className="card fade-up" style={{animationDelay:".18s"}}>
          <h3 className="syne" style={{fontWeight:700,marginBottom:14,fontSize:15}}>Quick Actions</h3>
          <div style={{display:"flex",flexDirection:"column",gap:9}}>
            {[
              {icon:"⚡",label:"Random Study Session",  action:"random", color:"var(--accent)"},
              {icon:"💫",label:"Discover Partners",      action:"swipe",  color:"var(--accent2)"},
              {icon:"🏛",label:"Join a Study Room",      action:"rooms",  color:"var(--accent3)"},
              {icon:"🎮",label:"Play Language Games",    action:"games",  color:"var(--accent4)"},
            ].map(a=>(
              <button key={a.action} onClick={()=>onNav(a.action)} style={{background:"var(--bg3)",border:"1px solid var(--border)",borderRadius:11,padding:"11px 14px",display:"flex",alignItems:"center",gap:10,textAlign:"left",transition:"all .2s",color:"var(--text)",width:"100%"}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=a.color;e.currentTarget.style.transform="translateX(3px)";}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.transform="none";}}>
                <span style={{fontSize:20}}>{a.icon}</span>
                <span style={{fontWeight:500,fontSize:14}}>{a.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Subjects */}
        <div className="card fade-up" style={{animationDelay:".22s"}}>
          <h3 className="syne" style={{fontWeight:700,marginBottom:14,fontSize:15}}>Your Subjects</h3>
          {(user.subjects||[]).length===0 ? (
            <div style={{color:"var(--text2)",fontSize:14}}>No subjects yet. <button onClick={()=>onNav("profile")} style={{color:"var(--accent)",background:"none",fontSize:14,textDecoration:"underline"}}>Edit profile</button></div>
          ) : (
            <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
              {user.subjects.map(s=><span key={s} className="tag">{s}</span>)}
            </div>
          )}
          <div style={{height:1,background:"var(--border)",margin:"16px 0"}}/>
          <h3 className="syne" style={{fontWeight:700,marginBottom:10,fontSize:15}}>Languages</h3>
          <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
            {(user.languages||[]).map(l=><span key={l} className="tag-green">{l}</span>)}
          </div>
        </div>

        {/* Badges */}
        <div className="card fade-up" style={{animationDelay:".26s"}}>
          <h3 className="syne" style={{fontWeight:700,marginBottom:14,fontSize:15}}>Badges {earned.length}/{BADGES.length}</h3>
          {earned.length===0 ? (
            <div style={{color:"var(--text2)",fontSize:14}}>Complete activities to earn badges! 🌟</div>
          ) : (
            <div style={{display:"flex",flexWrap:"wrap",gap:10}}>
              {earned.map(b=><div key={b.id} title={b.desc} style={{textAlign:"center"}}><div style={{fontSize:26}}>{b.icon}</div><div style={{fontSize:10,color:"var(--text2)",marginTop:3}}>{b.name}</div></div>)}
            </div>
          )}
        </div>

        {/* Recent Matches */}
        <div className="card fade-up" style={{animationDelay:".3s"}}>
          <h3 className="syne" style={{fontWeight:700,marginBottom:14,fontSize:15}}>Recent Matches</h3>
          {loading ? <Spinner/> : matches.length===0 ? (
            <div style={{color:"var(--text2)",fontSize:14}}>No matches yet. <button onClick={()=>onNav("swipe")} style={{color:"var(--accent)",background:"none",fontSize:14,textDecoration:"underline"}}>Start discovering!</button></div>
          ) : matches.slice(0,4).map(m=>{
            const partner = m.user1Id?._id===user._id ? m.user2Id : m.user1Id;
            return partner ? (
              <div key={m._id} style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
                <Avatar user={partner} size={36}/>
                <div style={{flex:1,overflow:"hidden"}}>
                  <div style={{fontSize:14,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{partner.name}</div>
                  <div style={{fontSize:12,color:"var(--text2)"}}>{partner.country}</div>
                </div>
                <button onClick={()=>onNav("messages")} className="btn btn-secondary btn-sm">Chat</button>
              </div>
            ) : null;
          })}
        </div>
      </div>
    </div>
  );
};

// ── Random Match ──────────────────────────────────────────────────────────────
const RandomMatch = ({user}) => {
  const [state,   setState]   = useState("idle");
  const [partner, setPartner] = useState(null);
  const [sessionId,setSessionId] = useState(null);
  const [messages,setMessages] = useState([]);
  const [input,   setInput]   = useState("");
  const [sessionTime,setSessionTime] = useState(0);
  const [pomodoro,setPomodoro] = useState({running:false,seconds:25*60,phase:"focus"});
  const messagesEnd = useRef(null);
  const timerRef    = useRef(null);
  const pomRef      = useRef(null);

  useEffect(()=>{
    if(state!=="session") return;
    timerRef.current = setInterval(()=>setSessionTime(s=>s+1),1000);
    return ()=>clearInterval(timerRef.current);
  },[state]);

  useEffect(()=>{
    if(!pomodoro.running){ clearInterval(pomRef.current); return; }
    pomRef.current = setInterval(()=>{
      setPomodoro(p=>{
        if(p.seconds<=1){
          toast(p.phase==="focus"?"Break time! 🎉":"Focus time! 💪","success");
          return {running:false,seconds:p.phase==="focus"?5*60:25*60,phase:p.phase==="focus"?"break":"focus"};
        }
        return {...p,seconds:p.seconds-1};
      });
    },1000);
    return ()=>clearInterval(pomRef.current);
  },[pomodoro.running]);

  useEffect(()=>{ messagesEnd.current?.scrollIntoView({behavior:"smooth"}); },[messages]);

  // Socket event listeners for matching
  useEffect(()=>{
    const s = getSocket();
    if(!s) return;
    const onMatch = ({sessionId:sid,partner:p}) => {
      setPartner(p); setSessionId(sid); setState("matched");
      setTimeout(()=>{
        setState("session");
        setMessages([{id:genId(),sender:"partner",text:`Hi! I'm ${p.name} from ${p.country}. Ready to study? 📚`,time:new Date()}]);
      },1800);
    };
    const onMsg = (msg) => setMessages(m=>[...m,{...msg,sender:"partner",id:genId()}]);
    const onEnd = () => { toast("Your partner ended the session","info","👋"); endSession(false); };
    s.on("match:found",    onMatch);
    s.on("session:message",onMsg);
    s.on("session:ended",  onEnd);
    return ()=>{ s.off("match:found",onMatch); s.off("session:message",onMsg); s.off("session:ended",onEnd); };
  },[]);

  const startSearch = () => {
    setState("searching");
    const s = getSocket();
    s?.emit("queue:join",{subjects:user.subjects,languages:user.languages});
    api.joinQueue({subjects:user.subjects,languages:user.languages}).catch(()=>{});
  };

  const cancelSearch = () => {
    setState("idle");
    const s = getSocket();
    s?.emit("queue:leave");
    api.leaveQueue().catch(()=>{});
  };

  const sendMsg = () => {
    if(!input.trim()) return;
    const msg = {id:genId(),sender:"me",text:input,time:new Date()};
    setMessages(m=>[...m,msg]);
    getSocket()?.emit("session:message",{sessionId,text:input});
    setInput("");
  };

  const endSession = async (emit=true) => {
    if(emit){
      getSocket()?.emit("session:end",{sessionId,duration:sessionTime});
      try{ await api.endSession({sessionId,duration:sessionTime}); }catch(e){}
      toast(`Session ended! ${Math.floor(sessionTime/60)}m studied 🎓`,"success","🎓");
    }
    clearInterval(timerRef.current);
    clearInterval(pomRef.current);
    setState("idle"); setPartner(null); setSessionId(null);
    setMessages([]); setSessionTime(0);
    setPomodoro({running:false,seconds:25*60,phase:"focus"});
  };

  const pct  = pomodoro.seconds/(pomodoro.phase==="focus"?25*60:5*60);
  const circ = 2*Math.PI*52;

  if(state==="idle") return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",padding:32,textAlign:"center"}}>
      <div className="float" style={{fontSize:72,marginBottom:24}}>⚡</div>
      <h2 className="syne" style={{fontSize:"clamp(24px,4vw,32px)",fontWeight:800,marginBottom:12}}>Random Study Match</h2>
      <p style={{color:"var(--text2)",maxWidth:420,lineHeight:1.7,marginBottom:32,fontSize:15}}>
        Get instantly matched with a compatible student worldwide based on your subjects, languages, and timezone.
      </p>
      <div style={{display:"flex",gap:10,marginBottom:36,flexWrap:"wrap",justifyContent:"center"}}>
        {["Video Call","Live Chat","Pomodoro Timer","Skip Anytime"].map(f=><span key={f} className="tag">{f}</span>)}
      </div>
      <button className="btn btn-primary btn-lg" onClick={startSearch}>Find Study Partner ⚡</button>
    </div>
  );

  if(state==="searching") return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",gap:28,padding:32,textAlign:"center"}}>
      <div style={{position:"relative",width:100,height:100}}>
        <div style={{position:"absolute",inset:0,borderRadius:"50%",border:"3px solid var(--border)",borderTopColor:"var(--accent)",animation:"spin 1s linear infinite"}}/>
        <div style={{position:"absolute",inset:10,borderRadius:"50%",border:"2px solid var(--border)",borderBottomColor:"var(--accent2)",animation:"spin 1.5s linear infinite reverse"}}/>
        <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:32}}>⚡</div>
      </div>
      <div>
        <h3 className="syne" style={{fontSize:22,fontWeight:700,marginBottom:8}}>Looking for your study partner...</h3>
        <p style={{color:"var(--text2)",marginBottom:4}}>Matching based on your subjects and languages</p>
        <p style={{color:"var(--text3)",fontSize:13}}>This may take a moment — we're finding the best match for you</p>
      </div>
      <div className="card" style={{padding:16,display:"flex",gap:16,flexWrap:"wrap",justifyContent:"center"}}>
        {(user.subjects||[]).slice(0,3).map(s=><span key={s} className="tag">{s}</span>)}
        {(user.languages||[]).slice(0,2).map(l=><span key={l} className="tag-green">{l}</span>)}
      </div>
      <button className="btn btn-secondary" onClick={cancelSearch}>Cancel Search</button>
    </div>
  );

  if(state==="matched") return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",gap:16}} className="fade-up">
      <div style={{fontSize:64}}>🎉</div>
      <h3 className="syne" style={{fontSize:26,fontWeight:800}}>Match Found!</h3>
      <Avatar user={partner} size={80}/>
      <div style={{textAlign:"center"}}>
        <p style={{fontSize:20,fontWeight:700}}>{partner?.name}</p>
        <p style={{color:"var(--text2)"}}>{partner?.country} · {partner?.educationLevel}</p>
      </div>
      <p style={{color:"var(--accent3)",fontWeight:500}}>Starting session...</p>
    </div>
  );

  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr min(300px,35%)",height:"100%",overflow:"hidden"}}>
      <div style={{display:"flex",flexDirection:"column",borderRight:"1px solid var(--border)",overflow:"hidden"}}>
        {/* Simulated video */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,padding:14,flexShrink:0}}>
          {[{u:partner,label:"Partner"},{u:user,label:"You (Camera Off)"}].map(({u,label})=>(
            <div key={label} style={{background:"var(--bg3)",borderRadius:12,aspectRatio:"16/9",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8,position:"relative",border:"1px solid var(--border)"}}>
              <Avatar user={u} size={44}/>
              <span style={{fontSize:13,fontWeight:500,color:"var(--text2)"}}>{u?.name}</span>
              <span style={{position:"absolute",bottom:6,left:10,fontSize:11,color:"var(--text2)"}}>{label}</span>
              <span style={{position:"absolute",top:6,right:8,fontSize:10,background:"rgba(61,232,138,.2)",color:"var(--accent3)",padding:"2px 7px",borderRadius:5,fontWeight:600}}>LIVE</span>
            </div>
          ))}
        </div>
        {/* Chat */}
        <div style={{flex:1,overflow:"auto",padding:"0 14px",display:"flex",flexDirection:"column",gap:10}}>
          {messages.map(m=>(
            <div key={m.id} style={{display:"flex",flexDirection:"column",alignItems:m.sender==="me"?"flex-end":"flex-start"}} className="fade-up">
              {m.sender!=="me"&&<span style={{fontSize:11,color:"var(--text2)",marginBottom:3}}>{partner?.name}</span>}
              <div className={`bubble ${m.sender==="me"?"bubble-out":"bubble-in"}`}>{m.text}</div>
              <span style={{fontSize:10,color:"var(--text3)",marginTop:2}}>{fmtDate(m.time)}</span>
            </div>
          ))}
          <div ref={messagesEnd}/>
        </div>
        <div style={{padding:12,display:"flex",gap:9,flexShrink:0}}>
          <input className="input" style={{flex:1}} placeholder="Type a message..." value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendMsg()}/>
          <button className="btn btn-primary" onClick={sendMsg} style={{padding:"10px 16px"}}>Send</button>
        </div>
      </div>

      {/* Right panel */}
      <div style={{display:"flex",flexDirection:"column",overflow:"auto"}}>
        <div style={{padding:16,borderBottom:"1px solid var(--border)"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
            <Avatar user={partner} size={38}/>
            <div style={{flex:1,overflow:"hidden"}}>
              <div style={{fontWeight:600,fontSize:14,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{partner?.name}</div>
              <div style={{fontSize:12,color:"var(--text2)"}}>{partner?.country}</div>
            </div>
            <span style={{fontSize:13,color:"var(--accent3)",fontWeight:600,flexShrink:0}}>{fmtTime(sessionTime)}</span>
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
            {partner?.subjects?.slice(0,3).map(s=><span key={s} className="tag" style={{fontSize:11,padding:"2px 8px"}}>{s}</span>)}
          </div>
        </div>

        {/* Pomodoro */}
        <div style={{padding:16,borderBottom:"1px solid var(--border)",textAlign:"center"}}>
          <div className="syne" style={{fontSize:11,fontWeight:700,color:"var(--text2)",textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Pomodoro Timer</div>
          <div style={{position:"relative",width:118,height:118,margin:"0 auto 10px"}}>
            <svg width="118" height="118" style={{transform:"rotate(-90deg)"}}>
              <circle cx="59" cy="59" r="52" fill="none" stroke="var(--border)" strokeWidth="7"/>
              <circle cx="59" cy="59" r="52" fill="none" stroke={pomodoro.phase==="focus"?"var(--accent)":"var(--accent3)"} strokeWidth="7" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ*(1-pct)} className="timer-ring"/>
            </svg>
            <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
              <div className="syne" style={{fontSize:20,fontWeight:700}}>{fmtTime(pomodoro.seconds)}</div>
              <div style={{fontSize:10,color:"var(--text2)",textTransform:"uppercase"}}>{pomodoro.phase}</div>
            </div>
          </div>
          <button onClick={()=>setPomodoro(p=>({...p,running:!p.running}))} className={`btn ${pomodoro.running?"btn-secondary":"btn-primary"} btn-sm`} style={{width:"100%"}}>
            {pomodoro.running?"⏸ Pause":"▶ Start"}
          </button>
        </div>

        {/* Actions */}
        <div style={{padding:14,display:"flex",flexDirection:"column",gap:9,marginTop:"auto"}}>
          <button onClick={()=>{ toast(`${partner?.name} added to friends! 🤝`,"success","🤝"); }} className="btn btn-secondary btn-sm" style={{width:"100%",borderColor:"var(--accent3)",color:"var(--accent3)"}}>➕ Add Friend</button>
          <button onClick={()=>toast("User reported","info","🚩")} className="btn btn-ghost btn-sm" style={{width:"100%",fontSize:12}}>🚩 Report User</button>
          <button onClick={()=>endSession(true)} className="btn btn-danger btn-sm" style={{width:"100%"}}>⏹ End Session</button>
        </div>
      </div>
    </div>
  );
};

// ── Swipe Discover ────────────────────────────────────────────────────────────
const SwipeDiscover = ({user}) => {
  const [profiles,  setProfiles]  = useState([]);
  const [current,   setCurrent]   = useState(0);
  const [swipeAnim, setSwipeAnim] = useState(null);
  const [matches,   setMatches]   = useState([]);
  const [showModal, setShowModal] = useState(null);
  const [loading,   setLoading]   = useState(true);

  useEffect(()=>{
    api.discover().then(r=>{ setProfiles(shuffle(r.users||[])); setLoading(false); }).catch(()=>setLoading(false));
    api.getMatches().then(r=>setMatches(r.matches||[])).catch(()=>{});
  },[]);

  const doSwipe = async (dir) => {
    const p = profiles[current];
    if(!p) return;
    setSwipeAnim(dir);
    try{
      const res = await api.swipe({targetUserId:p._id,direction:dir});
      if(res.matched){
        setMatches(ms=>[...ms,{_id:genId(),user2Id:p}]);
        setShowModal(p);
        toast(`It's a match with ${p.name}! 🎉`,"success","💫");
      }
    }catch(e){ toast(e.message,"error","❌"); }
    setTimeout(()=>{ setCurrent(c=>c+1); setSwipeAnim(null); },400);
  };

  if(loading) return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%"}}><Spinner size={48}/></div>;

  const p = profiles[current];

  if(!p||current>=profiles.length) return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",gap:20,padding:32,textAlign:"center"}}>
      <div style={{fontSize:64}}>✨</div>
      <h3 className="syne" style={{fontSize:22,fontWeight:700}}>You've seen everyone!</h3>
      <p style={{color:"var(--text2)"}}>Check back later for new study partners.</p>
      <button className="btn btn-primary" onClick={()=>{ api.discover().then(r=>{ setProfiles(shuffle(r.users||[])); setCurrent(0); }).catch(()=>{}); }}>Refresh 🔄</button>
    </div>
  );

  return (
    <div style={{display:"flex",gap:24,height:"100%",padding:24,overflow:"auto",alignItems:"flex-start",justifyContent:"center",flexWrap:"wrap"}}>
      <div style={{flex:"0 0 340px",maxWidth:"100%"}}>
        <div style={{position:"relative",height:490}}>
          {profiles.slice(current,current+2).reverse().map((prof,i)=>{
            const isTop = i===(Math.min(2,profiles.length-current)-1);
            const c     = userColor(prof);
            return (
              <div key={prof._id} style={{position:"absolute",width:"100%",height:"100%",borderRadius:20,overflow:"hidden",background:`linear-gradient(160deg,${c}1a,var(--card))`,border:`1px solid ${c}33`,transform:isTop?"none":"scale(0.95) translateY(14px)",animation:isTop&&swipeAnim?(swipeAnim==="left"?"swipeL .4s forwards":"swipeR .4s forwards"):"none",zIndex:isTop?2:1,boxShadow:isTop?"0 20px 60px rgba(0,0,0,.4)":"none"}}>
                <div style={{height:"46%",display:"flex",alignItems:"center",justifyContent:"center",background:`radial-gradient(circle at 50% 100%,${c}2a,transparent 70%)`}}>
                  <div style={{width:100,height:100,borderRadius:"50%",background:`linear-gradient(135deg,${c},${c}88)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:46,boxShadow:`0 8px 32px ${c}55`}}>
                    {prof.emoji||initials(prof.name)}
                  </div>
                </div>
                <div style={{padding:20}}>
                  <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:4}}>
                    <h3 className="syne" style={{fontSize:20,fontWeight:800}}>{prof.name}</h3>
                    <span style={{color:"var(--text2)",fontSize:13}}>{prof.educationLevel}</span>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10,color:"var(--text2)",fontSize:13}}>
                    <span>📍 {prof.country}</span>
                    {prof.studyStreak>0&&<><span>·</span><span>🔥 {prof.studyStreak}d</span></>}
                  </div>
                  {prof.bio&&<p style={{color:"var(--text2)",fontSize:13,lineHeight:1.6,marginBottom:12,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{prof.bio}</p>}
                  <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                    {prof.subjects?.slice(0,3).map(s=><span key={s} className="tag" style={{fontSize:11,padding:"3px 9px"}}>{s}</span>)}
                    {prof.languages?.slice(0,2).map(l=><span key={l} className="tag-green" style={{fontSize:11,padding:"3px 9px"}}>{l}</span>)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{display:"flex",justifyContent:"center",gap:20,marginTop:18}}>
          <button onClick={()=>doSwipe("left")}  style={{width:62,height:62,borderRadius:"50%",background:"rgba(255,95,126,.1)",border:"2px solid rgba(255,95,126,.35)",color:"var(--accent2)",fontSize:24,transition:"all .2s"}} onMouseEnter={e=>e.currentTarget.style.transform="scale(1.1)"} onMouseLeave={e=>e.currentTarget.style.transform="none"}>✕</button>
          <button onClick={()=>doSwipe("right")} style={{width:62,height:62,borderRadius:"50%",background:"rgba(61,232,138,.1)", border:"2px solid rgba(61,232,138,.35)", color:"var(--accent3)",fontSize:24,transition:"all .2s"}} onMouseEnter={e=>e.currentTarget.style.transform="scale(1.1)"} onMouseLeave={e=>e.currentTarget.style.transform="none"}>♥</button>
        </div>
        <div style={{textAlign:"center",marginTop:10,fontSize:13,color:"var(--text3)"}}>{profiles.length-current} profiles remaining</div>
      </div>

      {/* Matches */}
      <div style={{flex:"0 0 240px",maxWidth:"100%"}}>
        <h3 className="syne" style={{fontSize:15,fontWeight:700,marginBottom:14}}>Your Matches ({matches.length})</h3>
        {matches.length===0 ? (
          <div className="card" style={{textAlign:"center",color:"var(--text2)",fontSize:14,padding:20}}>Swipe right to match! 💫</div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:9}}>
            {matches.map(m=>{
              const partner = m.user2Id?._id===user._id ? m.user1Id : m.user2Id;
              return partner ? (
                <div key={m._id} className="card" style={{display:"flex",alignItems:"center",gap:11,padding:13}}>
                  <Avatar user={partner} size={40}/>
                  <div style={{flex:1,overflow:"hidden"}}><div style={{fontWeight:600,fontSize:14,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{partner.name}</div><div style={{fontSize:12,color:"var(--text2)"}}>{partner.country}</div></div>
                  <span style={{width:8,height:8,borderRadius:"50%",background:"var(--accent3)",flexShrink:0}}/>
                </div>
              ) : null;
            })}
          </div>
        )}
      </div>

      {showModal&&(
        <div className="modal-overlay" onClick={()=>setShowModal(null)}>
          <div className="modal" style={{textAlign:"center"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:60,marginBottom:14}}>💫</div>
            <h2 className="syne" style={{fontSize:26,fontWeight:800,marginBottom:8}}>It's a Match!</h2>
            <Avatar user={showModal} size={72} style={{margin:"0 auto 12px"}}/>
            <p style={{fontWeight:600,fontSize:18}}>{showModal.name}</p>
            <p style={{color:"var(--text2)",marginBottom:24}}>{showModal.country} · {showModal.educationLevel}</p>
            <div style={{display:"flex",gap:11}}>
              <button className="btn btn-secondary" style={{flex:1}} onClick={()=>setShowModal(null)}>Keep Swiping</button>
              <button className="btn btn-primary"   style={{flex:1}} onClick={()=>setShowModal(null)}>Send Message 💬</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Study Rooms ───────────────────────────────────────────────────────────────
const StudyRooms = ({user}) => {
  const [rooms,   setRooms]   = useState([]);
  const [joined,  setJoined]  = useState(null);
  const [messages,setMessages]= useState([]);
  const [input,   setInput]   = useState("");
  const [filter,  setFilter]  = useState("All");
  const [loading, setLoading] = useState(true);
  const [creating,setCreating]= useState(false);
  const [newRoom, setNewRoom] = useState({roomName:"",category:"Mathematics",icon:"📚",maxParticipants:20});
  const messagesEnd = useRef(null);

  useEffect(()=>{
    api.getRooms().then(r=>{ setRooms(r.rooms||[]); setLoading(false); }).catch(()=>setLoading(false));
  },[]);

  useEffect(()=>{
    const s = getSocket();
    if(!s||!joined) return;
    const onMsg = (msg) => setMessages(m=>[...m,msg]);
    const onJoin = ({user:u}) => toast(`${u.name} joined the room`,"info","👋");
    s.on("room:message",   onMsg);
    s.on("room:user_joined",onJoin);
    return ()=>{ s.off("room:message",onMsg); s.off("room:user_joined",onJoin); };
  },[joined]);

  useEffect(()=>{ messagesEnd.current?.scrollIntoView({behavior:"smooth"}); },[messages]);

  const joinRoom = async (room) => {
    try{
      await api.joinRoom(room._id);
      const msgs = await api.getRoomMessages(room._id);
      setMessages(msgs.messages||[]);
      setJoined(room);
      getSocket()?.emit("room:join",{roomId:room._id});
      toast(`Joined ${room.roomName}!`,"success","🏛");
    }catch(e){ toast(e.message,"error","❌"); }
  };

  const leaveRoom = () => {
    if(!joined) return;
    getSocket()?.emit("room:leave",{roomId:joined._id});
    api.leaveRoom(joined._id).catch(()=>{});
    setJoined(null); setMessages([]);
  };

  const sendMsg = () => {
    if(!input.trim()||!joined) return;
    getSocket()?.emit("room:message",{roomId:joined._id,content:input});
    setInput("");
  };

  const createRoom = async () => {
    if(!newRoom.roomName.trim()){ toast("Enter a room name","error","❌"); return; }
    try{
      const res = await api.createRoom(newRoom);
      setRooms(r=>[...r,res.room]);
      setCreating(false);
      setNewRoom({roomName:"",category:"Mathematics",icon:"📚",maxParticipants:20});
      toast("Room created!","success","🏛");
    }catch(e){ toast(e.message,"error","❌"); }
  };

  const categories = ["All",...new Set(rooms.map(r=>r.category))];
  const filtered   = filter==="All" ? rooms : rooms.filter(r=>r.category===filter);
  const ROOM_COLORS = {Mathematics:"#7c6aff","Computer Science":"#3de88a",History:"#ffb347",Languages:"#ff5f7e",Physics:"#4fd1c5",Literature:"#b794f4",Biology:"#FDCB6E",Economics:"#55EFC4"};

  if(joined) return (
    <div style={{display:"flex",height:"100%",overflow:"hidden"}}>
      <div style={{width:180,borderRight:"1px solid var(--border)",overflow:"auto",padding:10,flexShrink:0}}>
        <button onClick={leaveRoom} style={{display:"flex",alignItems:"center",gap:6,color:"var(--text2)",background:"none",marginBottom:12,fontSize:13,padding:"4px 0"}}>← Leave Room</button>
        {rooms.map(r=>(
          <button key={r._id} onClick={()=>joinRoom(r)} style={{width:"100%",textAlign:"left",padding:"7px 10px",borderRadius:8,marginBottom:3,background:joined._id===r._id?"rgba(124,106,255,.15)":"transparent",color:joined._id===r._id?"var(--accent)":"var(--text2)",fontSize:12,border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:7}}>
            <span style={{width:7,height:7,borderRadius:"50%",background:r.online?"var(--accent3)":"var(--text3)",flexShrink:0}}/>
            <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.roomName}</span>
          </button>
        ))}
      </div>
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{padding:"14px 18px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",gap:11,flexShrink:0}}>
          <div style={{width:38,height:38,borderRadius:10,background:`${ROOM_COLORS[joined.category]||"var(--accent)"}22`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{joined.icon||"📚"}</div>
          <div><div className="syne" style={{fontWeight:700,fontSize:15}}>{joined.roomName}</div><div style={{fontSize:12,color:"var(--text2)"}}>{joined.category} · {joined.participants?.length||0} members</div></div>
        </div>
        <div style={{flex:1,overflow:"auto",padding:"14px 18px",display:"flex",flexDirection:"column",gap:11}}>
          {messages.map(m=>(
            <div key={m._id||genId()} style={{display:"flex",gap:9}} className="fade-up">
              <Avatar user={m.senderId||{name:"?"}} size={28}/>
              <div>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}>
                  <span style={{fontWeight:600,fontSize:13,color:m.senderId?._id===user._id?"var(--accent)":"var(--text)"}}>{m.senderId?.name||"Unknown"}</span>
                  <span style={{fontSize:11,color:"var(--text3)"}}>{fmtDate(m.createdAt)}</span>
                </div>
                <div style={{background:"var(--bg3)",borderRadius:10,padding:"8px 12px",fontSize:14,color:"var(--text)",maxWidth:500}}>{m.content}</div>
              </div>
            </div>
          ))}
          <div ref={messagesEnd}/>
        </div>
        <div style={{padding:"11px 18px",display:"flex",gap:9,flexShrink:0}}>
          <input className="input" style={{flex:1}} placeholder={`Message #${joined.roomName.toLowerCase().replace(/\s/g,"-")}`} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendMsg()}/>
          <button className="btn btn-primary" onClick={sendMsg} style={{padding:"10px 16px"}}>Send</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{padding:24,overflow:"auto",height:"100%"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:12}}>
        <div>
          <h2 className="syne" style={{fontSize:"clamp(20px,3vw,26px)",fontWeight:800}}>Study Rooms</h2>
          <p style={{color:"var(--text2)",fontSize:14}}>Join collaborative group study spaces</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={()=>setCreating(true)}>+ Create Room</button>
      </div>

      <div style={{display:"flex",gap:7,marginBottom:20,flexWrap:"wrap"}}>
        {categories.map(c=>(
          <button key={c} onClick={()=>setFilter(c)} style={{padding:"5px 14px",borderRadius:20,fontSize:13,fontWeight:500,transition:"all .2s",background:filter===c?"var(--accent)":"var(--card2)",color:filter===c?"white":"var(--text2)",border:`1px solid ${filter===c?"var(--accent)":"var(--border)"}`}}>{c}</button>
        ))}
      </div>

      {loading ? <div style={{display:"flex",justifyContent:"center",paddingTop:40}}><Spinner size={40}/></div> : (
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(230px,1fr))",gap:14}}>
          {filtered.map(r=>{
            const c = ROOM_COLORS[r.category]||"var(--accent)";
            return (
              <div key={r._id} className="card card-hover" onClick={()=>joinRoom(r)} style={{borderTop:`3px solid ${c}`}}>
                <div style={{display:"flex",alignItems:"center",gap:11,marginBottom:11}}>
                  <div style={{width:40,height:40,borderRadius:10,background:`${c}22`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:19}}>{r.icon||"📚"}</div>
                  <div style={{flex:1,overflow:"hidden"}}><div style={{fontWeight:700,fontSize:14,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.roomName}</div><div style={{fontSize:12,color:"var(--text2)"}}>{r.category}</div></div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <div style={{flex:1}}><div className="progress"><div className="progress-fill" style={{width:`${((r.participants?.length||0)/r.maxParticipants)*100}%`,background:`linear-gradient(90deg,${c},${c}88)`}}/></div></div>
                  <span style={{fontSize:12,color:"var(--text2)",whiteSpace:"nowrap"}}>{r.participants?.length||0}/{r.maxParticipants} 👥</span>
                </div>
              </div>
            );
          })}
          {filtered.length===0&&<div style={{color:"var(--text2)",fontSize:14,padding:16}}>No rooms found. Create one!</div>}
        </div>
      )}

      {creating&&(
        <div className="modal-overlay" onClick={()=>setCreating(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <h3 className="syne" style={{fontWeight:700,fontSize:18,marginBottom:20}}>Create Study Room</h3>
            <div style={{display:"flex",flexDirection:"column",gap:13}}>
              <input className="input" placeholder="Room Name *" value={newRoom.roomName} onChange={e=>setNewRoom(r=>({...r,roomName:e.target.value}))}/>
              <select className="input" value={newRoom.category} onChange={e=>setNewRoom(r=>({...r,category:e.target.value}))}>
                {SUBJECTS.map(s=><option key={s}>{s}</option>)}
              </select>
              <input className="input" placeholder="Icon (emoji)" value={newRoom.icon} onChange={e=>setNewRoom(r=>({...r,icon:e.target.value}))}/>
              <div>
                <label style={{fontSize:13,color:"var(--text2)",display:"block",marginBottom:5}}>Max Participants: {newRoom.maxParticipants}</label>
                <input type="range" min={2} max={50} value={newRoom.maxParticipants} onChange={e=>setNewRoom(r=>({...r,maxParticipants:+e.target.value}))} style={{width:"100%"}}/>
              </div>
              <div style={{display:"flex",gap:11,marginTop:4}}>
                <button className="btn btn-secondary" style={{flex:1}} onClick={()=>setCreating(false)}>Cancel</button>
                <button className="btn btn-primary"   style={{flex:1}} onClick={createRoom}>Create Room</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Messages ──────────────────────────────────────────────────────────────────
const MessagesPage = ({user,onUnread}) => {
  const [contacts,  setContacts]  = useState([]);
  const [active,    setActive]    = useState(null);
  const [messages,  setMessages]  = useState([]);
  const [input,     setInput]     = useState("");
  const [loading,   setLoading]   = useState(true);
  const messagesEnd = useRef(null);

  useEffect(()=>{
    api.getMatches().then(r=>{
      const ms = r.matches||[];
      const contacts = ms.map(m=>m.user1Id?._id===user._id ? m.user2Id : m.user1Id).filter(Boolean);
      setContacts(contacts); setLoading(false);
    }).catch(()=>setLoading(false));
  },[]);

  useEffect(()=>{
    const s = getSocket();
    if(!s) return;
    const onDm = ({message,sender}) => {
      if(active?._id===sender._id){
        setMessages(ms=>[...ms,message]);
      } else {
        onUnread(n=>n+1);
        toast(`New message from ${sender.name}`,"info","💬");
      }
    };
    s.on("dm:received",onDm);
    return ()=>s.off("dm:received",onDm);
  },[active]);

  useEffect(()=>{ messagesEnd.current?.scrollIntoView({behavior:"smooth"}); },[messages]);

  const openConvo = async (contact) => {
    setActive(contact);
    try{
      const res = await api.getConversation(contact._id);
      setMessages(res.messages||[]);
    }catch(e){ setMessages([]); }
  };

  const sendMsg = async () => {
    if(!input.trim()||!active) return;
    try{
      const res = await api.sendMessage({receiverId:active._id,content:input});
      setMessages(m=>[...m,res.message]);
      getSocket()?.emit("dm:send",{receiverId:active._id,content:input});
      setInput("");
    }catch(e){ toast(e.message,"error","❌"); }
  };

  return (
    <div style={{display:"flex",height:"100%",overflow:"hidden"}}>
      <div style={{width:240,borderRight:"1px solid var(--border)",overflow:"auto",flexShrink:0}}>
        <div style={{padding:"18px 14px 12px",borderBottom:"1px solid var(--border)"}}>
          <h3 className="syne" style={{fontWeight:700,fontSize:15,marginBottom:11}}>Messages</h3>
        </div>
        {loading ? <div style={{padding:20,display:"flex",justifyContent:"center"}}><Spinner/></div> : contacts.length===0 ? (
          <div style={{padding:20,color:"var(--text2)",fontSize:14,textAlign:"center"}}>No matches yet. Start discovering!</div>
        ) : contacts.map(c=>(
          <button key={c._id} onClick={()=>openConvo(c)} style={{width:"100%",padding:"13px 14px",display:"flex",alignItems:"center",gap:11,textAlign:"left",background:active?._id===c._id?"rgba(124,106,255,.1)":"transparent",borderBottom:"1px solid var(--border)",border:"none",cursor:"pointer",transition:"background .15s"}}>
            <div style={{position:"relative"}}><Avatar user={c} size={40}/><span style={{position:"absolute",bottom:0,right:0,width:10,height:10,borderRadius:"50%",background:"var(--accent3)",border:"2px solid var(--bg2)"}}/></div>
            <div style={{flex:1,overflow:"hidden"}}><div style={{fontWeight:600,fontSize:14}}>{c.name}</div><div style={{fontSize:12,color:"var(--text2)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.country}</div></div>
          </button>
        ))}
      </div>

      {active ? (
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <div style={{padding:"14px 18px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",gap:11,flexShrink:0}}>
            <Avatar user={active} size={40}/>
            <div><div className="syne" style={{fontWeight:700}}>{active.name}</div><div style={{fontSize:12,color:"var(--accent3)",display:"flex",alignItems:"center",gap:4}}><span style={{width:6,height:6,borderRadius:"50%",background:"var(--accent3)",display:"inline-block"}}/>Online</div></div>
          </div>
          <div style={{flex:1,overflow:"auto",padding:18,display:"flex",flexDirection:"column",gap:11}}>
            {messages.map(m=>(
              <div key={m._id||genId()} style={{display:"flex",flexDirection:"column",alignItems:m.senderId===user._id||m.senderId?._id===user._id?"flex-end":"flex-start"}} className="fade-up">
                {(m.senderId!==user._id&&m.senderId?._id!==user._id)&&<span style={{fontSize:11,color:"var(--text2)",marginBottom:3}}>{active.name}</span>}
                <div className={`bubble ${m.senderId===user._id||m.senderId?._id===user._id?"bubble-out":"bubble-in"}`}>{m.content}</div>
                <span style={{fontSize:10,color:"var(--text3)",marginTop:2}}>{fmtDate(m.createdAt)}</span>
              </div>
            ))}
            <div ref={messagesEnd}/>
          </div>
          <div style={{padding:"11px 18px",display:"flex",gap:9,flexShrink:0}}>
            <input className="input" style={{flex:1}} placeholder="Type a message..." value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendMsg()}/>
            <button className="btn btn-primary" onClick={sendMsg} style={{padding:"10px 16px"}}>Send</button>
          </div>
        </div>
      ) : (
        <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",color:"var(--text2)"}}>
          <div style={{fontSize:52,marginBottom:14}}>💬</div>
          <h3 className="syne" style={{fontSize:17,fontWeight:700,marginBottom:7,color:"var(--text)"}}>Select a conversation</h3>
          <p style={{fontSize:14}}>Choose a contact to start chatting</p>
        </div>
      )}
    </div>
  );
};

// ── Language Games ────────────────────────────────────────────────────────────
const LanguageGames = ({user}) => {
  const [game,    setGame]    = useState(null);
  const [lang,    setLang]    = useState("Spanish");
  const [score,   setScore]   = useState(0);
  const [qIdx,    setQIdx]    = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selected,setSelected]= useState(null);
  const [gameOver,setGameOver]= useState(false);
  const [streak,  setStreak]  = useState(0);
  const [fcIdx,   setFcIdx]   = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [cards,       setCards]       = useState([]);
  const [flippedCards,setFlippedCards]= useState([]);
  const [matched,     setMatched]     = useState([]);
  const [wmLeft,  setWmLeft]  = useState([]);
  const [wmRight, setWmRight] = useState([]);
  const [wmSel,   setWmSel]   = useState(null);
  const [wmMatched,setWmMatched]=useState([]);

  const dataset = VOCAB_DATA[lang]||VOCAB_DATA.Spanish;

  const GAMES = [
    {id:"vocab",     name:"Vocabulary Quiz",   icon:"📖",desc:"Multiple choice translation",    color:"#7c6aff"},
    {id:"flashcard", name:"Flashcard Trainer",  icon:"🃏",desc:"Flip cards to memorize words",  color:"#3de88a"},
    {id:"memory",    name:"Memory Match",       icon:"🧩",desc:"Match word pairs",              color:"#ffb347"},
    {id:"wordmatch", name:"Word Match",         icon:"🔗",desc:"Connect words to translations", color:"#4fd1c5"},
    {id:"speedround",name:"Speed Round",        icon:"⚡",desc:"Answer fast, beat the clock",   color:"#ff5f7e"},
    {id:"spelling",  name:"Spelling Challenge", icon:"✍",desc:"Type the word correctly",        color:"#b794f4"},
  ];

  const buildAnswers = qi => {
    const correct = dataset[qi%dataset.length];
    const wrong   = shuffle(dataset.filter((_,i)=>i!==qi%dataset.length)).slice(0,3);
    setAnswers(shuffle([correct,...wrong]));
  };

  const startGame = gId => {
    setGame(gId); setScore(0); setQIdx(0); setSelected(null); setGameOver(false); setStreak(0);
    buildAnswers(0);
    if(gId==="memory"){
      const pairs=dataset.slice(0,6).flatMap(d=>[{id:genId(),text:d.word,pair:d.answer},{id:genId(),text:d.answer,pair:d.word}]);
      setCards(shuffle(pairs)); setFlippedCards([]); setMatched([]);
    }
    if(gId==="wordmatch"){
      const pairs=dataset.slice(0,6);
      setWmLeft(shuffle(pairs.map(p=>p.word))); setWmRight(shuffle(pairs.map(p=>p.answer))); setWmSel(null); setWmMatched([]);
    }
  };

  const finishGame = async (finalScore) => {
    setGameOver(true);
    try{
      await api.saveScore({gameType:game,score:finalScore,language:lang});
      toast(`Score saved! ${finalScore} points 🏆`,"success","🏆");
    }catch(e){}
  };

  const answer = a => {
    if(selected!==null) return;
    setSelected(a);
    const correct=dataset[qIdx%dataset.length];
    const isRight=a.answer===correct.answer;
    const newStreak = isRight ? streak+1 : 0;
    const pts = isRight ? 10+streak*2 : 0;
    const newScore = score+pts;
    if(isRight){ setScore(newScore); setStreak(newStreak); toast(`✅ Correct! +${pts} pts`,"success","✅"); }
    else{ setStreak(0); toast(`❌ It was "${correct.answer}"`,"error","❌"); }
    setTimeout(()=>{
      const next=qIdx+1;
      if(next>=dataset.length){ finishGame(newScore); return; }
      setQIdx(next); setSelected(null); buildAnswers(next);
    },1100);
  };

  const flipCard = card => {
    if(flippedCards.length===2||matched.includes(card.id)||flippedCards.find(c=>c.id===card.id)) return;
    const nf=[...flippedCards,card];
    setFlippedCards(nf);
    if(nf.length===2){
      const [a,b]=nf;
      if(a.text===b.pair||a.pair===b.text){
        const newM=[...matched,a.id,b.id];
        setMatched(newM); setScore(s=>s+20); setFlippedCards([]);
        if(newM.length>=cards.length) finishGame(score+20);
      } else setTimeout(()=>setFlippedCards([]),1000);
    }
  };

  const wmClick = (val,side) => {
    if(wmSel===null){ setWmSel({val,side}); return; }
    if(wmSel.side===side){ setWmSel({val,side}); return; }
    const pair=dataset.find(d=>(wmSel.side==="left"&&wmSel.val===d.word&&val===d.answer)||(wmSel.side==="right"&&wmSel.val===d.answer&&val===d.word));
    if(pair){
      const nm=[...wmMatched,pair.word,pair.answer];
      setWmMatched(nm); setScore(s=>s+15); toast("✅ Match!","success","✅");
      if(nm.length>=wmLeft.length*2) finishGame(score+15);
    } else toast("❌ Not a match","error","❌");
    setWmSel(null);
  };

  if(!game) return (
    <div style={{padding:24,overflow:"auto",height:"100%"}}>
      <div style={{marginBottom:24}}>
        <h2 className="syne" style={{fontSize:"clamp(20px,3vw,26px)",fontWeight:800,marginBottom:10}}>Language Games 🎮</h2>
        <div style={{display:"flex",alignItems:"center",gap:9,flexWrap:"wrap"}}>
          <span style={{color:"var(--text2)",fontSize:14}}>Practice:</span>
          {Object.keys(VOCAB_DATA).map(l=>(
            <button key={l} onClick={()=>setLang(l)} style={{padding:"5px 14px",borderRadius:20,fontSize:13,fontWeight:500,background:lang===l?"var(--accent)":"var(--card2)",color:lang===l?"white":"var(--text2)",border:`1px solid ${lang===l?"var(--accent)":"var(--border)"}`}}>{l}</button>
          ))}
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))",gap:14}}>
        {GAMES.map(g=>(
          <div key={g.id} style={{background:"var(--card)",border:`1px solid var(--border)`,borderRadius:16,padding:20,cursor:"pointer",textAlign:"center",transition:"all .2s",borderTop:`3px solid ${g.color}`}}
            onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow="0 12px 30px rgba(0,0,0,.3)";}}
            onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="none";}}
            onClick={()=>startGame(g.id)}>
            <div style={{fontSize:36,marginBottom:10}}>{g.icon}</div>
            <h3 className="syne" style={{fontWeight:700,fontSize:15,marginBottom:7}}>{g.name}</h3>
            <p style={{fontSize:13,color:"var(--text2)",lineHeight:1.5}}>{g.desc}</p>
            <div style={{marginTop:10,fontSize:12,color:g.color,fontWeight:600}}>Play →</div>
          </div>
        ))}
      </div>
    </div>
  );

  if(gameOver) return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",gap:16,padding:32,textAlign:"center"}} className="pop-in">
      <div style={{fontSize:72}}>🏆</div>
      <h2 className="syne" style={{fontSize:28,fontWeight:800}}>Game Over!</h2>
      <div className="syne" style={{fontSize:52,fontWeight:800,color:"var(--accent)"}}>{score}</div>
      <div style={{color:"var(--text2)"}}>points earned · {lang}</div>
      <div style={{display:"flex",gap:11,marginTop:12}}>
        <button className="btn btn-secondary" onClick={()=>setGame(null)}>← Menu</button>
        <button className="btn btn-primary"   onClick={()=>startGame(game)}>Play Again 🔄</button>
      </div>
    </div>
  );

  const current = dataset[qIdx%dataset.length];

  const renderGame = () => {
    if(game==="vocab"||game==="speedround") return (
      <div style={{maxWidth:520,margin:"0 auto",padding:28}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
          <span style={{fontSize:14,color:"var(--text2)"}}>Q {qIdx+1}/{dataset.length}</span>
          <span style={{fontSize:14,color:"var(--accent)",fontWeight:600}}>Score: {score}</span>
          {streak>1&&<span style={{fontSize:13,color:"var(--accent4)"}}>🔥 {streak}× streak</span>}
        </div>
        <div className="progress" style={{marginBottom:22}}><div className="progress-fill" style={{width:`${(qIdx/dataset.length)*100}%`}}/></div>
        <div className="card" style={{textAlign:"center",padding:44,marginBottom:18}}>
          <div style={{fontSize:13,color:"var(--text2)",marginBottom:8}}>Translate from {lang}</div>
          <div className="syne" style={{fontSize:36,fontWeight:800}}>{current.word}</div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
          {answers.map((a,i)=>{
            const isCorrect=a.answer===current.answer,isSel=selected?.answer===a.answer;
            let bg="var(--card2)",border="var(--border)",color="var(--text)";
            if(selected){ if(isCorrect){bg="rgba(61,232,138,.15)";border="var(--accent3)";color="var(--accent3)";}else if(isSel){bg="rgba(255,95,126,.15)";border="var(--accent2)";color="var(--accent2)";} }
            return <button key={i} onClick={()=>answer(a)} style={{padding:15,borderRadius:12,background:bg,border:`1px solid ${border}`,color,fontWeight:500,fontSize:15,transition:"all .15s"}} onMouseEnter={e=>{if(!selected){e.currentTarget.style.borderColor="var(--accent)";e.currentTarget.style.background="rgba(124,106,255,.1)";}}} onMouseLeave={e=>{if(!selected){e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.background="var(--card2)";} }}>{a.answer}</button>;
          })}
        </div>
      </div>
    );

    if(game==="flashcard") return (
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",gap:22,padding:24}}>
        <div style={{fontSize:14,color:"var(--text2)"}}>Card {fcIdx+1}/{dataset.length} · Score: {score}</div>
        <div onClick={()=>setFlipped(f=>!f)} style={{width:"min(340px,90vw)",height:200,cursor:"pointer"}}>
          <div style={{width:"100%",height:"100%",borderRadius:20,background:flipped?"linear-gradient(135deg,var(--accent),#9f5cf6)":"var(--card)",border:"1px solid var(--border)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",boxShadow:"0 8px 32px rgba(0,0,0,.3)",transition:"background .35s"}}>
            <div style={{fontSize:11,color:flipped?"rgba(255,255,255,.7)":"var(--text2)",textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>{flipped?"Translation":"Word"}</div>
            <div className="syne" style={{fontSize:30,fontWeight:800,color:flipped?"white":"var(--text)",textAlign:"center",padding:"0 20px"}}>{flipped?dataset[fcIdx].answer:dataset[fcIdx].word}</div>
            <div style={{fontSize:12,color:flipped?"rgba(255,255,255,.6)":"var(--text3)",marginTop:10}}>Tap to {flipped?"flip back":"reveal"}</div>
          </div>
        </div>
        <div style={{display:"flex",gap:11}}>
          <button className="btn btn-secondary" onClick={()=>{setFcIdx(i=>(i-1+dataset.length)%dataset.length);setFlipped(false);}}>← Prev</button>
          <button onClick={()=>{setScore(s=>s+5);toast("+5 pts ✅","success","✅");}} style={{background:"rgba(61,232,138,.15)",border:"1px solid rgba(61,232,138,.3)",color:"var(--accent3)",borderRadius:12,padding:"12px 20px",fontWeight:600}}>✅ Got it</button>
          <button className="btn btn-secondary" onClick={()=>{setFcIdx(i=>(i+1)%dataset.length);setFlipped(false);}}>Next →</button>
        </div>
      </div>
    );

    if(game==="memory") return (
      <div style={{padding:22,overflow:"auto",height:"100%"}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:18}}>
          <h3 className="syne" style={{fontWeight:700}}>Memory Match – {lang}</h3>
          <span style={{color:"var(--accent)",fontWeight:600}}>Score: {score} · {matched.length/2}/{cards.length/2} pairs</span>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:9,maxWidth:560}}>
          {cards.map(card=>{
            const isFlipped=!!flippedCards.find(c=>c.id===card.id)||matched.includes(card.id);
            const isMatched=matched.includes(card.id);
            return <button key={card.id} onClick={()=>flipCard(card)} style={{aspectRatio:"1",borderRadius:10,border:`2px solid ${isMatched?"var(--accent3)":isFlipped?"var(--accent)":"var(--border)"}`,background:isMatched?"rgba(61,232,138,.1)":isFlipped?"rgba(124,106,255,.15)":"var(--card2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:600,color:isMatched?"var(--accent3)":isFlipped?"var(--accent)":"var(--text3)",transition:"all .2s",cursor:isMatched?"default":"pointer",padding:4,textAlign:"center",lineHeight:1.3}}>{isFlipped?card.text:"?"}</button>;
          })}
        </div>
      </div>
    );

    if(game==="wordmatch") return (
      <div style={{padding:28,overflow:"auto",height:"100%"}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:18}}>
          <h3 className="syne" style={{fontWeight:700}}>Word Match – {lang}</h3>
          <span style={{color:"var(--accent)",fontWeight:600}}>Score: {score} · {wmMatched.length/2}/{wmLeft.length}</span>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 28px 1fr",gap:8,maxWidth:460}}>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {wmLeft.map(w=><button key={w} onClick={()=>wmClick(w,"left")} style={{padding:"11px 14px",borderRadius:10,border:`2px solid ${wmSel?.val===w&&wmSel?.side==="left"?"var(--accent)":wmMatched.includes(w)?"var(--accent3)":"var(--border)"}`,background:wmMatched.includes(w)?"rgba(61,232,138,.1)":wmSel?.val===w&&wmSel?.side==="left"?"rgba(124,106,255,.15)":"var(--card2)",color:wmMatched.includes(w)?"var(--accent3)":"var(--text)",fontWeight:500,fontSize:14,cursor:wmMatched.includes(w)?"default":"pointer",textDecoration:wmMatched.includes(w)?"line-through":"none"}}>{w}</button>)}
          </div>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"space-around"}}>
            {wmLeft.map((_,i)=><div key={i} style={{width:2,height:18,background:"var(--border)"}}/>)}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {wmRight.map(w=><button key={w} onClick={()=>wmClick(w,"right")} style={{padding:"11px 14px",borderRadius:10,border:`2px solid ${wmSel?.val===w&&wmSel?.side==="right"?"var(--accent)":wmMatched.includes(w)?"var(--accent3)":"var(--border)"}`,background:wmMatched.includes(w)?"rgba(61,232,138,.1)":wmSel?.val===w&&wmSel?.side==="right"?"rgba(124,106,255,.15)":"var(--card2)",color:wmMatched.includes(w)?"var(--accent3)":"var(--text)",fontWeight:500,fontSize:14,cursor:wmMatched.includes(w)?"default":"pointer",textDecoration:wmMatched.includes(w)?"line-through":"none"}}>{w}</button>)}
          </div>
        </div>
      </div>
    );

    if(game==="spelling") return (
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",gap:20,padding:24}}>
        <div style={{fontSize:14,color:"var(--text2)"}}>Q {qIdx+1}/{dataset.length} · Score: {score}</div>
        <div className="card" style={{textAlign:"center",padding:40,minWidth:"min(320px,90vw)"}}>
          <div style={{fontSize:13,color:"var(--text2)",marginBottom:8}}>How do you say this in {lang}?</div>
          <div className="syne" style={{fontSize:32,fontWeight:800,marginBottom:20}}>{current.answer}</div>
          <input className="input" id="spellInput" placeholder={`Type in ${lang}...`} style={{textAlign:"center",fontSize:18}}
            onKeyDown={e=>{
              if(e.key==="Enter"){
                const val=e.target.value.trim();
                const ok=val.toLowerCase()===current.word.toLowerCase();
                const newScore=ok?score+15:score;
                if(ok){setScore(newScore);toast("✅ Perfect!","success","✅");}
                else toast(`❌ It was "${current.word}"`,"error","❌");
                e.target.value="";
                const next=qIdx+1;
                setTimeout(()=>{ if(next>=dataset.length){finishGame(newScore);}else setQIdx(next); },900);
              }
            }}/>
          <div style={{fontSize:12,color:"var(--text3)",marginTop:8}}>Press Enter to submit</div>
        </div>
      </div>
    );
  };

  return (
    <div style={{height:"100%",display:"flex",flexDirection:"column"}}>
      <div style={{padding:"13px 22px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",gap:11,flexShrink:0}}>
        <button onClick={()=>setGame(null)} style={{color:"var(--text2)",fontSize:14,background:"none"}}>← Games</button>
        <span style={{color:"var(--border)"}}>|</span>
        <span className="syne" style={{fontWeight:700}}>{GAMES.find(g=>g.id===game)?.name}</span>
        <span className="tag" style={{marginLeft:"auto"}}>{lang}</span>
      </div>
      <div style={{flex:1,overflow:"auto"}}>{renderGame()}</div>
    </div>
  );
};

// ── Profile ───────────────────────────────────────────────────────────────────
const Profile = ({user,setUser}) => {
  const [editing,  setEditing]  = useState(false);
  const [form,     setForm]     = useState({name:user.name||"",bio:user.bio||"",country:user.country||"",educationLevel:user.educationLevel||"",subjects:user.subjects||[],languages:user.languages||[]});
  const [loading,  setLoading]  = useState(false);
  const [scores,   setScores]   = useState([]);

  const toggleArr = (k,v) => setForm(f=>({...f,[k]:f[k].includes(v)?f[k].filter(x=>x!==v):[...f[k],v]}));

  useEffect(()=>{ api.getLeaderboard().then(r=>setScores(r.scores||[])).catch(()=>{}); },[]);

  const save = async () => {
    setLoading(true);
    try{
      const res = await api.updateProfile(form);
      setUser(u=>({...u,...res.user}));
      setEditing(false);
      toast("Profile updated! ✅","success","✅");
    }catch(e){ toast(e.message,"error","❌"); }
    setLoading(false);
  };

  const earned   = BADGES.filter(b=>user.badges?.includes(b.id));
  const myScores = scores.filter(s=>s.userId?._id===user._id||s.userId===user._id);

  return (
    <div style={{padding:24,overflow:"auto",height:"100%",maxWidth:800,margin:"0 auto"}}>
      <div className="card" style={{marginBottom:18}}>
        <div style={{display:"flex",alignItems:"flex-start",gap:20,flexWrap:"wrap"}}>
          <div style={{position:"relative"}}>
            <Avatar user={user} size={76}/>
          </div>
          <div style={{flex:1,minWidth:200}}>
            {editing ? (
              <div style={{display:"flex",flexDirection:"column",gap:11}}>
                <input className="input" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Full Name"/>
                <textarea className="input" rows={3} value={form.bio} onChange={e=>setForm(f=>({...f,bio:e.target.value}))} placeholder="Bio" style={{resize:"none"}}/>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>
                  <select className="input input-sm" value={form.country} onChange={e=>setForm(f=>({...f,country:e.target.value}))}>
                    <option value="">Country</option>{COUNTRIES.map(c=><option key={c}>{c}</option>)}
                  </select>
                  <select className="input input-sm" value={form.educationLevel} onChange={e=>setForm(f=>({...f,educationLevel:e.target.value}))}>
                    <option value="">Education</option>{EDU_LEVELS.map(l=><option key={l}>{l}</option>)}
                  </select>
                </div>
                <div style={{fontSize:13,color:"var(--text2)",fontWeight:500}}>Subjects</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>{SUBJECTS.map(s=><button key={s} onClick={()=>toggleArr("subjects",s)} style={{padding:"4px 10px",borderRadius:7,fontSize:12,background:form.subjects.includes(s)?"rgba(124,106,255,.2)":"var(--bg3)",color:form.subjects.includes(s)?"var(--accent)":"var(--text2)",border:form.subjects.includes(s)?"1px solid rgba(124,106,255,.4)":"1px solid var(--border)"}}>{s}</button>)}</div>
                <div style={{fontSize:13,color:"var(--text2)",fontWeight:500}}>Languages</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>{LANGUAGES.map(l=><button key={l} onClick={()=>toggleArr("languages",l)} style={{padding:"4px 10px",borderRadius:7,fontSize:12,background:form.languages.includes(l)?"rgba(61,232,138,.15)":"var(--bg3)",color:form.languages.includes(l)?"var(--accent3)":"var(--text2)",border:form.languages.includes(l)?"1px solid rgba(61,232,138,.3)":"1px solid var(--border)"}}>{l}</button>)}</div>
                <div style={{display:"flex",gap:9,marginTop:4}}>
                  <button className="btn btn-primary btn-sm" onClick={save} disabled={loading}>{loading?<Spinner size={14} color="white"/>:"Save Changes"}</button>
                  <button className="btn btn-secondary btn-sm" onClick={()=>setEditing(false)}>Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6,flexWrap:"wrap"}}>
                  <h2 className="syne" style={{fontSize:22,fontWeight:800}}>{user.name}</h2>
                  <button className="btn btn-secondary btn-sm" onClick={()=>setEditing(true)}>Edit Profile</button>
                </div>
                <p style={{color:"var(--text2)",fontSize:14,marginBottom:10,lineHeight:1.6}}>{user.bio||"No bio yet."}</p>
                <div style={{display:"flex",gap:16,fontSize:13,color:"var(--text2)",flexWrap:"wrap"}}>
                  {user.country&&<span>📍 {user.country}</span>}
                  {user.educationLevel&&<span>🎓 {user.educationLevel}</span>}
                  <span>📅 Member since {new Date(user.createdAt||Date.now()).toLocaleDateString()}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:14,marginBottom:18}}>
        {[{label:"Study Hours",value:(user.studyHours||0).toFixed(1),icon:"⏱",color:"var(--accent)"},{label:"Day Streak",value:user.studyStreak||0,icon:"🔥",color:"var(--accent4)"}].map(s=>(
          <div key={s.label} className="card" style={{display:"flex",alignItems:"center",gap:14,padding:18}}>
            <span style={{fontSize:28}}>{s.icon}</span>
            <div><div className="syne" style={{fontSize:24,fontWeight:800,color:s.color}}>{s.value}</div><div style={{fontSize:13,color:"var(--text2)"}}>{s.label}</div></div>
          </div>
        ))}
      </div>

      {!editing&&<>
        <div className="card" style={{marginBottom:14}}>
          <h3 className="syne" style={{fontWeight:700,marginBottom:12,fontSize:15}}>Subjects</h3>
          <div style={{display:"flex",flexWrap:"wrap",gap:7}}>{(user.subjects||[]).map(s=><span key={s} className="tag">{s}</span>)}{!(user.subjects?.length)&&<span style={{color:"var(--text2)",fontSize:14}}>None yet.</span>}</div>
        </div>
        <div className="card" style={{marginBottom:14}}>
          <h3 className="syne" style={{fontWeight:700,marginBottom:12,fontSize:15}}>Languages</h3>
          <div style={{display:"flex",flexWrap:"wrap",gap:7}}>{(user.languages||[]).map(l=><span key={l} className="tag-green">{l}</span>)}</div>
        </div>
      </>}

      <div className="card">
        <h3 className="syne" style={{fontWeight:700,marginBottom:14,fontSize:15}}>Badges ({earned.length}/{BADGES.length})</h3>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(100px,1fr))",gap:11}}>
          {BADGES.map(b=>{
            const has=user.badges?.includes(b.id);
            return (
              <div key={b.id} title={b.desc} style={{textAlign:"center",padding:13,borderRadius:11,background:has?"rgba(124,106,255,.1)":"var(--bg3)",border:`1px solid ${has?"rgba(124,106,255,.3)":"var(--border)"}`,opacity:has?1:.4,transition:"all .2s"}}>
                <div style={{fontSize:28,marginBottom:5,filter:has?"none":"grayscale(1)"}}>{b.icon}</div>
                <div style={{fontSize:11,fontWeight:600,color:has?"var(--text)":"var(--text2)"}}>{b.name}</div>
                <div style={{fontSize:10,color:"var(--text3)",marginTop:2}}>{b.desc}</div>
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
  const [screen,  setScreen]  = useState("landing"); // landing | auth | app
  const [user,    setUser]    = useState(null);
  const [page,    setPage]    = useState("dashboard");
  const [unread,  setUnread]  = useState(0);
  const [loading, setLoading] = useState(true);
  const isMobile = window.innerWidth < 769;

  // On mount — check for saved token
  useEffect(()=>{
    if(!api.hasToken()){ setLoading(false); setScreen("landing"); return; }
    api.getMe().then(r=>{
      setUser(r.user);
      const s = connectSocket(localStorage.getItem("pp_token"));
      setScreen("app"); setLoading(false);
    }).catch(()=>{
      api.clearToken(); setLoading(false); setScreen("landing");
    });
  },[]);

  const onAuth = (u) => {
    setUser(u);
    connectSocket(localStorage.getItem("pp_token"));
    setScreen("app");
  };

  const onLogout = () => {
    disconnectSocket();
    api.clearToken();
    setUser(null); setScreen("landing"); setPage("dashboard");
    toast("Logged out successfully 👋","info","👋");
  };

  const onNav = (p) => { setPage(p); if(p==="messages") setUnread(0); };

  if(loading) return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"var(--bg)",flexDirection:"column",gap:16}}>
      <div style={{width:56,height:56,borderRadius:16,background:"linear-gradient(135deg,var(--accent),#9f5cf6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26}}>🎓</div>
      <Spinner size={36}/>
    </div>
  );

  if(screen==="landing") return <><Toast/><Landing onGetStarted={()=>setScreen("auth")}/></>;
  if(screen==="auth")    return <><Toast/><AuthScreen onAuth={onAuth}/></>;

  const renderPage = () => {
    switch(page){
      case "dashboard": return <Dashboard user={user} onNav={onNav}/>;
      case "random":    return <RandomMatch user={user}/>;
      case "swipe":     return <SwipeDiscover user={user}/>;
      case "rooms":     return <StudyRooms user={user}/>;
      case "messages":  return <MessagesPage user={user} onUnread={setUnread}/>;
      case "games":     return <LanguageGames user={user}/>;
      case "profile":   return <Profile user={user} setUser={u=>setUser(prev=>({...prev,...(typeof u==="function"?u(prev):u)}))}/>;
      default:          return <Dashboard user={user} onNav={onNav}/>;
    }
  };

  return (
    <>
      <Toast/>
      <div style={{display:"flex",height:"100vh",overflow:"hidden"}}>
        {/* Desktop sidebar */}
        <div className="hide-mobile">
          <Sidebar user={user} page={page} onNav={onNav} unread={unread} onLogout={onLogout}/>
        </div>

        <main style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
          <header style={{padding:"0 20px",height:52,borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,background:"var(--bg2)"}}>
            <span className="syne" style={{fontWeight:700,fontSize:14,color:"var(--text2)"}}>
              {NAV.find(n=>n.id===page)?.icon} {NAV.find(n=>n.id===page)?.label}
            </span>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <Avatar user={user} size={28}/>
                <span style={{fontSize:13,fontWeight:500,maxWidth:120,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} className="hide-mobile">{user?.name}</span>
              </div>
              <button onClick={onLogout} className="btn btn-danger btn-sm hide-mobile">Log Out</button>
            </div>
          </header>

          <div style={{flex:1,overflow:"hidden",paddingBottom:isMobile?60:0}}>
            {renderPage()}
          </div>
        </main>
      </div>

      {/* Mobile nav */}
      <div className="hide-desktop">
        <MobileNav page={page} onNav={onNav}/>
      </div>
    </>
  );
}
