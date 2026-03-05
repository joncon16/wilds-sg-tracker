import { useState, useEffect } from "react";

const COURSE = {
  tees: [
    { id:"weiskopf",     label:"Weiskopf",     color:"#1a1a6e", textColor:"#fff", rating:74.3, slope:150 },
    { id:"championship", label:"Championship", color:"#b8860b", textColor:"#fff", rating:71.8, slope:144 },
    { id:"wilds",        label:"Wilds",        color:"#d8d8d8", textColor:"#222", rating:69.6, slope:140 },
    { id:"forward",      label:"Forward",      color:"#2d7a2d", textColor:"#fff", rating:70.3, slope:127 },
  ],
  holes: [
    { hole:1,  par:4, hcp:9,  weiskopf:406, championship:362, wilds:337, forward:317 },
    { hole:2,  par:5, hcp:5,  weiskopf:517, championship:484, wilds:451, forward:401 },
    { hole:3,  par:3, hcp:17, weiskopf:170, championship:152, wilds:148, forward:103 },
    { hole:4,  par:4, hcp:15, weiskopf:340, championship:292, wilds:286, forward:237 },
    { hole:5,  par:4, hcp:1,  weiskopf:478, championship:429, wilds:400, forward:370 },
    { hole:6,  par:4, hcp:3,  weiskopf:460, championship:384, wilds:363, forward:324 },
    { hole:7,  par:3, hcp:13, weiskopf:174, championship:167, wilds:159, forward:148 },
    { hole:8,  par:5, hcp:11, weiskopf:540, championship:529, wilds:518, forward:372 },
    { hole:9,  par:4, hcp:7,  weiskopf:378, championship:353, wilds:329, forward:277 },
    { hole:10, par:4, hcp:6,  weiskopf:433, championship:410, wilds:381, forward:285 },
    { hole:11, par:3, hcp:10, weiskopf:224, championship:180, wilds:160, forward:134 },
    { hole:12, par:5, hcp:14, weiskopf:528, championship:500, wilds:456, forward:391 },
    { hole:13, par:3, hcp:16, weiskopf:165, championship:156, wilds:137, forward:129 },
    { hole:14, par:4, hcp:4,  weiskopf:487, championship:453, wilds:433, forward:369 },
    { hole:15, par:4, hcp:12, weiskopf:378, championship:355, wilds:324, forward:299 },
    { hole:16, par:4, hcp:18, weiskopf:330, championship:295, wilds:255, forward:202 },
    { hole:17, par:5, hcp:8,  weiskopf:560, championship:527, wilds:461, forward:415 },
    { hole:18, par:4, hcp:2,  weiskopf:444, championship:421, wilds:380, forward:345 },
  ]
};

function lerp(x, x0, y0, x1, y1) {
  return y0 + (y1 - y0) * (x - x0) / (x1 - x0);
}
function tableLookup(val, table) {
  if (val <= table[0][0]) return table[0][1];
  if (val >= table[table.length-1][0]) return table[table.length-1][1];
  for (let i = 1; i < table.length; i++) {
    if (val <= table[i][0]) return lerp(val, table[i-1][0], table[i-1][1], table[i][0], table[i][1]);
  }
  return table[table.length-1][1];
}

const PUTT_TABLE_FT = [
  [0,1.000],[1,1.010],[2,1.030],[3,1.060],[4,1.095],
  [5,1.130],[6,1.175],[7,1.215],[8,1.250],[9,1.280],
  [10,1.306],[12,1.355],[15,1.418],[20,1.495],[25,1.552],
  [30,1.598],[40,1.660],[50,1.708],[60,1.742],[75,1.778],[100,1.820],
];
function puttBaseline(yards) { return tableLookup(yards * 3, PUTT_TABLE_FT); }

const FAIRWAY_TABLE_YD = [
  [0,1.00],[1,1.60],[2,1.75],[3,1.85],[5,1.95],[7,2.02],
  [10,2.10],[15,2.18],[20,2.25],[30,2.35],[40,2.45],[50,2.55],
  [60,2.65],[75,2.75],[100,2.90],[125,3.10],[150,3.28],
  [175,3.44],[200,3.58],[225,3.70],[250,3.80],
  [300,3.98],[350,4.15],[400,4.32],[500,4.65],[600,4.90],
];
function fairwayBaseline(yards) { return tableLookup(yards, FAIRWAY_TABLE_YD); }

function teeBaseline(holeDist, par) {
  if (par === 3) return fairwayBaseline(holeDist);
  const d = holeDist;
  return d<300?4.00:d<350?4.10:d<400?4.20:d<430?4.28:d<460?4.35:d<500?4.45:4.60;
}

function baseline(lie, yards) {
  if (lie === "hole" || yards <= 0) return 0;
  if (lie === "green") return puttBaseline(yards);
  const fb = fairwayBaseline(yards);
  if (lie === "fairway") return fb;
  if (lie === "rough")    return fb + 0.15;
  if (lie === "sand")     return fb + (yards <= 15 ? 0.50 : 0.30);
  if (lie === "recovery") return fb + 0.55;
  return fb;
}

function sgCat(fromLie, fromYards, par, shotNum) {
  if (fromLie === "green") return "putting";
  if (shotNum === 1 && par > 3) return "tee";
  if (fromYards >= 100) return "approach";
  return "atg";
}

const HCP_BENCH = {
  0:  {tee:0.0,  approach:0.0,  atg:0.0,  putting:0.0},
  5:  {tee:-0.5, approach:-0.8, atg:-0.4, putting:-0.4},
  10: {tee:-0.9, approach:-1.6, atg:-0.7, putting:-0.7},
  15: {tee:-1.3, approach:-2.4, atg:-1.1, putting:-0.9},
  20: {tee:-1.7, approach:-3.2, atg:-1.5, putting:-1.1},
  25: {tee:-2.1, approach:-4.0, atg:-1.8, putting:-1.3},
  36: {tee:-2.9, approach:-5.5, atg:-2.5, putting:-1.7},
};
function getHcpBench(hcp) {
  const keys = [0,5,10,15,20,25,36];
  const lo = [...keys].reverse().find(k=>k<=hcp)??0;
  const hi = keys.find(k=>k>hcp)??36;
  if (lo===hi) return HCP_BENCH[lo];
  const t = (hcp-lo)/(hi-lo);
  return Object.fromEntries(["tee","approach","atg","putting"].map(k=>
    [k, HCP_BENCH[lo][k]+(HCP_BENCH[hi][k]-HCP_BENCH[lo][k])*t]
  ));
}

const C = {
  bg:"#0f1923", card:"#1a2535", cardBorder:"#2a3a50",
  gold:"#c9a84c", goldLight:"#e8c97a", navy:"#1a2a4a",
  text:"#e8edf3", muted:"#8a9bb0", green:"#2d9e5f",
  red:"#d94f4f", blue:"#3a7fd5",
};

const LIES = [
  { id:"fairway",  label:"Fairway",  shape:"rect",     bg:"#1a3d1a", border:"#3aaa3a", fill:"#4cc94c" },
  { id:"rough",    label:"Rough",    shape:"rect",     bg:"#2a3010", border:"#7a8a20", fill:"#a0b030" },
  { id:"sand",     label:"Sand",     shape:"diamond",  bg:"#2a2010", border:"#b08030", fill:"#d4a843" },
  { id:"green",    label:"Green",    shape:"circle",   bg:"#0a2a18", border:"#20a070", fill:"#30d090" },
  { id:"recovery", label:"Recovery", shape:"triangle", bg:"#2a1010", border:"#aa3030", fill:"#e05050" },
];

function LieShape({ shape, fill, size=28 }) {
  const s = size;
  if (shape==="circle")   return <svg width={s} height={s} viewBox="0 0 28 28"><circle cx="14" cy="14" r="11" fill={fill}/></svg>;
  if (shape==="rect")     return <svg width={s} height={s} viewBox="0 0 28 28"><rect x="3" y="3" width="22" height="22" rx="4" fill={fill}/></svg>;
  if (shape==="diamond")  return <svg width={s} height={s} viewBox="0 0 28 28"><polygon points="14,2 26,14 14,26 2,14" fill={fill}/></svg>;
  if (shape==="triangle") return <svg width={s} height={s} viewBox="0 0 28 28"><polygon points="14,2 27,26 1,26" fill={fill}/></svg>;
  return null;
}

const css=`
* {box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;}
body {background:#0f1923;color:#e8edf3;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif;}
.btn {border:none;cursor:pointer;border-radius:12px;font-weight:600;transition:all 0.15s;}
.btn:active {transform:scale(0.96);opacity:0.85;}
input[type=number],input[type=text] {background:#0f1923;border:1.5px solid #2a3a50;color:#e8edf3;border-radius:10px;padding:10px 12px;font-size:16px;width:100%;outline:none;}
input:focus {border-color:#c9a84c;}
`;

export default function App() {
  const [screen,setScreen]           = useState("home");
  const [teeId,setTeeId]             = useState("championship");
  const [compHcp,setCompHcp]         = useState(10);
  const [gimme,setGimme]             = useState(1);
  const [playerName,setPlayerName]   = useState("Me");
  const [currentHole,setCurrentHole] = useState(0);
  const [holeShots,setHoleShots]     = useState({});
  const [resultTab,setResultTab]     = useState("summary");

  const tee   = COURSE.tees.find(t=>t.id===teeId);
  const holes = COURSE.holes;

  function addShot(hi, shot) {
    setHoleShots(prev => ({...prev,[hi]:[...(prev[hi]||[]),shot]}));
  }
  function deleteShot(hi, i) {
    setHoleShots(prev => { const arr=[...(prev[hi]||[])]; arr.splice(i,1); return {...prev,[hi]:arr}; });
  }
  function clearHole(hi) { setHoleShots(prev=>({...prev,[hi]:[]})); }

  function calcSG() {
    let totals={tee:0,approach:0,atg:0,putting:0};
    let byHole=holes.map((hole,hi)=>{
      const shots=holeShots[hi]||[];
      if(!shots.length) return null;
      const hd=hole[teeId];
      let hsg={tee:0,approach:0,atg:0,putting:0,score:shots.length};
      for(let i=0;i<shots.length;i++){
        const s=shots[i];
        const prevLie  = i===0?"tee_box":shots[i-1].lie;
        const prevYards= i===0?hd:shots[i-1].distYards;
        const before   = i===0?teeBaseline(hd,hole.par):baseline(shots[i-1].lie,shots[i-1].distYards);
        const after    = s.holed?0:baseline(s.lie,s.distYards);
        const sg       = before-after-1;
        const cat      = sgCat(prevLie,prevYards,hole.par,i+1);
        hsg[cat]=(hsg[cat]||0)+sg;
        totals[cat]=(totals[cat]||0)+sg;
      }
      return hsg;
    });
    return {totals:{...totals,total:totals.tee+totals.approach+totals.atg+totals.putting},byHole};
  }

  const sg    = calcSG();
  const bench = getHcpBench(compHcp);

  function runningScore(upTo) {
    let score=0,par=0;
    for(let i=0;i<=upTo;i++){const h=holeShots[i]||[];if(h.length>0&&h[h.length-1].holed){score+=h.length;par+=holes[i].par;}}
    return {score,par,diff:score-par};
  }
  function nineStr(hs,s,e) {
    let sc=0,p=0;
    for(let i=s;i<=e;i++){const h=hs[i]||[];if(h.length>0&&h[h.length-1].holed){sc+=h.length;p+=holes[i].par;}}
    if(!p) return null;
    const d=sc-p; return d>0?`+${d}`:d===0?"E":`${d}`;
  }

  return (
    <>
      <style>{css}</style>
      <div style={{maxWidth:430,margin:"0 auto",minHeight:"100vh",background:C.bg}}>
        {screen==="home"    && <HomeScreen onStart={()=>setScreen("setup")} />}
        {screen==="setup"   && <SetupScreen teeId={teeId} setTeeId={setTeeId} compHcp={compHcp} setCompHcp={setCompHcp} gimme={gimme} setGimme={setGimme} playerName={playerName} setPlayerName={setPlayerName} onStart={()=>{setCurrentHole(0);setHoleShots({});setScreen("round");}} onBack={()=>setScreen("home")} />}
        {screen==="round"   && <RoundScreen hole={holes[currentHole]} holeIdx={currentHole} teeId={teeId} shots={holeShots[currentHole]||[]} onAdd={addShot} onDelete={deleteShot} onClear={clearHole} onNext={()=>currentHole<17?setCurrentHole(h=>h+1):setScreen("results")} onPrev={()=>currentHole>0&&setCurrentHole(h=>h-1)} onFinish={()=>setScreen("results")} sg={sg} holeShots={holeShots} holes={holes} runningScore={runningScore} nineStr={nineStr} gimme={gimme} />}
        {screen==="results" && <ResultsScreen sg={sg} bench={bench} compHcp={compHcp} tee={tee} playerName={playerName} holes={holes} teeId={teeId} holeShots={holeShots} tab={resultTab} setTab={setResultTab} onNewRound={()=>{setHoleShots({});setScreen("home");}} />}
      </div>
    </>
  );
}

function HomeScreen({onStart}) {
  return (
    <div style={{padding:28,display:"flex",flexDirection:"column",alignItems:"center",minHeight:"100vh",justifyContent:"center"}}>
      <div style={{textAlign:"center",marginBottom:52}}>
        <div style={{fontSize:68,marginBottom:10}}>⛳</div>
        <div style={{fontSize:12,letterSpacing:3,color:C.gold,fontWeight:700,marginBottom:8,textTransform:"uppercase"}}>The Wilds Golf Club · Prior Lake, MN</div>
        <div style={{fontSize:34,fontWeight:900,color:C.text,lineHeight:1.1}}>Strokes Gained</div>
        <div style={{fontSize:34,fontWeight:900,color:C.gold,lineHeight:1.1,marginBottom:14}}>Tracker</div>
        <div style={{fontSize:13,color:C.muted,lineHeight:1.8}}>Shot-by-shot position tracking<br/>Gain or lose ground on every shot</div>
      </div>
      <button className="btn" onClick={onStart} style={{background:C.gold,color:"#0f1923",fontSize:18,fontWeight:800,padding:"17px 0",borderRadius:16,width:"100%",maxWidth:320,marginBottom:32}}>
        Start New Round
      </button>
      <div style={{width:"100%",background:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:16,padding:18}}>
        <div style={{fontSize:11,fontWeight:700,color:C.muted,letterSpacing:2,textTransform:"uppercase",marginBottom:14}}>How SG Categories Work</div>
        {[["T","Tee","Par 4 & 5 tee shots vs. scratch baseline"],["A","Approach","Shots from ≥100 yds to the green"],["G","Around Green","Chips & pitches inside 100 yds"],["P","Putting","All shots from on the green"]].map(([abbr,name,desc])=>(
          <div key={abbr} style={{display:"flex",alignItems:"flex-start",gap:12,marginBottom:12}}>
            <div style={{background:C.navy,border:`1px solid ${C.cardBorder}`,borderRadius:8,width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:900,color:C.gold,flexShrink:0}}>{abbr}</div>
            <div><div style={{fontSize:13,fontWeight:700,color:C.text}}>{name}</div><div style={{fontSize:11,color:C.muted,lineHeight:1.4}}>{desc}</div></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SetupScreen({teeId,setTeeId,compHcp,setCompHcp,gimme,setGimme,playerName,setPlayerName,onStart,onBack}) {
  const tee=COURSE.tees.find(t=>t.id===teeId);
  const total=COURSE.holes.reduce((s,h)=>s+h[teeId],0);
  return (
    <div style={{padding:22,paddingBottom:40}}>
      <button className="btn" onClick={onBack} style={{background:"transparent",color:C.muted,fontSize:14,padding:"8px 0",marginBottom:18}}>← Back</button>
      <div style={{fontSize:24,fontWeight:900,color:C.text,marginBottom:2}}>Round Setup</div>
      <div style={{fontSize:13,color:C.muted,marginBottom:26}}>The Wilds Golf Club · Prior Lake, MN</div>
      <Lbl>Your Name</Lbl>
      <input type="text" value={playerName} onChange={e=>setPlayerName(e.target.value)} style={{marginBottom:22}} />
      <Lbl>Select Tee Box</Lbl>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
        {COURSE.tees.map(t=>(
          <button key={t.id} className="btn" onClick={()=>setTeeId(t.id)}
            style={{background:teeId===t.id?t.color:C.card,color:teeId===t.id?t.textColor:C.muted,border:`2px solid ${teeId===t.id?t.color:C.cardBorder}`,padding:"14px 8px",borderRadius:14,fontSize:13,fontWeight:700,display:"flex",flexDirection:"column",gap:4,alignItems:"center"}}>
            <span style={{fontSize:22}}>●</span><span>{t.label}</span>
            <span style={{fontSize:11,opacity:0.85}}>{t.rating} / {t.slope}</span>
          </button>
        ))}
      </div>
      <div style={{background:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:14,padding:14,marginBottom:24,display:"flex",justifyContent:"space-around"}}>
        <Stat label="Total Yards" value={total.toLocaleString()} /><Stat label="Rating" value={tee.rating} /><Stat label="Slope" value={tee.slope} />
      </div>
      <Lbl>Compare Against Handicap</Lbl>
      <div style={{background:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:14,padding:16,marginBottom:6}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <span style={{fontSize:14,color:C.muted}}>Handicap Index</span>
          <span style={{fontSize:26,fontWeight:900,color:C.gold}}>{compHcp}</span>
        </div>
        <input type="range" min={0} max={36} value={compHcp} onChange={e=>setCompHcp(Number(e.target.value))} style={{width:"100%",accentColor:C.gold}} />
        <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:C.muted,marginTop:4}}><span>Scratch</span><span>36 HCP</span></div>
      </div>
      <div style={{fontSize:12,color:C.muted,marginBottom:24,lineHeight:1.6}}>Your SG will be compared against a typical {compHcp}-handicapper's strokes gained profile.</div>
      <Lbl>Gimme Distance</Lbl>
      <div style={{background:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:14,padding:14,marginBottom:32}}>
        <div style={{fontSize:12,color:C.muted,marginBottom:10,lineHeight:1.5}}>Putts inside this distance can be tapped in with the Gimme button.</div>
        <div style={{display:"flex",gap:8}}>
          {[1,2,3].map(ft=>(
            <button key={ft} className="btn" onClick={()=>setGimme(ft)}
              style={{flex:1,background:gimme===ft?C.gold:C.bg,color:gimme===ft?"#0f1923":C.muted,border:`1.5px solid ${gimme===ft?C.gold:C.cardBorder}`,padding:"12px 4px",fontSize:14,fontWeight:800,borderRadius:12}}>
              {ft} ft
            </button>
          ))}
        </div>
      </div>
      <button className="btn" onClick={onStart} style={{background:C.gold,color:"#0f1923",fontSize:17,fontWeight:800,padding:18,borderRadius:16,width:"100%"}}>Tee It Up →</button>
    </div>
  );
}

function RoundScreen({hole,holeIdx,teeId,shots,onAdd,onDelete,onClear,onNext,onPrev,onFinish,sg,holeShots,holes,runningScore,nineStr,gimme}) {
  const holeDist=hole[teeId];
  const isLast=holeIdx===17;
  const [lie,setLie]   = useState("fairway");
  const [dist,setDist] = useState("");
  const [unit,setUnit] = useState("yards");

  useEffect(()=>{setLie("fairway");setDist("");setUnit("yards");},[holeIdx]);
  useEffect(()=>{
    if(shots.length===0){setLie("fairway");setDist("");setUnit("yards");}
    else {
      const last=shots[shots.length-1];
      if(!last.holed){ setLie(last.lie==="green"?"green":"fairway"); setUnit(last.lie==="green"?"feet":"yards"); }
      setDist("");
    }
  },[shots.length]);

  function handleLieChange(l) { setLie(l); if(l==="green") setUnit("feet"); else if(unit==="feet") setUnit("yards"); }
  function toYards(v,u) { return u==="feet"?v/3:v; }

  function previewSG(toLie,toDistYards) {
    let before;
    if(!shots.length) before=teeBaseline(holeDist,hole.par);
    else { const p=shots[shots.length-1]; before=p.holed?0:baseline(p.lie,p.distYards); }
    const after=toLie==="hole"?0:baseline(toLie,toDistYards);
    return before-after-1;
  }

  function handleAdd(holed=false) {
    const dn=holed?0:parseFloat(dist)||0;
    const yds=holed?0:toYards(dn,unit);
    const fromLie=shots.length===0?"tee_box":shots[shots.length-1].lie;
    const fromYards=shots.length===0?holeDist:shots[shots.length-1].distYards;
    const sgVal=holed?previewSG("hole",0):previewSG(lie,yds);
    const cat=sgCat(fromLie,fromYards,hole.par,shots.length+1);
    onAdd(holeIdx,{lie:holed?"hole":lie,distYards:yds,distDisplay:dn,distUnit:unit,holed,sg:sgVal,cat});
    setDist("");setLie("fairway");setUnit("yards");
  }

  const dn=parseFloat(dist)||0;
  const sgPrev=(dist&&dn>0)?previewSG(lie,toYards(dn,unit)):null;

  const holeComplete=shots.length>0&&shots[shots.length-1].holed;
  const holeSG=sg.byHole[holeIdx];
  const score=shots.length;
  const scoreToPar=score-hole.par;
  const {diff:roundDiff,par:roundPar}=runningScore(holeIdx-1);
  const f9=nineStr(holeShots,0,8);
  const b9=nineStr(holeShots,9,17);

  const lastShot=shots.length>0?shots[shots.length-1]:null;
  const showGimme=!holeComplete&&lastShot&&lastShot.lie==="green";

  function handleGimme() {
    const gimmeYards=gimme/3;
    const before=baseline(lastShot.lie,lastShot.distYards);
    const after=baseline("green",gimmeYards);
    const sgTap=before-after-1;
    onAdd(holeIdx,{lie:"green",distYards:gimmeYards,distDisplay:gimme,distUnit:"feet",holed:false,sg:sgTap,cat:"putting"});
    setTimeout(()=>{
      const sgHole=after-0-1;
      onAdd(holeIdx,{lie:"hole",distYards:0,distDisplay:0,distUnit:"feet",holed:true,sg:sgHole,cat:"putting"});
    },50);
  }

  const sgC=v=>v>0.05?C.green:v<-0.05?C.red:C.muted;
  const sgS=v=>(v>0?"+":"")+v.toFixed(2);

  return (
    <div style={{display:"flex",flexDirection:"column",minHeight:"100vh"}}>
      <div style={{background:`linear-gradient(135deg,${C.navy} 0%,#0f1923 100%)`,padding:"16px 18px 12px",borderBottom:`1px solid ${C.cardBorder}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
          <div>
            <div style={{fontSize:11,color:C.gold,fontWeight:700,letterSpacing:2,textTransform:"uppercase"}}>Hole {hole.hole} · HCP {hole.hcp}</div>
            <div style={{fontSize:38,fontWeight:900,color:C.text,lineHeight:1}}>{holeDist} <span style={{fontSize:14,color:C.muted,fontWeight:400}}>yds</span></div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{background:C.gold,color:"#0f1923",fontWeight:800,fontSize:14,padding:"5px 14px",borderRadius:20,marginBottom:4}}>Par {hole.par}</div>
            {holeComplete&&<div style={{fontSize:13,fontWeight:700,color:scoreToPar<0?C.green:scoreToPar===0?C.muted:C.red}}>{score} ({scoreToPar>0?`+${scoreToPar}`:scoreToPar===0?"E":scoreToPar})</div>}
          </div>
        </div>
        {holeSG&&(()=>{
          const cats=[["T",holeSG.tee],["A",holeSG.approach],["G",holeSG.atg],["P",holeSG.putting]];
          const tot=cats.reduce((s,[,v])=>s+v,0);
          return (
            <div style={{display:"flex",gap:5,marginBottom:10,flexWrap:"wrap"}}>
              {cats.map(([l,v])=>(
                <div key={l} style={{background:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:8,padding:"3px 8px",fontSize:11,fontWeight:700,color:sgC(v)}}>{l}: {sgS(v)}</div>
              ))}
              <div style={{marginLeft:"auto",background:C.navy,border:`1px solid ${C.cardBorder}`,borderRadius:8,padding:"3px 10px",fontSize:11,fontWeight:800,color:sgC(tot)}}>{sgS(tot)} SG</div>
            </div>
          );
        })()}
        <div style={{display:"flex",alignItems:"center",gap:3}}>
          {Array.from({length:18},(_,i)=>(
            <span key={i} style={{display:"contents"}}>
              {i===9&&<span style={{display:"inline-block",width:1,height:16,background:C.cardBorder,margin:"0 3px",flexShrink:0}}/>}
              <span style={{display:"inline-block",width:14,height:14,borderRadius:"50%",background:i===holeIdx?C.gold:i<holeIdx?C.green:C.cardBorder,border:i===holeIdx?`2px solid ${C.goldLight}`:"none",transition:"all 0.2s",flexShrink:0}}/>
            </span>
          ))}
        </div>
        <div style={{fontSize:11,color:C.muted,marginTop:6,display:"flex",gap:8,flexWrap:"wrap"}}>
          {roundPar>0&&<span>Round: <span style={{fontWeight:700,color:roundDiff<0?C.green:roundDiff===0?C.text:C.red}}>{roundDiff>0?`+${roundDiff}`:roundDiff===0?"E":roundDiff}</span></span>}
          {f9&&<><span style={{color:C.cardBorder}}>·</span><span>F9: <span style={{fontWeight:600,color:C.text}}>{f9}</span></span></>}
          {b9&&<><span style={{color:C.cardBorder}}>·</span><span>B9: <span style={{fontWeight:600,color:C.text}}>{b9}</span></span></>}
        </div>
      </div>

      <div style={{flex:1,padding:16,overflowY:"auto"}}>
        {shots.length>0&&(
          <div style={{marginBottom:14}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <div style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1}}>Shots This Hole</div>
              <button className="btn" onClick={()=>onClear(holeIdx)} style={{background:"transparent",color:C.red,fontSize:12,padding:"2px 6px"}}>Clear all</button>
            </div>
            {shots.map((s,i)=>{
              const tYds=i===0?holeDist-s.distYards:shots[i-1].distYards-s.distYards;
              const li=LIES.find(l=>l.id===s.lie);
              return (
                <div key={i} style={{background:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:13,padding:"11px 13px",marginBottom:8}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{background:C.navy,borderRadius:8,width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,color:C.gold}}>{i+1}</div>
                      <div>
                        {s.holed
                          ?<div style={{fontSize:14,fontWeight:800,color:C.green}}>🏳️ In the Hole!</div>
                          :<div style={{display:"flex",alignItems:"center",gap:6}}>
                            {li&&<LieShape shape={li.shape} fill={li.fill} size={16}/>}
                            <span style={{fontSize:14,fontWeight:700,color:C.text}}>{s.distDisplay} {s.distUnit} · {li?.label}</span>
                          </div>
                        }
                        <div style={{fontSize:11,color:C.muted,marginTop:1}}>{Math.round(tYds)} yds traveled</div>
                      </div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <div style={{textAlign:"right"}}>
                        <div style={{fontSize:15,fontWeight:800,color:sgC(s.sg)}}>{sgS(s.sg)}</div>
                        <div style={{fontSize:10,color:C.muted,textTransform:"uppercase"}}>{s.cat==="tee"?"Tee":s.cat==="approach"?"App":s.cat==="atg"?"A/G":"Putt"}</div>
                      </div>
                      <button className="btn" onClick={()=>onDelete(holeIdx,i)} style={{background:"transparent",color:C.red,fontSize:16,padding:4}}>✕</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!holeComplete&&(
          <div style={{background:C.card,border:`1.5px solid ${C.gold}`,borderRadius:16,padding:16,marginBottom:14}}>
            <div style={{fontSize:13,fontWeight:700,color:C.gold,marginBottom:14,textTransform:"uppercase",letterSpacing:1}}>
              Shot {shots.length+1} — Where did it end up?
            </div>
            <Lbl small>Lie After Shot</Lbl>
            <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6,marginBottom:14}}>
              {LIES.map(l=>(
                <button key={l.id} className="btn" onClick={()=>handleLieChange(l.id)}
                  style={{background:lie===l.id?l.bg:C.bg,border:`1.5px solid ${lie===l.id?l.border:C.cardBorder}`,padding:"10px 2px",borderRadius:12,display:"flex",flexDirection:"column",alignItems:"center",gap:5,opacity:lie===l.id?1:0.55}}>
                  <LieShape shape={l.shape} fill={l.fill} size={24}/>
                  <span style={{fontSize:9,fontWeight:700,color:lie===l.id?l.fill:C.muted,lineHeight:1.2,textAlign:"center"}}>{l.label}</span>
                </button>
              ))}
            </div>
            <Lbl small>Distance Remaining to Hole</Lbl>
            <div style={{display:"flex",gap:8,marginBottom:8}}>
              <input type="number" placeholder={lie==="green"?"e.g. 12 ft":"e.g. 105 yds"} value={dist} onChange={e=>setDist(e.target.value)} style={{flex:1}}/>
              <div style={{display:"flex",background:C.bg,border:`1.5px solid ${C.cardBorder}`,borderRadius:10,overflow:"hidden"}}>
                {["yards","feet"].map(u=>(
                  <button key={u} className="btn" onClick={()=>setUnit(u)}
                    style={{background:unit===u?C.gold:"transparent",color:unit===u?"#0f1923":C.muted,padding:"0 11px",fontSize:12,fontWeight:700,borderRadius:0}}>
                    {u==="yards"?"yds":"ft"}
                  </button>
                ))}
              </div>
            </div>
            {sgPrev!==null&&(
              <div style={{background:C.bg,borderRadius:10,padding:"9px 14px",marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:12,color:C.muted}}>Strokes Gained Preview</span>
                <span style={{fontSize:20,fontWeight:900,color:sgC(sgPrev)}}>{sgS(sgPrev)}</span>
              </div>
            )}
            <div style={{display:"flex",gap:8}}>
              {shots.length>0&&(
                <button className="btn" onClick={()=>handleAdd(true)} style={{flex:1,background:C.green,color:"#fff",padding:14,fontSize:13,fontWeight:800}}>🏳️ In the Hole</button>
              )}
              <button className="btn" onClick={()=>handleAdd(false)} disabled={!dist}
                style={{flex:2,background:dist?C.gold:"#2a3a50",color:dist?"#0f1923":C.muted,padding:14,fontSize:15,fontWeight:800}}>
                Log Shot ✓
              </button>
            </div>
          </div>
        )}

        {showGimme&&(
          <button className="btn" onClick={handleGimme}
            style={{width:"100%",background:`linear-gradient(135deg,${C.gold},${C.goldLight})`,color:"#0f1923",fontSize:16,fontWeight:900,padding:18,borderRadius:16,marginBottom:14,display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
            <span style={{fontSize:22}}>🤜</span> Gimme! <span style={{fontSize:13,fontWeight:600,opacity:0.8}}>({gimme} ft)</span>
          </button>
        )}

        {holeComplete&&(
          <div style={{background:C.card,border:`1px solid ${C.green}`,borderRadius:14,padding:16,textAlign:"center",marginBottom:14}}>
            <div style={{fontSize:22}}>✅</div>
            <div style={{fontSize:15,fontWeight:700,color:C.green,marginTop:4}}>Hole Complete</div>
            <div style={{fontSize:13,color:C.muted}}>Score: {score} ({scoreToPar>0?`+${scoreToPar}`:scoreToPar===0?"Even":scoreToPar})</div>
          </div>
        )}
      </div>

      <div style={{padding:"12px 16px 28px",borderTop:`1px solid ${C.cardBorder}`,display:"flex",gap:10}}>
        <button className="btn" onClick={onPrev} disabled={holeIdx===0} style={{flex:1,background:C.card,color:holeIdx===0?C.cardBorder:C.text,padding:16,fontSize:15,opacity:holeIdx===0?0.4:1}}>← Prev</button>
        {isLast
          ?<button className="btn" onClick={onFinish} style={{flex:2,background:C.green,color:"#fff",padding:16,fontSize:15,fontWeight:800}}>Finish Round 🏁</button>
          :<button className="btn" onClick={onNext}   style={{flex:2,background:C.blue, color:"#fff",padding:16,fontSize:15,fontWeight:800}}>Next Hole →</button>
        }
      </div>
    </div>
  );
}

function ResultsScreen({sg,bench,compHcp,tee,playerName,holes,teeId,holeShots,tab,setTab,onNewRound}) {
  const {totals,byHole}=sg;
  const holesPlayed=byHole.filter(Boolean).length;
  const totalScore=byHole.reduce((s,h)=>s+(h?h.score:0),0);
  const totalPar=holes.reduce((s,h,i)=>byHole[i]?s+h.par:s,0);
  const scoreToPar=totalScore-totalPar;
  const cats=[{key:"tee",label:"Off the Tee",icon:"🏌️"},{key:"approach",label:"Approach",icon:"🎯"},{key:"atg",label:"Around Green",icon:"⛳"},{key:"putting",label:"Putting",icon:"🟢"}];
  const sgC=v=>v>0.1?C.green:v<-0.1?C.red:C.muted;
  const sgS=v=>(v>0?"+":"")+v.toFixed(2);
  const scoreLabel=n=>n>0?`+${n}`:n===0?"E":`${n}`;

  return (
    <div style={{padding:20,paddingBottom:48}}>
      <div style={{textAlign:"center",marginBottom:22}}>
        <div style={{fontSize:30,fontWeight:900,color:C.text}}>{playerName}'s Round</div>
        <div style={{fontSize:13,color:C.muted}}>{tee.label} Tees · {holesPlayed} holes tracked</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
        <div style={{background:`linear-gradient(135deg,${C.navy},#0f1923)`,border:`1.5px solid ${C.cardBorder}`,borderRadius:16,padding:18,textAlign:"center"}}>
          <div style={{fontSize:11,color:C.muted,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:4}}>Score</div>
          <div style={{fontSize:42,fontWeight:900,color:C.text,lineHeight:1}}>{totalScore}</div>
          <div style={{fontSize:16,fontWeight:700,color:scoreToPar<=0?C.green:scoreToPar<=2?C.gold:C.red,marginTop:4}}>{scoreLabel(scoreToPar)}</div>
        </div>
        <div style={{background:`linear-gradient(135deg,${C.navy},#0f1923)`,border:`1.5px solid ${C.gold}`,borderRadius:16,padding:18,textAlign:"center"}}>
          <div style={{fontSize:11,color:C.gold,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:4}}>Total SG</div>
          <div style={{fontSize:42,fontWeight:900,color:sgC(totals.total),lineHeight:1}}>{sgS(totals.total)}</div>
          <div style={{fontSize:13,color:C.muted,marginTop:4}}>vs. Scratch</div>
        </div>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        {["summary","scorecard","compare"].map(t=>(
          <button key={t} className="btn" onClick={()=>setTab(t)}
            style={{flex:1,background:tab===t?C.gold:C.card,color:tab===t?"#0f1923":C.muted,padding:"10px 4px",fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,borderRadius:10}}>
            {t==="summary"?"Summary":t==="scorecard"?"Scorecard":"Compare"}
          </button>
        ))}
      </div>

      {tab==="summary"&&(
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {cats.map(cat=>{
            const val=totals[cat.key]||0,bw=Math.min(Math.abs(val)/4*100,100);
            return (
              <div key={cat.key} style={{background:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:14,padding:16}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:22}}>{cat.icon}</span><span style={{fontSize:15,fontWeight:700,color:C.text}}>{cat.label}</span></div>
                  <span style={{fontSize:24,fontWeight:900,color:sgC(val)}}>{sgS(val)}</span>
                </div>
                <div style={{height:6,background:"#0f1923",borderRadius:4,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${bw}%`,background:val>=0?C.green:C.red,borderRadius:4,transition:"width 0.5s"}}/>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab==="scorecard"&&(
        <div>
          <div style={{background:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:16,overflow:"hidden",marginBottom:12}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",borderBottom:`2px solid ${C.gold}`}}>
              {["FRONT","BACK"].map(label=>(
                <div key={label} style={{padding:"8px 0",textAlign:"center",fontSize:11,fontWeight:800,color:C.gold,letterSpacing:1.5,borderRight:label==="FRONT"?`1px solid ${C.cardBorder}`:"none"}}>{label}</div>
              ))}
            </div>
            {Array.from({length:9},(_,r)=>{
              const fi=r,bi=r+9;
              const fh=holes[fi],bh=holes[bi];
              const fd=byHole[fi],bd=byHole[bi];
              function HoleCell({h,hd}) {
                const sc=hd?.score,diff=sc?sc-h.par:null;
                const st=hd?(hd.tee+hd.approach+hd.atg+hd.putting):null;
                return (
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 10px"}}>
                    <div>
                      <div style={{fontSize:12,fontWeight:800,color:C.gold}}>{h.hole} <span style={{fontSize:10,fontWeight:400,color:C.muted}}>p{h.par}</span></div>
                      <div style={{fontSize:9,color:C.muted}}>{h[teeId]}y</div>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:2}}>
                      {st!==null&&<div style={{fontSize:9,fontWeight:700,color:sgC(st)}}>{sgS(st)}</div>}
                      {sc
                        ?<div style={{width:26,height:26,borderRadius:diff<=-1?"50%":"4px",border:`2px solid ${diff<=-1?C.gold:diff===0?C.text:C.red}`,background:diff<=-2?C.gold:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:diff<=-2?"#0f1923":diff<=-1?C.gold:diff===0?C.text:C.red}}>{sc}</div>
                        :<div style={{width:26,height:26,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:C.muted}}>—</div>
                      }
                    </div>
                  </div>
                );
              }
              return (
                <div key={r} style={{display:"grid",gridTemplateColumns:"1fr 1fr",borderBottom:r<8?`1px solid ${C.cardBorder}`:"none"}}>
                  <div style={{borderRight:`1px solid ${C.cardBorder}`}}><HoleCell h={fh} hd={fd}/></div>
                  <div><HoleCell h={bh} hd={bd}/></div>
                </div>
              );
            })}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",borderTop:`2px solid ${C.cardBorder}`,background:C.navy}}>
              {[0,1].map(nine=>{
                const hr=Array.from({length:9},(_,i)=>nine*9+i);
                const ns=hr.reduce((s,i)=>s+(byHole[i]?byHole[i].score:0),0);
                const np=hr.reduce((s,i)=>byHole[i]?s+holes[i].par:s,0);
                const sgTot=hr.reduce((s,i)=>byHole[i]?s+(byHole[i].tee+byHole[i].approach+byHole[i].atg+byHole[i].putting):s,0);
                return (
                  <div key={nine} style={{padding:"8px 10px",borderRight:nine===0?`1px solid ${C.cardBorder}`:"none"}}>
                    <div style={{fontSize:10,fontWeight:700,color:C.gold,marginBottom:2}}>{nine===0?"OUT":"IN"}</div>
                    <div style={{fontSize:16,fontWeight:900,color:C.text}}>{ns||"—"} <span style={{fontSize:11,color:np&&ns?(ns-np<=0?C.green:C.red):C.muted}}>{np&&ns?scoreLabel(ns-np):""}</span></div>
                    <div style={{fontSize:10,color:sgC(sgTot),fontWeight:700}}>{sgTot?sgS(sgTot):""}</div>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{background:C.navy,border:`1px solid ${C.gold}`,borderRadius:14,padding:"12px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:15,fontWeight:800,color:C.gold}}>TOTAL</span>
            <div style={{textAlign:"right"}}>
              <span style={{fontSize:22,fontWeight:900,color:C.text}}>{totalScore} </span>
              <span style={{fontSize:14,color:scoreToPar<=0?C.green:C.red}}>({scoreLabel(scoreToPar)})</span>
              <div style={{fontSize:11,color:sgC(totals.total),fontWeight:700}}>{sgS(totals.total)} SG</div>
            </div>
          </div>
        </div>
      )}

      {tab==="compare"&&(
        <div>
          <div style={{background:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:14,padding:14,marginBottom:14}}>
            <div style={{fontSize:14,fontWeight:700,color:C.gold,marginBottom:4}}>vs. {compHcp}-Handicap Player</div>
            <div style={{fontSize:12,color:C.muted,lineHeight:1.6}}>Positive = you gained strokes on them in that category.</div>
          </div>
          {cats.map(cat=>{
            const mv=totals[cat.key]||0,cv=bench[cat.key]||0,dv=mv-cv;
            return (
              <div key={cat.key} style={{background:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:14,padding:16,marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <span style={{fontSize:15,fontWeight:700,color:C.text}}>{cat.icon} {cat.label}</span>
                  <span style={{fontSize:22,fontWeight:800,color:sgC(dv)}}>{sgS(dv)}</span>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:C.muted}}>
                  <span>You: <b style={{color:sgC(mv)}}>{sgS(mv)}</b></span>
                  <span>HCP {compHcp}: <b>{sgS(cv)}</b></span>
                </div>
              </div>
            );
          })}
          <div style={{background:`linear-gradient(135deg,${C.navy},#0f1923)`,border:`1.5px solid ${C.gold}`,borderRadius:16,padding:18,textAlign:"center",marginTop:4}}>
            <div style={{fontSize:11,color:C.gold,fontWeight:700,letterSpacing:2,marginBottom:4,textTransform:"uppercase"}}>Net vs HCP {compHcp}</div>
            <div style={{fontSize:48,fontWeight:900,color:sgC(totals.total-(bench.tee+bench.approach+bench.atg+bench.putting))}}>
              {sgS(totals.total-(bench.tee+bench.approach+bench.atg+bench.putting))}
            </div>
          </div>
        </div>
      )}

      <button className="btn" onClick={onNewRound} style={{width:"100%",background:C.gold,color:"#0f1923",fontSize:16,fontWeight:800,padding:18,borderRadius:16,marginTop:28}}>
        Start New Round
      </button>
    </div>
  );
}

function Lbl({children,small}) {
  return <div style={{fontSize:small?11:12,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>{children}</div>;
}
function Stat({label,value}) {
  return <div style={{textAlign:"center"}}><div style={{fontSize:20,fontWeight:800,color:C.gold}}>{value}</div><div style={{fontSize:11,color:C.muted}}>{label}</div></div>;
}
