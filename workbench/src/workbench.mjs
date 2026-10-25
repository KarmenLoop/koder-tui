import {STATUS_FIELDS,statusSettings,readGitStatus} from './status.mjs';
import {createLayout} from './layout.mjs';
import path from 'node:path';
import {Writable} from 'node:stream';
import {createEditor} from './editor.mjs';
import {createKeyParser} from './keys.mjs';
import {createScreen,fitSpans,sp,toAnsi,wrapSpans} from './paint.mjs';
import {renderMarkdown} from './markdown.mjs';
import {sanitize,truncate,textWidth} from './text.mjs';
import {C} from './theme.mjs';
import {catalog,slashCatalog,searchCatalog,parseLocal,parseWords,quoteArg} from './catalog.mjs';
import {createUiPrompter} from './prompter.mjs';
import {createOutputBuffer} from './output.mjs';
import {colorDepth} from '../../koder-cli/src/color.mjs';
import {loadConfig,saveConfig,resolveLang} from '../../koder-cli/src/config.mjs';
import {parseFlags} from '../../koder-cli/src/argv.mjs';
import {theme,detectTheme,setTheme} from '../../koder-cli/src/theme.mjs';
import * as defaultRuntime from '../../koder-cli/src/cli.mjs';

export const VERSION='0.3.0';
// These modules own raw terminal screens or long-lived streams. Their exact CLI
// UI runs in this same process, preserving chat/preview/service ownership.
export const NATIVE_MODULES=new Set(['setup','onboard','prompts','netlify','celebrate','gateway','connect','acp','update','uninstall','migrate']);

export async function runWorkbench(argv=['chat'],io={},runtime=defaultRuntime){
 const stdin=io.stdin||process.stdin,stdout=io.stdout||process.stdout,stderr=io.stderr||process.stderr,env=io.env||process.env;
 if(!stdin.isTTY||!stdout.isTTY){stderr.write('KODER_TUI_REQUIRES_TTY: use koder-tui -- <CLI arguments> for pipes or JSON.\n');return 2;}
 const opts=parseFlags(argv.filter((arg,i)=>i!==0||arg!=='chat')).opts;
 let lang=resolveLang({flag:opts.lang,env,config:loadConfig(env)});
 const tr=(zh,en)=>lang==='en'?en:zh;
 const draft=createEditor(),answer=createEditor(),search=createEditor(),keys=createKeyParser(io.resume?.input?.tuiKeys),output=createOutputBuffer();
 if(io.resume?.input?.draft)draft.set(io.resume.input.draft);
 for(const text of io.resume?.input?.history||[])draft.remember(text);
 const screen=createScreen(stdout,{depth:colorDepth({env,stream:stdout,flag:opts.color})});
 const activities=[];let context={workspace:path.resolve(io.cwd||process.cwd(),opts.workspace||'.'),engine:opts.engine||'koder',mode:opts.mode||'standard',session:opts.session||'default'};
 let closed=false,closing=false,suspended=0,scheduled=false,paintTimer=null,escapeTimer=null,question=null,panel=null,panelIndex=0,scroll=0,view='conversation',busy=false,status='starting',backend=null,prompter=null,abort,activeCommand=null;
 let cliReady=false,queueFocus=false,queueIndex=0,currentTask=null;const completed=[];const renderLayout=createLayout();let motionTimer=null,statusTimer=null;
 let todo={items:[]},todoExpanded=loadConfig(env).tui?.todoExpanded===true,todoOffset=0,git=null,gitCwd=null,gitAt=0,gitBusy=false,steering=false;
 const gitAbort=new AbortController();
 function settings(){try{return statusSettings(loadConfig(env));}catch{return statusSettings();}}
 function refreshGit(){if(!settings().git){git=null;return;}const cwd=context.workspace;if(gitBusy||cwd===gitCwd&&Date.now()-gitAt<10000)return;gitBusy=true;gitAt=Date.now();gitCwd=cwd;void readGitStatus(cwd,{env,signal:gitAbort.signal}).then(value=>{if(context.workspace===cwd)git=value;}).finally(()=>{gitBusy=false;schedule();});}
 let resolveDone;const done=new Promise(resolve=>resolveDone=resolve);
 const row=(text='',fg=C.text,bg=C.panelBg)=>fitSpans([sp(sanitize(text),{fg,bg})],Math.max(1,stdout.columns||80),{fg,bg});
 function paletteTheme(){
  const p=setTheme(detectTheme({env,config:loadConfig(env)}));
  Object.assign(C,{text:p.text,soft:p.text2,dim:p.text3,faint:p.text3,accent:p.accent,cyan:p.accent,ok:p.ok,warn:p.warn,bad:p.del,headerBg:p.heroA,panelBg:p.stage,codeBg:p.heroA,border:p.line,selectBg:p.heroB});
 }
 function schedule(){if(closed||suspended||scheduled)return;scheduled=true;paintTimer=setTimeout(()=>{scheduled=false;if(!closed&&!suspended)paint();},16);}
 function note(text){output.append('\n'+text+'\n');scroll=0;schedule();}
 function normalizedInput(text){const local=parseLocal(text);return local?'/'+local.argv.map(quoteArg).join(' '):text;}
 function enqueue(text){const input=normalizedInput(text);void Promise.resolve(prompter?.enqueue(input)).catch(error=>note(error.code||error.message));}
 function frame(){
  paletteTheme();refreshGit();
  const result=renderLayout({cols:stdout.columns||80,rows:stdout.rows||24,lang,context,output:output.text,activities,draft,answer,question,panel,search,panelIndex,queue:prompter?.queued?.()||[],queueIndex,queueFocus,currentTask,completed,status,phase:env.KODER_REDUCED_MOTION==='1'?0:Date.now()/1000*(busy?1.3:.35),runtimeVersion:runtime.VERSION,view,scroll,todo,todoExpanded,todoOffset,statusSettings:settings(),git});
  scroll=result.scroll;todoOffset=result.todoOffset??todoOffset;panelIndex=result.panelIndex??panelIndex;return result;
 }
 function paint(){const f=frame();screen.paint(f.rows.map(line=>toAnsi(line,screen.depth)),f.cursor);}
 async function native(work){
  if(suspended){suspended++;try{return await work();}finally{suspended--;}}
  suspended=1;clearTimeout(paintTimer);scheduled=false;clearTimeout(escapeTimer);stdin.off('data',onData);stdin.pause();stdin.setRawMode?.(false);screen.leave();
  try{return await work();}
  finally{stdin.pause();suspended=0;if(!closed){stdin.setRawMode?.(true);stdin.on('data',onData);screen.enter();stdin.resume();schedule();}}
 }
 const capture=new Writable({write(chunk,_encoding,callback){try{if(suspended)stdout.write(chunk);else{output.append(chunk);schedule();}callback();}catch(error){callback(error);}}});
 Object.defineProperties(capture,{isTTY:{value:true},columns:{get:()=>stdout.columns},rows:{get:()=>stdout.rows}});
 function makePrompter(){
  return createUiPrompter({output:capture,suspend:native,initial:io.resume?.input||{},onQueue:schedule,snapshotDraft:()=>draft.value,snapshotHistory:()=>draft.history(),snapshotExtra:()=>({tuiKeys:keys.snapshot(),pendingBytes:keys.pendingBytes()}),freezeInput:()=>{stdin.pause();const chunks=[];while(stdin.readableLength){const chunk=stdin.read(stdin.readableLength);if(chunk===null)break;chunks.push(Buffer.from(chunk));}return chunks.length?{rawBytes:Buffer.concat(chunks).toString('base64')}:{};},
   onQuestion:q=>{question=q;if(!q.chat)answer.clear();status=q.chat?'ready':'waiting';schedule();},
   onBusy:value=>{busy=value;status=value?'running':'ready';question=null;schedule();},
   onPrefill:text=>{if(!draft.empty)return {ok:false,reason:'input-pending'};draft.set(text);schedule();return {ok:true};}});
 }
 async function dispatchLocal(args,nextIo,run){
  const owner={controller:new AbortController(),cancel:null};activeCommand=owner;
  const commandIo={...nextIo,stopSignal:AbortSignal.any([owner.controller.signal,nextIo.stopSignal].filter(Boolean)),onSession:session=>{owner.cancel=()=>session.cancel();nextIo.onSession?.(session);}};
  const name=defaultRuntime.splitCommand(args).name||'run',entry={name,code:null,native:NATIVE_MODULES.has(name)};activities.push(entry);if(activities.length>100)activities.shift();
  status='running';currentTask={state:'running',text:name};schedule();
  try{
   const nativeIo={...commandIo,stdin,stdout,stderr,dispatchLocal:undefined,prompter:undefined,promptSecret:undefined,promptText:undefined};
   if(entry.native)entry.code=await native(()=>run(args,{...nativeIo,promptSecret:async label=>{const {readSecret}=await import('../../koder-cli/src/secret-input.mjs');return readSecret({stdin,stdout,stderr,io:{stopSignal:abort.signal}},label);}}));
   else entry.code=await run(args,commandIo);
   completed.push({text:name,state:entry.code===0?'completed':entry.code===130?'cancelled':'failed'});if(completed.length>40)completed.shift();note(`\n${name} · exit ${entry.code??0}`);return entry.code;
  }catch(error){entry.code=1;throw error;}finally{if(activeCommand===owner){activeCommand=null;currentTask=null;}status='ready';schedule();}
 }
 async function launch(args){
  if(backend||closing)return;
  prompter=makePrompter();abort=new AbortController();question=null;
  const baseIo={...io,onReady:async()=>{cliReady=true;await io.onReady?.();},env,stdin,stdout:capture,stderr:capture,cwd:io.cwd||process.cwd(),prompter,tui:true,stopSignal:abort.signal,dispatchLocal,commandWords:parseWords,
   isLocalInput:text=>!/^\/(?:[^\s]*\/|[^\s]*\.[^\s]*)/.test(text),
   promptText:label=>prompter.ask(label,{fresh:true}),promptSecret:label=>prompter.ask(label,{fresh:true,secret:true}),
   onUiTodo:value=>{todo=value&&Array.isArray(value.items)?value:{items:[]};schedule();},
   onUiTask:task=>{if(task.state==='running'){currentTask={...task};context.goal=task.text;}else {completed.push({...task});if(completed.length>40)completed.shift();currentTask=null;}schedule();},
   onUiReload:()=>{todoExpanded=loadConfig(env).tui?.todoExpanded===true;todoOffset=0;schedule();},
   onUiContext:value=>{context={...context,...value};lang=value.lang||lang;status=busy?'running':'ready';schedule();}};
  backend=runtime.runCli(args,baseIo);
  try{
   const code=await backend;
   if(io.restart?.pending){await finish(code,{stop:false});return;}
   if(code===0){await finish(0,{stop:false});return;}
   if(!cliReady){await finish(code,{stop:false});return;}
   status=`exit ${code}`;question=null;note(tr('CLI 未启动。可从模块打开 eula、setup 或 doctor。','CLI did not start. Open eula, setup or doctor from Modules.'));
  }catch(error){status='failed';note(sanitize(error.code||error.message||'CLI_FAILED'));if(!cliReady)await finish(1,{stop:false});}
  finally{backend=null;}
 }
 async function send(){
  if(question&&!question.chat){const q=question;const text=answer.value;answer.clear();question=null;prompter.answer(text,q.id);schedule();return;}
  const text=draft.value;if(!text.trim())return;
  if(/^\/(?:modules|模块|commands)\s*$/.test(text.trim())){draft.clear();panel='modules';search.clear();panelIndex=0;schedule();return;}
  if(/^\/help\s*$/.test(text.trim())){draft.clear();panel='help';search.clear();panelIndex=0;schedule();return;}
  if(/^\/statusline(?:\s|$)/.test(text.trim())){
   const [,field,value,...extra]=parseWords(text.trim());const config=loadConfig(env);let next=settings();
   if(field==='reset'&&!value)next=statusSettings();
   else if(field&&STATUS_FIELDS.includes(field)&&['on','off'].includes(value)&&!extra.length)next={...next,[field]:value==='on'};
   else if(field){note('Usage: /statusline [mode|goal|model|tasks|cwd|git|tips] [on|off] · /statusline reset');return;}
   if(field)saveConfig({tui:{...config.tui,statusLine:{...config.tui?.statusLine,...next,items:[...STATUS_FIELDS.filter(k=>next[k]),'context']}}},env);
   note('Status: '+STATUS_FIELDS.map(k=>k+'='+ (next[k]?'on':'off')).join(' · '));draft.clear();schedule();return;
  }
  if(/^\/queue\s+/.test(text.trim())){const queued=text.trim().replace(/^\/queue\s+/,'');enqueue(queued);draft.clear();schedule();return;}
  if(/^\/activity\s*$/.test(text.trim())){draft.clear();view='activity';schedule();return;}
  if(/^\/clear\s*$/.test(text.trim())){draft.clear();output.clear();schedule();return;}
  const local=parseLocal(text);
  if(!local)draft.remember(text);
  draft.clear();scroll=0;view='conversation';
  if(backend){note('❯ '+(local?local.name:text));await prompter.submit(normalizedInput(text));}
  else if(local){
   prompter=makePrompter();abort=new AbortController();
   try{await dispatchLocal(local.argv,{...io,env,stdin,stdout:capture,stderr:capture,prompter,noStdin:true,tui:true,promptSecret:label=>prompter.ask(label,{fresh:true,secret:true}),promptText:label=>prompter.ask(label,{fresh:true}),stopSignal:abort.signal},runtime.runCli);}
   catch(error){note(error.code||error.message);}
   void launch(argv);
  }else {void launch(argv);await prompter?.submit(text);}
  schedule();
 }
 async function steer(){
  if(steering)return;
  if(question&&!question.chat){note(tr('请先回答当前问题；引导不会代替审批回答。','Answer the current question first; steering cannot answer approvals.'));return;}
  const text=draft.value;if(!text.trim())return;
  if(!busy){note('STEER_NOT_RUNNING');return;}
  steering=true;draft.clear();note('❯ [Steer] '+text);schedule();
  try{const result=await prompter.steer(text);
   if(result?.accepted){draft.remember(text);note(tr('已补充到当前任务，将在下一个安全模型步骤采用。','Added to the current task at its next safe model step.'));}
   else if(result?.uncertain)note((result.reason||'STEER_RECEIPT_UNKNOWN')+': '+tr('接收状态未知，请先核对结果；未自动排队或重发。','Receipt unknown; check the result before resending.'));
   else {draft.set(text+(draft.value?'\n'+draft.value:''));note((result?.reason||'STEER_NOT_RUNNING')+': '+tr('未接收，草稿已保留。','Not accepted; draft preserved.'));}
  }catch(error){note((error.code||'STEER_RECEIPT_UNKNOWN')+': '+tr('请先核对执行结果，未自动重发。','Check execution before resending.'));}
  finally{steering=false;schedule();}
 }
 function edit(editor,key){
  if(key.name==='text'||key.name==='paste')editor.insert(key.text);
  else if(key.name==='backspace')editor.backspace();else if(key.name==='delete')editor.deleteForward();
  else if(key.name==='left')editor.left();else if(key.name==='right')editor.right();
  else if(key.name==='home')editor.home();else if(key.name==='end')editor.end();
  else if(key.name==='newline')editor.insert('\n');
  else if(key.name==='up'){if(!editor.up())editor.historyPrev();}else if(key.name==='down'){if(!editor.down())editor.historyNext();}
  else if(key.ctrl){const actions={a:()=>editor.home(),e:()=>editor.end(),u:()=>editor.killToStart(),k:()=>editor.killToEnd(),w:()=>editor.deleteWordBack()};actions[key.name]?.();}
 }
 function handle(key){
  if(closing)return;
  if(panel){
   if(key.name==='escape'){panel=null;return;}
   if(key.name==='up'){panelIndex--;return;}if(key.name==='down'){panelIndex++;return;}
   if(key.name==='enter'||key.name==='tab'){const selected=searchCatalog(search.value,lang,panel==='help'?slashCatalog:catalog)[panelIndex];if(selected){draft.set('/'+selected.name+' ');panel=null;}return;}
   edit(search,key);panelIndex=0;return;
  }
  if(key.ctrl&&key.name==='q'){queueFocus=!queueFocus;queueIndex=0;return;}
  if(key.alt&&key.name==='q'){const text=draft.value.trim();if(text){enqueue(text);draft.clear();}return;}
  if(queueFocus){
   const count=prompter?.queued?.().length||0;
   if(key.name==='escape'||key.name==='enter'){queueFocus=false;return;}
   if(key.name==='up'||key.name==='down'){const delta=key.name==='up'?-1:1;if(key.alt&&prompter?.moveQueued(queueIndex,delta))queueIndex+=delta;else if(!key.alt)queueIndex=Math.max(0,Math.min(count-1,queueIndex+delta));return;}
   if(key.name==='delete'||key.name==='backspace'){prompter?.removeQueued(queueIndex);queueIndex=Math.max(0,Math.min((prompter?.queued?.().length||1)-1,queueIndex));return;}
   if(!(key.ctrl&&key.name==='c'))return;queueFocus=false;
  }
  if(key.ctrl&&key.name==='p'){panel='modules';search.clear();panelIndex=0;return;}
  if(key.ctrl&&key.name==='t'){todoExpanded=!todoExpanded;todoOffset=0;return;}
  if(key.ctrl&&key.name==='o'){view=view==='activity'?'conversation':'activity';return;}
  if(key.ctrl&&key.name==='s'){void steer();return;}
  if(todoExpanded&&key.alt&&['up','down'].includes(key.name)){todoOffset+=key.name==='up'?-1:1;return;}
  if(key.ctrl&&key.name==='l'){screen.invalidate();return;}
  if(key.name==='pageup'){scroll+=Math.max(1,(stdout.rows||24)-8);return;}
  if(key.name==='pagedown'){scroll=Math.max(0,scroll-Math.max(1,(stdout.rows||24)-8));return;}
  if(key.name==='escape'||key.ctrl&&key.name==='c'){
   if(question&&!question.chat){prompter.answer(null,question.id);question=null;answer.clear();return;}
   if(activeCommand){activeCommand.controller.abort();void Promise.resolve(activeCommand.cancel?.()).catch(error=>note(error.code||'CANCEL_PENDING'));status='cancelling';return;}
   if(busy){void prompter.submit('/stop');return;}
   if(key.name==='escape')return;
   if(!draft.empty){draft.clear();return;}
   status='ready';return;
  }
  if(key.ctrl&&key.name==='d'&&draft.empty){void finish(0);return;}
  if(key.name==='enter'){void send().catch(error=>note(error.code||error.message));return;}
  edit(question&&!question.chat?answer:draft,key);
 }
 function onData(chunk){try{clearTimeout(escapeTimer);for(const key of keys.feed(chunk))handle(key);if(keys.waiting)escapeTimer=setTimeout(()=>{for(const key of keys.flush())handle(key);schedule();},30);schedule();}catch(error){note(error.code||error.message);}}
 function onResize(){if(!suspended){screen.invalidate();schedule();}}
 const onStop=()=>{abort?.abort();activeCommand?.controller.abort();void Promise.resolve(activeCommand?.cancel?.()).catch(()=>{});void finish(130);};
 const onInterrupt=()=>{if(!suspended){handle({ctrl:true,name:'c'});schedule();}};
 async function finish(code,{stop=true}={}){
  if(closing)return;closing=true;status='closing';
  if(stop){activeCommand?.controller.abort();void Promise.resolve(activeCommand?.cancel?.()).catch(()=>{});abort?.abort();prompter?.close();}
  // Backend cleanup remains owned by CLI. Restore the terminal immediately;
  // await its normal completion before returning to the supervisor.
  closed=true;gitAbort.abort();clearInterval(statusTimer);clearInterval(motionTimer);clearTimeout(paintTimer);clearTimeout(escapeTimer);stdin.off('data',onData);stdout.off('resize',onResize);io.stopSignal?.removeEventListener('abort',onStop);process.off('SIGINT',onInterrupt);
  stdin.setRawMode?.(false);stdin.pause();screen.leave();
  if(stop&&backend)try{await backend;}catch{}
  resolveDone(code);
 }
 io.stopSignal?.addEventListener('abort',onStop,{once:true});process.on('SIGINT',onInterrupt);
 stdin.setRawMode?.(true);stdin.on('data',onData);stdin.resume();stdout.on('resize',onResize);screen.enter();paint();
 statusTimer=setInterval(schedule,1000);statusTimer.unref?.();
 if(!env.CI&&env.KODER_REDUCED_MOTION!=='1'){motionTimer=setInterval(schedule,160);motionTimer.unref?.();}
 if(io.stopSignal?.aborted)void finish(130);else {void launch(argv.length?argv:['chat']);if(!io.resume?.input?.tuiKeys&&io.resume?.input?.pendingBytes)onData(Buffer.from(io.resume.input.pendingBytes,'base64'));if(io.resume?.input?.rawBytes)onData(Buffer.from(io.resume.input.rawBytes,'base64'));}
 return done;
}
