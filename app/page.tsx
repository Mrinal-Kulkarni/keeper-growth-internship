/* eslint-disable @next/next/no-img-element */
"use client";
import {validateSelections} from "../lib/selection";
import {ChangeEvent,DragEvent,useEffect,useRef,useState} from "react";
type Candidate={file:File;url:string};type Pick={index:number;score:number;reason:string};type Status="choose"|"review"|"analyzing"|"results";
const MAX_FILES=20,MAX_BYTES=25*1024*1024,TYPES=new Set(["image/jpeg","image/png","image/webp"]);
async function resize(file:File){const image=new Image(),url=URL.createObjectURL(file);image.src=url;try{await image.decode();const scale=Math.min(1,1600/Math.max(image.naturalWidth,image.naturalHeight)),canvas=document.createElement("canvas");if(!image.naturalWidth||!image.naturalHeight)throw new Error("Unreadable image");canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));const context=canvas.getContext("2d");if(!context)throw new Error();context.fillStyle="#fff";context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(image,0,0,canvas.width,canvas.height);return await new Promise<Blob>((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error()),"image/jpeg",.84))}finally{URL.revokeObjectURL(url)}}
function UploadIcon(){return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14v4.5A1.5 1.5 0 006.5 20h11a1.5 1.5 0 001.5-1.5V14"/></svg>}
export default function Home(){const[status,setStatus]=useState<Status>("choose"),[count,setCount]=useState<2|3>(3),[candidates,setCandidates]=useState<Candidate[]>([]),[picks,setPicks]=useState<Pick[]>([]),[dragging,setDragging]=useState(false),[message,setMessage]=useState("");const candidatesRef=useRef<Candidate[]>([]),busy=useRef(false),controller=useRef<AbortController|null>(null);
useEffect(()=>()=>{controller.current?.abort();candidatesRef.current.forEach(item=>URL.revokeObjectURL(item.url))},[]);
function updateCandidates(next:Candidate[]){candidatesRef.current=next;setCandidates(next)}
function clearCandidates(){candidatesRef.current.forEach(item=>URL.revokeObjectURL(item.url));updateCandidates([])}
function reset(){controller.current?.abort();controller.current=null;busy.current=false;clearCandidates();setPicks([]);setMessage("");setStatus("choose")}
function addFiles(files:File[]){
  if(busy.current)return;
  const next=[...candidatesRef.current];let invalid=0,duplicates=0,overflow=0;
  for(const file of files){
    if(!TYPES.has(file.type)||!file.size||file.size>MAX_BYTES){invalid++;continue}
    if(next.some(item=>item.file.name===file.name&&item.file.size===file.size&&item.file.lastModified===file.lastModified)){duplicates++;continue}
    if(next.length>=MAX_FILES){overflow++;continue}
    next.push({file,url:URL.createObjectURL(file)});
  }
  updateCandidates(next);if(next.length)setStatus("review");
  setMessage([invalid?`${invalid} unsupported, empty, or oversized files skipped. Use JPG, PNG, or WebP up to 25 MB.`:"",duplicates?`${duplicates} duplicate files skipped.`:"",overflow?`Only ${MAX_FILES} photos can be compared at once.`:""].filter(Boolean).join(" "));
}
function remove(index:number){if(busy.current)return;const item=candidatesRef.current[index];if(item)URL.revokeObjectURL(item.url);const next=candidatesRef.current.filter((_,i)=>i!==index);updateCandidates(next);setMessage(next.length<count?`Add at least ${count} photos for the AI to compare.`:"");if(!next.length)setStatus("choose")}
async function submit(){
  if(busy.current)return;
  if(candidatesRef.current.length<count){setMessage(`Add at least ${count} photos for the AI to compare.`);return}
  busy.current=true;const active=new AbortController();controller.current=active;setStatus("analyzing");setMessage("");
  try{
    const snapshot=[...candidatesRef.current],prepared:Blob[]=[],valid:Candidate[]=[],invalid:Candidate[]=[];
    // Process sequentially to avoid decoding twenty full-resolution images at once.
    for(const item of snapshot){
      if(active.signal.aborted)return;
      try{const blob=await resize(item.file);if(!blob.size||blob.size>6*1024*1024)throw new Error();prepared.push(blob);valid.push(item)}catch{invalid.push(item)}
    }
    if(active.signal.aborted)return;
    if(invalid.length){invalid.forEach(item=>URL.revokeObjectURL(item.url));updateCandidates(valid);setMessage(`${invalid.length} unreadable photos removed. Review the remaining photos before sending.`);setStatus(valid.length?"review":"choose");return}
    const form=new FormData();form.set("count",String(count));prepared.forEach((blob,index)=>form.append("photos",blob,`candidate-${index}.jpg`));
    const response=await fetch("/api/analyze",{method:"POST",body:form,signal:AbortSignal.any([active.signal,AbortSignal.timeout(75000)])});
    let data:{selections?:unknown;error?:string};
    try{data=await response.json()}catch{throw new Error("The service returned an unexpected response. Please try again.")}
    if(!response.ok)throw new Error(data?.error||"AI selection failed. Please try again.");
    const selections=validateSelections(data?.selections,count,snapshot.length);
    if(active.signal.aborted)return;
    setPicks(selections);setStatus("results");
  }catch(error){if(active.signal.aborted)return;setMessage(error instanceof Error&&error.name==="TimeoutError"?"Analysis took too long. Please try again with fewer photos.":error instanceof Error?error.message:"AI selection failed. Please try again.");setStatus("review")}
  finally{if(controller.current===active){busy.current=false;controller.current=null}}
}
function onInput(event:ChangeEvent<HTMLInputElement>){if(event.target.files)addFiles([...event.target.files]);event.target.value=""}function onDrop(event:DragEvent<HTMLLabelElement>){event.preventDefault();setDragging(false);addFiles([...event.dataTransfer.files])}
const currentStep=status==="choose"?1:status==="review"?2:status==="analyzing"?3:4;return <main><nav><a className="brand" href="#top">Keeper</a><span className="product-name">Photo Finder <i>AI</i></span><a className="keeper-link" href="https://app.keeper.ai/try" target="_blank" rel="noreferrer">Open Keeper <span>↗</span></a></nav><header id="top"><div className="eyebrow"><span/>AI photo selection</div><h1>Find the photos<br/>that <em>show you best.</em></h1><p>Upload recent photos of yourself. AI will compare them and select the strongest two or three for your profile.</p><ol className="steps" aria-label="Progress">{["Choose","Review","Analyze","Results"].map((label,index)=><li className={currentStep>index+1?"complete":currentStep===index+1?"current":""} key={label}><b>{index+1}</b>{label}</li>)}</ol></header>
<section className="workspace" aria-busy={status==="analyzing"}>{status==="choose"&&<div className="start"><div className="start-copy"><span className="kicker">Start with your favorites</span><h2>Choose clear photos of yourself</h2><p>Include a mix of portraits, full-body shots, and natural moments. For better comparisons, add at least five.</p><fieldset><legend>How many should AI select?</legend><label><input aria-label="Select 2 photos" type="radio" checked={count===2} onChange={()=>setCount(2)}/><span><b>2 photos</b><small>Focused profile</small></span></label><label><input aria-label="Select 3 photos" type="radio" checked={count===3} onChange={()=>setCount(3)}/><span><b>3 photos</b><small>More variety</small></span></label></fieldset><div className="source-help"><div><b>On iPhone or iPad</b><span>Tap Choose photos, then select Photo Library.</span></div><div><b>On desktop</b><span>Drag photos here or browse Finder/File Explorer.</span></div></div></div><label className={`dropzone ${dragging?"dragging":""}`} onDragEnter={()=>setDragging(true)} onDragLeave={()=>setDragging(false)} onDragOver={event=>event.preventDefault()} onDrop={onDrop}><input aria-label="Choose photos of yourself" type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={onInput}/><span className="upload-icon"><UploadIcon/></span><h2>Choose photos</h2><p>From Photos or your device</p><span className="primary-action">Choose photos</span><small>Up to 20 · JPG, PNG, WebP</small></label></div>}
{status==="review"&&<div className="review"><div className="results-head"><div><span className="kicker">Before you send</span><h2>Review your photos</h2><p>{candidates.length} selected · AI will choose the best {count}.</p></div><div className="head-actions"><label className="secondary-action">Add photos<input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={onInput}/></label><button className="secondary-action" onClick={reset}>Start over</button></div></div><div className="candidate-grid">{candidates.map((item,index)=><figure key={item.url}><img src={item.url} alt={`Candidate ${index+1}: ${item.file.name}`}/><figcaption>{index+1}</figcaption><button onClick={()=>remove(index)} aria-label={`Remove ${item.file.name}`}>×</button></figure>)}</div><div className="consent"><p><b>Ready for AI review?</b><span>Resized copies of these photos will be sent securely to the AI service for this selection.</span></p><button className="primary-action" onClick={submit} disabled={candidates.length<count}>Find my best {count}</button></div></div>}
{status==="analyzing"&&<div className="processing" role="status"><div className="spinner"/><h2>AI is comparing your photos</h2><p>Looking for clear faces, natural expression, lighting, composition, and variety.</p><small>This usually takes less than a minute.</small><button className="secondary-action" onClick={reset}>Cancel and start over</button></div>}
{status==="results"&&<div className="results"><div className="results-head"><div><span className="kicker">AI-selected set</span><h2>Your best {picks.length}</h2><p>Use these as a starting point—the final choice is yours.</p></div><button className="secondary-action" onClick={reset}>Try another set</button></div><div className={`final-grid count-${picks.length}`}>{picks.map((pick,rank)=>{const item=candidates[pick.index];return item&&<article key={item.url}><div className="photo-frame"><img src={item.url} alt={`${item.file.name}, selected number ${rank+1}`}/><span className="rank">{rank+1}</span>{rank===0&&<span className="best-label">Top pick</span>}</div><div className="final-copy"><div className="score"><strong>{pick.score}</strong><span>/ 100</span></div><p>{pick.reason}</p></div></article>})}</div><div className="results-footer"><p><span>✓</span><b>{picks.length} photos selected.</b> Ready for your Keeper profile.</p><a href="https://app.keeper.ai/try" target="_blank" rel="noreferrer">Open Keeper <span>→</span></a></div></div>}{message&&<div className="notice" role="alert">{message}<button onClick={()=>setMessage("")} aria-label="Dismiss">×</button></div>}</section><footer><span>Keeper Photo Finder</span><span>AI-assisted. You decide.</span></footer></main>}
