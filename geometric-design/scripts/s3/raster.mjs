// S3: real optional external Inkscape evidence with Node builtin PNG decoding.
// Independent of the Gauntlet and of paid JS/runtime image dependencies.
import { execFileSync } from 'node:child_process';
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { inflateSync } from 'node:zlib';
import { parseSvg } from '../s2/svg.mjs';
export const SIZES=Object.freeze([8,16,24,32,64,128]);
export const PNG_SIG=Buffer.from([137,80,78,71,13,10,26,10]);
// PNG critical integrity: verify chunk CRC before trusting pixel evidence.
const crcTable=Uint32Array.from({length:256},(_,n)=>{for(let k=0;k<8;k++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0});
function crc32(buf){let c=0xffffffff;for(const byte of buf)c=crcTable[(c^byte)&255]^(c>>>8);return(c^0xffffffff)>>>0}
export const sha256=b=>createHash('sha256').update(b).digest('hex');
const error=(code,detail)=>{const e=new Error(detail);e.code=code;throw e};
export function capability(binary='inkscape'){
  try {let s=execFileSync(binary,['--version'],{encoding:'utf8',timeout:3000,maxBuffer:2048});return {status:'AVAILABLE',binary,version:s.trim()}}catch(e){return {status:'BLOCKED_ENV',binary,reason:e.code??'EXEC_FAILED'}}
}
const paeth=(a,b,c)=>{const p=a+b-c,da=Math.abs(p-a),db=Math.abs(p-b),dc=Math.abs(p-c);return da<=db&&da<=dc?a:db<=dc?b:c};
export function decodePng(png){
 if(!Buffer.isBuffer(png)||!png.subarray(0,8).equals(PNG_SIG))error('INVALID_PNG','Missing PNG signature');
 let ptr=8,headers=null,idats=[],ended=false;
 while(ptr+12<=png.length){const len=png.readUInt32BE(ptr),type=png.toString('ascii',ptr+4,ptr+8);if(len>20000000||ptr+12+len>png.length)error('INVALID_PNG','Truncated or oversized chunk');const chunk=png.subarray(ptr+8,ptr+8+len);if(crc32(png.subarray(ptr+4,ptr+8+len))!==png.readUInt32BE(ptr+8+len))error('INVALID_PNG','Bad chunk CRC');ptr+=len+12;
  if(type==='IHDR'){if(headers||len!==13)error('INVALID_PNG','Duplicate/invalid IHDR');const width=chunk.readUInt32BE(0),height=chunk.readUInt32BE(4),depth=chunk[8],ct=chunk[9];if(!width||!height||width>4096||height>4096||depth!==8||!([0,2,4,6].includes(ct))||chunk[10]!==0||chunk[11]!==0||chunk[12]!==0)error('UNSUPPORTED_PNG','Only 8-bit noninterlaced gray/RGB/(gray)alpha PNG');headers={width,height,ct};}
  else if(type==='IDAT')idats.push(chunk);else if(type==='IEND'){ended=true;break}else if((type.charCodeAt(0)&32)===0)error('UNSUPPORTED_PNG','Unknown critical PNG chunk '+type);
 }
 if(!headers||!ended||!idats.length)error('INVALID_PNG','PNG missing critical data');const {width,height,ct}=headers,channels=ct===6?4:ct===2?3:ct===4?2:1,rowLength=width*channels;
 if(rowLength*height>25000000)error('LIMIT_EXCEEDED','PNG pixel budget exceeded');const inflated=inflateSync(Buffer.concat(idats),{maxOutputLength:(rowLength+1)*height+1024});if(inflated.length!==(rowLength+1)*height)error('INVALID_PNG','Unexpected uncompressed size');const rgba=Buffer.alloc(width*height*4);let prev=Buffer.alloc(rowLength),off=0;
 for(let y=0;y<height;y++){const filter=inflated[off++],row=Buffer.from(inflated.subarray(off,off+rowLength));off+=rowLength;if(filter>4)error('INVALID_PNG','Unknown PNG filter');for(let i=0;i<rowLength;i++){const a=i>=channels?row[i-channels]:0,b=prev[i],c=i>=channels?prev[i-channels]:0;let delta=filter===0?0:filter===1?a:filter===2?b:filter===3?Math.floor((a+b)/2):paeth(a,b,c);row[i]=(row[i]+delta)&255}
  for(let x=0;x<width;x++){const a=(y*width+x)*4,k=x*channels;if(ct===6){rgba[a]=row[k];rgba[a+1]=row[k+1];rgba[a+2]=row[k+2];rgba[a+3]=row[k+3]}else if(ct===2){rgba[a]=row[k];rgba[a+1]=row[k+1];rgba[a+2]=row[k+2];rgba[a+3]=255}else if(ct===4){rgba[a]=rgba[a+1]=rgba[a+2]=row[k];rgba[a+3]=row[k+1]}else{rgba[a]=rgba[a+1]=rgba[a+2]=row[k];rgba[a+3]=255}}
  prev=row;
 }return {width,height,rgba};
}
function components(mask,w,h){const visited=new Uint8Array(mask.length);let count=0,largest=0;const stack=[];for(let i=0;i<mask.length;i++){if(!mask[i]||visited[i])continue;count++;visited[i]=1;stack.push(i);let area=0;while(stack.length){const p=stack.pop();area++;const x=p%w,y=Math.floor(p/w);for(const n of [x>0?p-1:-1,x<w-1?p+1:-1,y>0?p-w:-1,y<h-1?p+w:-1])if(n>=0&&mask[n]&&!visited[n]){visited[n]=1;stack.push(n)}}largest=Math.max(largest,area)}return {count,largest}}
function holes(black,w,h){const seen=new Uint8Array(black.length),stack=[];let count=0;for(let i=0;i<black.length;i++){if(black[i]||seen[i])continue;let boundary=false;seen[i]=1;stack.push(i);while(stack.length){const p=stack.pop(),x=p%w,y=Math.floor(p/w);if(!x||x===w-1||!y||y===h-1)boundary=true;for(const n of [x>0?p-1:-1,x<w-1?p+1:-1,y>0?p-w:-1,y<h-1?p+w:-1])if(n>=0&&!black[n]&&!seen[n]){seen[n]=1;stack.push(n)}}if(!boundary)count++}return count}
export function rasterMetrics(png,{thresholds=[64,128,192]}={}){const {width,height,rgba}=decodePng(png),score=new Uint8Array(width*height);let mass=0,cx=0,cy=0;for(let i=0;i<score.length;i++){const k=i*4,alpha=rgba[k+3]/255,ink=(255-(rgba[k]*.2126+rgba[k+1]*.7152+rgba[k+2]*.0722))*alpha;score[i]=Math.min(255,Math.max(0,Math.round(255-ink)));mass+=ink;cx+=(i%width+.5)*ink;cy+=(Math.floor(i/width)+.5)*ink}const checks=thresholds.map(threshold=>{if(!Number.isInteger(threshold)||threshold<=0||threshold>=255)error('INVALID_THRESHOLD','Expected integer 1..254');const black=score.map(x=>Number(x<threshold)),co=components(black,width,height);return {threshold,components:co.count,largestBlackComponentPixels:co.largest,holes:holes(black,width,height),blackPixels:black.reduce((n,x)=>n+x,0)}});const exact=checks.every(x=>x.components===checks[0].components&&x.holes===checks[0].holes);return {width,height,thresholds:checks,thresholdTopologyStable:exact,inkMass:Number(mass.toFixed(6)),visualMassProxyCentroid:mass>0?[Number((cx/mass).toFixed(5)),Number((cy/mass).toFixed(5))]:null,geometryFrameCenter:[width/2,height/2],recognition:'NOT_EVALUATED'}}
export function diagnoseRaster(result,{expectedComponents,expectedHoles}={}){if(!Number.isInteger(expectedComponents)||!Number.isInteger(expectedHoles))return {status:'NOT_EVALUATED',reason:'No independently established topology expectation'};const match=result.thresholds.map(x=>x.components===expectedComponents&&x.holes===expectedHoles);return {status:match.every(Boolean)?'PASS':match.some(Boolean)?'INDETERMINATE':'FAIL',matchedThresholds:match.filter(Boolean).length,comparedThresholds:match.length,sourceGeometryExpectation:{components:expectedComponents,holes:expectedHoles},recognition:'NOT_EVALUATED'}}
export function renderSizes(svg,{sizes=SIZES,binary='inkscape'}={}){parseSvg(svg);const cap=capability(binary);if(cap.status!=='AVAILABLE')return {status:'BLOCKED_ENV',capability:cap,results:[]};const dir=mkdtempSync(join(tmpdir(),'geometry-s3-'));try {const input=join(dir,'input.svg');writeFileSync(input,svg,'utf8');const entries=[];for(const size of sizes){if(!Number.isInteger(size)||size<1||size>2048)error('INVALID_SIZE','size must be integer 1..2048');const out=join(dir,'out-'+size+'.png');execFileSync(binary,[input,'--export-filename='+out,'--export-width='+size,'--export-height='+size,'--export-area-page','--export-background=#ffffff','--export-background-opacity=255'],{timeout:10000,maxBuffer:2048});const png=readFileSync(out);const metrics=rasterMetrics(png);if(metrics.width!==size||metrics.height!==size)error('RENDER_MISMATCH','Rendered output size mismatch');entries.push({size,pngSha256:sha256(png),pngBytes:png.length,metrics,png})}return {status:'EXECUTED',renderer:cap,sourceSha256:sha256(Buffer.from(svg,'utf8')),results:entries}}finally{rmSync(dir,{recursive:true,force:true})}}
export function portableResult(result){return {...result,results:result.results.map(({png,...entry})=>entry)}}
