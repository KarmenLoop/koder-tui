import fs from 'node:fs';
import {sp} from './paint.mjs';
const data=JSON.parse(fs.readFileSync(new URL('./assets/loop-cells.json',import.meta.url),'utf8'));
export function loopFrame(width=24,height=12,phase=0){
 const shades='░▒▓█';
 return Array.from({length:height},(_,y)=>Array.from({length:width},(_,x)=>{
  const drift=.35*Math.sin(phase*.7+y*.3),sx=Math.round((x-drift)/Math.max(1,width-1)*(data.cols-1)),sy=Math.round(y/Math.max(1,height-1)*(data.rows-1));
  const pixel=data.cells[sy*data.cols+Math.max(0,Math.min(data.cols-1,sx))];
  if(!pixel||pixel[3]<25)return sp(' ');
  const shimmer=.8+.2*Math.sin(phase+sx*.18+sy*.12),level=(pixel[0]+pixel[1]+pixel[2])/3;
  return sp(shades[Math.min(3,Math.floor(level/65))],{fg:pixel.slice(0,3).map(c=>Math.min(255,Math.round((c+24)*shimmer)))});
 }));
}
