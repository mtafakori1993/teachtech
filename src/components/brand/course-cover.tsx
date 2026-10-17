import type { CoverArt } from "@/data/types";

const PALETTES = [
  { bg: "#2F80ED", fg: "#FFFDF5", ac: "#F2C94C", ac2: "#F2994A", soft: "rgba(255,253,245,.18)" },
  { bg: "#F2C94C", fg: "#1F2937", ac: "#2F80ED", ac2: "#F2994A", soft: "rgba(31,41,55,.10)" },
  { bg: "#F2994A", fg: "#1F2937", ac: "#FFFDF5", ac2: "#2F80ED", soft: "rgba(31,41,55,.12)" },
  { bg: "#EAF2FF", fg: "#1859B8", ac: "#F2994A", ac2: "#F2C94C", soft: "rgba(47,128,237,.14)" },
];
const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

type P = (typeof PALETTES)[number];
const art: Record<CoverArt, (p: P) => React.ReactNode> = {
  parabola: (p) => (<g><path d="M40 205H360M200 30V220" stroke={p.soft} strokeWidth="3"/><path d="M70 40C130 250 270 250 330 40" fill="none" stroke={p.fg} strokeWidth="9" strokeLinecap="round"/><circle cx="200" cy="168" r="12" fill={p.ac}/><path d="M200 168V205" stroke={p.ac} strokeWidth="4" strokeDasharray="6 6"/></g>),
  triangle: (p) => (<g><path d="M90 200H300L90 70Z" fill={p.soft} stroke={p.fg} strokeWidth="8" strokeLinejoin="round"/><path d="M90 175h25v25" fill="none" stroke={p.ac} strokeWidth="6"/><path d="M262 200a38 38 0 0 0-14-30" fill="none" stroke={p.ac} strokeWidth="6"/><rect x="310" y="60" width="40" height="40" rx="8" fill={p.ac}/></g>),
  probability: (p) => (<g><g transform="rotate(-14 140 130)"><rect x="80" y="70" width="110" height="110" rx="22" fill={p.fg}/>{[[110,100],[135,125],[160,150],[160,100],[110,150]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r="9" fill={p.bg}/>)}</g><g transform="rotate(12 270 150)"><rect x="215" y="100" width="100" height="100" rx="20" fill={p.ac}/>{[[245,130],[285,170],[245,170],[285,130]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r="8" fill={p.bg === "#F2C94C" ? "#FFFDF5" : p.fg}/>)}</g></g>),
  graph: (p) => (<g><g stroke={p.fg} strokeWidth="5" strokeLinecap="round"><path d="M90 70L200 130L310 60M200 130L130 200M200 130L290 190M130 200L290 190"/></g>{[[90,70],[200,130],[310,60],[130,200],[290,190]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r="18" fill={i%2? p.ac : p.ac2} stroke={p.fg} strokeWidth="5"/>)}</g>),
  integral: (p) => (<g><path d="M50 205H350" stroke={p.soft} strokeWidth="4"/><path d="M70 205C120 60 200 60 250 120S320 160 340 120V205Z" fill={p.soft}/><path d="M70 205C120 60 200 60 250 120S320 160 340 120" fill="none" stroke={p.fg} strokeWidth="8" strokeLinecap="round"/><text x="30" y="150" fontSize="110" fontWeight="700" fill={p.ac}>∫</text></g>),
  circle: (p) => (<g><circle cx="200" cy="125" r="85" fill={p.soft} stroke={p.fg} strokeWidth="8"/><path d="M200 125L270 80M200 125L130 95" stroke={p.ac} strokeWidth="6" strokeLinecap="round"/><path d="M115 150L285 150" stroke={p.fg} strokeWidth="5"/><circle cx="200" cy="125" r="8" fill={p.ac2}/><path d="M285 150L200 210" stroke={p.ac2} strokeWidth="6" strokeLinecap="round"/></g>),
  limit: (p) => (<g><path d="M40 205H360M200 30V220" stroke={p.soft} strokeWidth="3"/><path d="M60 180C120 160 160 120 196 90M204 90C250 70 300 60 350 50" fill="none" stroke={p.fg} strokeWidth="8" strokeLinecap="round"/><circle cx="200" cy="90" r="11" fill={p.bg} stroke={p.ac} strokeWidth="6"/><circle cx="200" cy="140" r="9" fill={p.ac}/><text x="62" y="70" fontSize="42" fontWeight="700" fill={p.fg}>lim</text></g>),
  sequence: (p) => (<g>{[0,1,2,3,4,5].map((i)=><rect key={i} x={60+i*47} y={190-(i+1)*24} width="34" height={(i+1)*24} rx="9" fill={i%2? p.ac : p.fg}/>)}<path d="M70 95L330 40" stroke={p.ac2} strokeWidth="5" strokeDasharray="2 12" strokeLinecap="round"/></g>),
  conic: (p) => (<g><ellipse cx="200" cy="125" rx="130" ry="70" fill="none" stroke={p.fg} strokeWidth="8"/><circle cx="140" cy="125" r="9" fill={p.ac}/><circle cx="260" cy="125" r="9" fill={p.ac}/><path d="M200 55L140 125L200 195" fill="none" stroke={p.ac2} strokeWidth="5" strokeDasharray="8 8"/><path d="M40 125H360" stroke={p.soft} strokeWidth="3"/></g>),
  vector: (p) => (<g><defs><marker id="ah" markerWidth="8" markerHeight="8" refX="5" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z" fill={p.fg}/></marker><marker id="ah2" markerWidth="8" markerHeight="8" refX="5" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z" fill={p.ac}/></marker></defs><path d="M80 200L290 90" stroke={p.fg} strokeWidth="7" markerEnd="url(#ah)"/><path d="M80 200L320 200" stroke={p.ac} strokeWidth="7" markerEnd="url(#ah2)"/><path d="M80 200L120 60" stroke={p.ac2} strokeWidth="7" markerEnd="url(#ah)"/><path d="M130 200a50 50 0 0 0-16-37" fill="none" stroke={p.fg} strokeWidth="4"/></g>),
  matrix: (p) => (<g><path d="M110 50H80V200H110M290 50H320V200H290" fill="none" stroke={p.fg} strokeWidth="9" strokeLinecap="round"/>{[["2","−1"],["3","4"]].map((r,i)=>r.map((v,j)=><text key={`${i}${j}`} x={150+j*100} y={110+i*70} fontSize="52" fontWeight="700" textAnchor="middle" fill={(i+j)%2? p.ac : p.fg}>{v}</text>))}</g>),
  sets: (p) => (<g><circle cx="165" cy="125" r="78" fill={p.ac} fillOpacity=".75"/><circle cx="235" cy="125" r="78" fill={p.fg} fillOpacity=".55"/><circle cx="165" cy="125" r="78" fill="none" stroke={p.fg} strokeWidth="5"/><circle cx="235" cy="125" r="78" fill="none" stroke={p.fg} strokeWidth="5"/><text x="200" y="136" fontSize="38" fontWeight="700" textAnchor="middle" fill={p.bg}>∩</text></g>),
  exam: (p) => (<g><rect x="105" y="30" width="190" height="200" rx="18" fill={p.fg}/>{[75,115,155].map((y,i)=><g key={y}><path d={`M130 ${y}l12 12 22-26`} fill="none" stroke={i===1? p.ac2 : p.ac} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/><rect x="180" y={y-8} width="85" height="10" rx="5" fill={p.bg} fillOpacity=".5"/></g>)}<circle cx="300" cy="200" r="30" fill={p.ac}/><text x="300" y="212" fontSize="34" fontWeight="700" textAnchor="middle" fill={p.fg === "#FFFDF5" ? "#1F2937" : "#1F2937"}>A</text></g>),
  numbers: (p) => (<g fontWeight="700">{[["π",90,110,80,0],["∑",210,95,72,1],["7",300,170,76,2],["√",130,200,70,1],["x²",250,225,48,0]].map(([t,x,y,s,k],i)=><text key={i} x={x as number} y={y as number} fontSize={s as number} fill={[p.fg,p.ac,p.ac2][k as number]} textAnchor="middle">{t as string}</text>)}</g>),
};

export function CourseCover({ art: kind, seed, alt, className }: { art: CoverArt; seed: string; alt: string; className?: string }) {
  const p = PALETTES[hash(seed) % PALETTES.length];
  return (
    <svg viewBox="0 0 400 250" {...(alt ? { role: "img", "aria-label": alt } : { "aria-hidden": true })} className={className} preserveAspectRatio="xMidYMid slice">
      <rect width="400" height="250" fill={p.bg} />
      <circle cx="360" cy="-10" r="90" fill={p.soft} />
      <circle cx="30" cy="260" r="80" fill={p.soft} />
      {art[kind](p)}
    </svg>
  );
}
