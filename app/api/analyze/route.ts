import {NextResponse} from "next/server";
import {validateSelections} from "../../../lib/selection";

export const runtime="nodejs";
const MAX_FILES=20,MAX_BYTES=6*1024*1024,TYPES=new Set(["image/jpeg","image/png","image/webp"]);

const MAX_BODY_BYTES=32*1024*1024;
class UploadError extends Error { constructor(message:string, public status:number){super(message)} }
async function readForm(request:Request){
  const contentType=request.headers.get("content-type")||"";
  if(!contentType.toLowerCase().startsWith("multipart/form-data"))throw new UploadError("Upload photos using a multipart form.",415);
  if(Number(request.headers.get("content-length"))>MAX_BODY_BYTES)throw new UploadError("This batch is too large. Upload fewer photos.",413);
  if(!request.body)throw new UploadError("No photos were received.",400);
  const reader=request.body.getReader(),chunks:Uint8Array[]=[];
  let size=0;
  try{
    while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>MAX_BODY_BYTES){await reader.cancel();throw new UploadError("This batch is too large. Upload fewer photos.",413)}chunks.push(value)}
  }finally{reader.releaseLock()}
  try{return await new Response(Buffer.concat(chunks),{headers:{"content-type":contentType}}).formData()}
  catch{throw new UploadError("The upload was incomplete or malformed. Please select your photos again.",400)}
}

export async function POST(request:Request){
  if(!process.env.OPENAI_API_KEY)return NextResponse.json({error:"AI selection is not configured. Add OPENAI_API_KEY to the server environment."},{status:503});
  try{
    const form=await readForm(request);
    const count=Number(form.get("count"));
    const entries=form.getAll("photos");
    if(entries.some(item=>!(item instanceof File)))throw new UploadError("Every photo must be an image file.",400);
    const files=entries as File[];
    if(form.getAll("count").length!==1||![2,3].includes(count))throw new UploadError("Choose a final set of two or three photos.",400);
    if(files.length<count||files.length>MAX_FILES)return NextResponse.json({error:`Choose between ${count||2} and ${MAX_FILES} valid photos.`},{status:400});
    if(files.some(file=>!TYPES.has(file.type)||file.size===0||file.size>MAX_BYTES))return NextResponse.json({error:"Each processed image must be a JPEG, PNG, or WebP under 6 MB."},{status:400});

    const images=await Promise.all(files.map(async file=>({type:"input_image" as const,detail:"low" as const,image_url:`data:${file.type};base64,${Buffer.from(await file.arrayBuffer()).toString("base64")}`})));
    const content:Array<{type:"input_text";text:string}|{type:"input_image";detail:"low";image_url:string}>= [{type:"input_text",text:`Select exactly ${count} strongest profile photos of the same user from these ${files.length} candidates. Images are ordered 0 through ${files.length-1}. Prioritize: the person is clearly visible; flattering natural expression; sharp focus; balanced lighting; confident composition; variety across the final set. Do not infer sensitive traits or rate attractiveness. Return only indices from the provided range, with no duplicates.`},...images];
    const response=await fetch("https://api.openai.com/v1/responses",{method:"POST",signal:AbortSignal.any([request.signal,AbortSignal.timeout(60000)]),headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,"Content-Type":"application/json"},body:JSON.stringify({model:process.env.OPENAI_MODEL||"gpt-5.4-mini",store:false,input:[{role:"user",content}],text:{format:{type:"json_schema",name:"photo_selection",strict:true,schema:{type:"object",properties:{selections:{type:"array",minItems:count,maxItems:count,items:{type:"object",properties:{index:{type:"integer",minimum:0,maximum:files.length-1},score:{type:"integer",minimum:1,maximum:100},reason:{type:"string"}},required:["index","score","reason"],additionalProperties:false}}},required:["selections"],additionalProperties:false}}}})});
    if(!response.ok){console.error("OpenAI photo selection failed",response.status);return NextResponse.json({error:"AI selection is temporarily unavailable. Please try again."},{status:502});}
    const data=await response.json() as {output?:Array<{type?:string;content?:Array<{type?:string;text?:string}>}>};
    const text=data.output?.flatMap(item=>item.content||[]).find(item=>item.type==="output_text")?.text;
    if(!text)throw new Error("Missing structured output");
    const parsed=JSON.parse(text) as {selections:unknown};
    const unique=validateSelections(parsed?.selections,count,files.length);
    return NextResponse.json({selections:unique});
  }catch(error){
    if(error instanceof UploadError)return NextResponse.json({error:error.message},{status:error.status});
    if(error instanceof Error&&(error.name==="TimeoutError"||error.name==="AbortError"))return NextResponse.json({error:"Analysis took too long or was cancelled. Please try again with fewer photos."},{status:504});
    console.error("Photo selection error",error);return NextResponse.json({error:"The photos could not be analyzed. Please try again."},{status:500});}
}
