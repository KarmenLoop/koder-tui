// Decode the existing RGBA asset into terminal-cell data; do not alter the PNG.
import fs from 'node:fs';
import zlib from 'node:zlib';
const file=new URL('../../../../.superdesign/assets/koder-refracting-loop-transparent.png',import.meta.url);
const png=fs.readFileSync(file),parts=[];let width,height;
for(let at=8;at<png.length;){const length=png.readUInt32BE(at),type=png.toString('ascii',at+4,at+8),data=png.subarray(at+8,at+8+length);if(type==='IHDR'){width=data.readUInt32BE(0);height=data.readUInt32BE(4);if(data[8]!==8||data[9]!==6||data[12]!==0)throw Error('Expected noninterlaced RGBA8 PNG');}if(type==='IDAT')parts.push(data);at+=length+12;}
const raw=zlib.inflateSync(Buffer.concat(parts)),stride=width*4,rgba=Buffer.alloc(width*height*4);
const paeth=(a,b,c)=>{const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c;};
for(let y=0;y<height;y++){const type=raw[y*(stride+1)];for(let x=0;x<stride;x++){const at=y*stride+x,left=x>=4?rgba[at-4]:0,up=y?rgba[at-stride]:0,corner=y&&x>=4?rgba[at-stride-4]:0;let filter=0;if(type===1)filter=left;else if(type===2)filter=up;else if(type===3)filter=Math.floor((left+up)/2);else if(type===4)filter=paeth(left,up,corner);else if(type!==0)throw Error('PNG filter');rgba[at]=(raw[y*(stride+1)+1+x]+filter)&255;}}
const cols=64,rows=40,cells=[];
for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const sums=[0,0,0,0];let count=0;for(let py=Math.floor(y*height/rows);py<Math.floor((y+1)*height/rows);py+=2)for(let px=Math.floor(x*width/cols);px<Math.floor((x+1)*width/cols);px+=2){const at=(py*width+px)*4;for(let c=0;c<4;c++)sums[c]+=rgba[at+c];count++;}cells.push(sums.map(v=>Math.round(v/count)));}
fs.mkdirSync(new URL('../src/assets/',import.meta.url),{recursive:true});fs.writeFileSync(new URL('../src/assets/loop-cells.json',import.meta.url),JSON.stringify({cols,rows,cells}));
console.log(JSON.stringify({sourceWidth:width,sourceHeight:height,cols,rows,transparent:cells.filter(x=>x[3]===0).length}));
