"use client";
import { useMemo, useState } from "react";

type Choice = "Either"|"Yes"|"No";
export default function StandardsCalculator(){
  const[gender,setGender]=useState<"Men"|"Women">("Men");
  const[kids,setKids]=useState<Choice>("Either");
  const[minAge,setMinAge]=useState(22),[maxAge,setMaxAge]=useState(42);
  const[minHeight,setMinHeight]=useState(68),[maxHeight,setMaxHeight]=useState(84);
  const[income,setIncome]=useState(0);
  const[ethnicity,setEthnicity]=useState("Any"),[hair,setHair]=useState("Any"),[eyes,setEyes]=useState("Any");
  const[education,setEducation]=useState("Any"),[religion,setReligion]=useState("Any");
  const[smokes,setSmokes]=useState<Choice>("No"),[drinks,setDrinks]=useState<Choice>("Either");
  const[married,setMarried]=useState<"Yes"|"No">("Yes"),[obese,setObese]=useState<"Yes"|"No">("Yes");
  const result=useMemo(()=>{
    let p=100;
    p*=Math.max(.07,(maxAge-minAge)/62);
    p*=Math.max(.08,(maxHeight-minHeight)/38);
    p*=Math.max(.06,1-income/310);
    if(kids!=="Either")p*=kids==="Yes"?.58:.42;
    if(ethnicity!=="Any")p*=.22;if(hair!=="Any")p*=.34;if(eyes!=="Any")p*=.28;
    if(education!=="Any")p*=education==="Graduate degree"?.14:.31;
    if(religion!=="Any")p*=.19;if(smokes!=="Either")p*=smokes==="No"?.79:.18;
    if(drinks!=="Either")p*=drinks==="Yes"?.68:.32;if(married==="Yes")p*=.56;if(obese==="Yes")p*=.71;
    return Math.max(.01,p);
  },[minAge,maxAge,minHeight,maxHeight,income,kids,ethnicity,hair,eyes,education,religion,smokes,drinks,married,obese]);
  const population=gender==="Men"?164977341:168048780,count=Math.round(population*result/100);
  const fmt=(n:number)=>new Intl.NumberFormat("en-US").format(n);
  const height=(n:number)=>`${Math.floor(n/12)}′${n%12}″`;
  return <main><nav><a href="#">Keeper</a><div><a href="https://app.keeper.ai/signup">Get matched</a><a href="https://app.keeper.ai/login">Login</a><button aria-label="Menu">☰</button></div></nav>
    <div className="calculator"><section className="controls"><header><h1>What percent of {gender.toLowerCase()} in the United States meet your standards?</h1><p>Every preference updates your estimate instantly.</p></header>
      <div className="form-scroll">
        <ControlRow label="I&apos;m attracted to"><Segment values={["Women","Men"]} value={gender} onChange={v=>setGender(v as "Men"|"Women")}/></ControlRow>
        <ControlRow label="Wants kids"><Segment values={["Either","Yes","No"]} value={kids} onChange={v=>setKids(v as Choice)}/></ControlRow>
        <SliderRow label="Age" value={`${minAge} – ${maxAge}`}><div className="dual"><input aria-label="Minimum age" type="range" min="18" max="74" value={minAge} onChange={e=>setMinAge(Math.min(+e.target.value,maxAge-1))}/><input aria-label="Maximum age" type="range" min="19" max="75" value={maxAge} onChange={e=>setMaxAge(Math.max(+e.target.value,minAge+1))}/></div></SliderRow>
        <SliderRow label="Height" value={`${height(minHeight)} – ${height(maxHeight)}`}><div className="dual"><input aria-label="Minimum height" type="range" min="58" max="83" value={minHeight} onChange={e=>setMinHeight(Math.min(+e.target.value,maxHeight-1))}/><input aria-label="Maximum height" type="range" min="59" max="96" value={maxHeight} onChange={e=>setMaxHeight(Math.max(+e.target.value,minHeight+1))}/></div></SliderRow>
        <SliderRow label="Minimum Income" value={income?`$${income.toLocaleString()},000`:"$0"}><input type="range" min="0" max="250" step="10" value={income} onChange={e=>setIncome(+e.target.value)}/></SliderRow>
        <SelectRow label="Ethnicity" value={ethnicity} onChange={setEthnicity} options={["Any","Asian","Black","Hispanic","Middle Eastern","White","Other"]}/>
        <SelectRow label="Hair Color" value={hair} onChange={setHair} options={["Any","Black","Brown","Blonde","Red","Other"]}/>
        <SelectRow label="Eye Color" value={eyes} onChange={setEyes} options={["Any","Brown","Blue","Green","Hazel","Other"]}/>
        <SelectRow label="Minimum Education" value={education} onChange={setEducation} options={["Any","High school","Bachelor’s degree","Graduate degree"]}/>
        <SelectRow label="Religion" value={religion} onChange={setReligion} options={["Any","Christian","Jewish","Muslim","Hindu","Buddhist","Atheist / agnostic","Other"]}/>
        <ControlRow label="Smokes"><Segment values={["Either","Yes","No"]} value={smokes} onChange={v=>setSmokes(v as Choice)}/></ControlRow>
        <ControlRow label="Drinks"><Segment values={["Either","Yes","No"]} value={drinks} onChange={v=>setDrinks(v as Choice)}/></ControlRow>
        <ControlRow label="Exclude Married"><Segment values={["Yes","No"]} value={married} onChange={v=>setMarried(v as "Yes"|"No")}/></ControlRow>
        <ControlRow label="Exclude Obese"><Segment values={["Yes","No"]} value={obese} onChange={v=>setObese(v as "Yes"|"No")}/></ControlRow>
      </div><div className="source">Calculated using U.S. Census, CDC, and other public data sources</div></section>
      <section className="result-panel"><div className="botanical" aria-hidden="true">{Array.from({length:10},(_,i)=><i key={i}/>)}</div><div className="result-card"><small>LIVE ESTIMATE</small><strong>{result.toFixed(result<1?2:1)}%</strong><p>of {gender.toLowerCase()} in the United States meet these demographic preferences.</p><div className="count"><span>Approximately</span><b>{fmt(count)}</b><span>out of {fmt(population)} {gender.toLowerCase()}</span></div><div className="live-note"><i/>Updates as you adjust any filter</div><a href="https://app.keeper.ai/signup">Find the right one on Keeper <span>→</span></a></div><p className="disclaimer">Demographic rarity is not romantic destiny. Compatibility, geography, mutual attraction, and timing matter too.</p></section>
    </div></main>
}
function ControlRow({label,children}:{label:string;children:React.ReactNode}){return <div className="control-row"><label>{label}</label>{children}</div>}
function SliderRow({label,value,children}:{label:string;value:string;children:React.ReactNode}){return <div className="control-row slider-row"><label>{label}</label><div className="slider-control">{children}<output>{value}</output></div></div>}
function Segment({values,value,onChange}:{values:string[];value:string;onChange:(v:string)=>void}){return <div className="segment">{values.map(v=><button className={v===value?"selected":""} onClick={()=>onChange(v)} key={v}>{v}</button>)}</div>}
function SelectRow({label,value,onChange,options}:{label:string;value:string;onChange:(v:string)=>void;options:string[]}){return <div className="control-row select-row"><label>{label}</label><div><select aria-label={label} value={value} onChange={e=>onChange(e.target.value)}>{options.map(o=><option key={o}>{o}</option>)}</select><span>⌄</span></div></div>}
