import {mix} from '../../koder-cli/src/color.mjs';
export {mix,scale,to16,to256} from '../../koder-cli/src/color.mjs';
const stops=[[120,190,255],[100,220,220],[176,132,255],[240,140,190]];
export function spectrum(t){const at=Math.max(0,Math.min(0.99999,t))*(stops.length-1),i=Math.floor(at);return mix(stops[i],stops[i+1],at-i);}
