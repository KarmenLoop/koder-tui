import {execFile} from 'node:child_process';
import {sanitize,truncate,textWidth} from './text.mjs';
export const STATUS_FIELDS=['mode','goal','model','tasks','cwd','git','tips'];
const defaults={mode:true,goal:false,model:true,tasks:true,cwd:false,git:false,tips:true};
export function statusSettings(config={}){
 const raw=config.tui?.statusLine||{};
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('STATUSLINE_CONFIG_INVALID');
 for(const key of STATUS_FIELDS)if(raw[key]!==undefined&&typeof raw[key]!=='boolean')throw Error('STATUSLINE_CONFIG_INVALID');
 const configured=Array.isArray(raw.items)?Object.fromEntries(STATUS_FIELDS.map(k=>[k,raw.items.includes(k)])):defaults;
 return {enabled:raw.enabled!==false,...configured,...Object.fromEntries(STATUS_FIELDS.filter(k=>raw[k]!==undefined).map(k=>[k,raw[k]]))};
}
const tips={
 en:['Ctrl+S steer','Ctrl+T Todo','Ctrl+Q queue','/help commands','Esc interrupt','Ctrl+O activity'],
 zh:['Ctrl+S 中途引导','Ctrl+T 展开 Todo','Ctrl+Q 排队任务','/help 全部命令','Esc 打断','Ctrl+O 活动记录']
};
export const tipAt=(time=Date.now(),lang='zh')=>tips[lang==='en'?'en':'zh'][Math.floor(time/6000)%tips.en.length];
export function contextPercent(usage){
 const used=usage?.estimated??usage?.lastPrompt,window=usage?.window;
 return Number.isFinite(used)&&used>=0&&Number.isFinite(window)&&window>0?Math.round(used/window*100):null;
}
export function renderStatus({context={},settings=defaults,width=100,lang='zh',todo={items:[]},queued=0,git=null,time=Date.now()}={}){
 if(settings.enabled===false)return '';
 const fields=[],model=sanitize(context.model||'not set'),percent=contextPercent(context.usage);
 if(settings.model)fields.push('Model: '+truncate(model,Math.max(7,Math.min(28,width-27))));
 fields.push('Context: '+(percent===null?'—':percent)+'%');
 if(settings.mode)fields.push('Mode: '+sanitize(context.mode||'standard'));
 if(settings.tasks){const items=todo?.items||[];fields.push('Tasks: '+items.filter(x=>x.status==='completed').length+'/'+items.length+' +'+queued);}
 if(settings.goal)fields.push('Goal: '+truncate(sanitize(context.goal||'—'),32));
 if(settings.cwd)fields.push('Cwd: '+truncate(sanitize(context.workspace||'—'),32));
 if(settings.git)fields.push('Git: '+sanitize(git||'—'));
 const tip=settings.tips?tipAt(time,lang):'';
 const mandatory=fields.splice(0,settings.model?2:1);let text=mandatory.join(' · ');
 for(const field of fields){if(textWidth(text+' · '+field)+(tip?textWidth(tip)+3:0)<=width)text+=' · '+field;}
 if(tip&&textWidth(text+' · '+tip)<=width)text+=' · '+tip;
 return truncate(text,width);
}
export function readGitStatus(cwd,{env=process.env,signal}={}){
 return new Promise(resolve=>execFile('git',['--no-optional-locks','-c','core.fsmonitor=false','status','--porcelain=v1','--branch','--untracked-files=no'],{cwd,env,signal,timeout:1500,maxBuffer:65536,windowsHide:true},(error,stdout)=>{
  if(error){resolve(null);return;}
  const [branch,...changes]=String(stdout).split('\n');resolve((branch?.replace(/^## /,'').split('...')[0]||'detached')+(changes.some(Boolean)?' *':''));
 }));
}
