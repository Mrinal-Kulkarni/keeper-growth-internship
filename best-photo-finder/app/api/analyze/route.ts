import {NextResponse} from "next/server";

export const runtime="nodejs";
const MAX_FILES=20,MAX_BYTES=6*1024*1024,TYPES=new Set(["image/jpeg","image/png","image/webp"]);

type Selection={index:number;score:number;reason:string};

export async function POST(request:Request){
  if(!process.env.OPENAI_API_KEY)return NextResponse.json({error:"AI selection is not configured. Add OPENAI_API_KEY to the server environment."},{status:503});
  try{
    const form=await request.formData();
    const count=Number(form.get("count"));
    const files=form.getAll("photos").filter((item):item is File=>item instanceof File);
    if(![2,3].includes(count)||files.length<count||files.length>MAX_FILES)return NextResponse.json({error:`Choose between ${count||2} and ${MAX_FILES} valid photos.`},{status:400});
    if(files.some(file=>!TYPES.has(file.type)||file.size>MAX_BYTES))return NextResponse.json({error:"Each processed image must be a JPEG, PNG, or WebP under 6 MB."},{status:400});

    const images=await Promise.all(files.map(async file=>({type:"input_image" as const,detail:"low" as const,image_url:`data:${file.type};base64,${Buffer.from(await file.arrayBuffer()).toString("base64")}`})));
    const content:Array<{type:"input_text";text:string}|{type:"input_image";detail:"low";image_url:string}>= [{type:"input_text",text:`Select exactly ${count} strongest profile photos of the same user from these ${files.length} candidates. Images are ordered 0 through ${files.length-1}. Prioritize: the person is clearly visible; flattering natural expression; sharp focus; balanced lighting; confident composition; variety across the final set. Do not infer sensitive traits or rate attractiveness. Return only indices from the provided range, with no duplicates.`},...images];
    const response=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,"Content-Type":"application/json"},body:JSON.stringify({model:process.env.OPENAI_MODEL||"gpt-5.4-mini",store:false,input:[{role:"user",content}],text:{format:{type:"json_schema",name:"photo_selection",strict:true,schema:{type:"object",properties:{selections:{type:"array",minItems:count,maxItems:count,items:{type:"object",properties:{index:{type:"integer",minimum:0,maximum:files.length-1},score:{type:"integer",minimum:1,maximum:100},reason:{type:"string"}},required:["index","score","reason"],additionalProperties:false}}},required:["selections"],additionalProperties:false}}}})});
    if(!response.ok){const detail=await response.text();console.error("OpenAI photo selection failed",response.status,detail);return NextResponse.json({error:"AI selection is temporarily unavailable. Please try again."},{status:502});}
    const data=await response.json() as {output?:Array<{type?:string;content?:Array<{type?:string;text?:string}>}>};
    const text=data.output?.flatMap(item=>item.content||[]).find(item=>item.type==="output_text")?.text;
    if(!text)throw new Error("Missing structured output");
    const parsed=JSON.parse(text) as {selections:Selection[]};
    const unique=parsed.selections.filter((item,index,array)=>Number.isInteger(item.index)&&item.index>=0&&item.index<files.length&&array.findIndex(other=>other.index===item.index)===index).slice(0,count);
    if(unique.length!==count)throw new Error("Invalid selection output");
    return NextResponse.json({selections:unique});
  }catch(error){console.error("Photo selection error",error);return NextResponse.json({error:"The photos could not be analyzed. Please try again."},{status:500});}
}
