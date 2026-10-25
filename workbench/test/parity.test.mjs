import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import {runWorkbench} from '../src/workbench.mjs';
import {fakeTerminal,until} from './vt.mjs';
const env=()=>({CI:'1',KODER_CLI_HOME:path.join(os.tmpdir(),'tui-parity-'+crypto.randomUUID())});
test('Ctrl+T expands session Todo separately from the queue and Ctrl+S steers a running turn',async()=>{
 const term=fakeTerminal({cols:130,rows:36});let input,release,steered;
 const runCli=async(_args,io)=>{input=io.prompter;io.onUiContext?.({lang:'en',mode:'standard',model:null});
  await input.ask('koder › ');io.onUiTask?.({state:'running',text:'current goal'});io.onUiTodo?.({items:Array.from({length:6},(_,i)=>({id:String(i),title:'Step '+i,status:i===0?'completed':'pending'}))});
  input.setBusy({submit:async()=>false,steer:async text=>{steered=text;return {accepted:true,reason:'STEER_ACCEPTED'};}});
  await new Promise(r=>release=r);input.setBusy(null);for(;;){const line=await input.ask('koder › ');if(line==='/exit'||line==null)return 0;}
 };
 const done=runWorkbench(['chat'],{env:env(),stdin:term.stdin,stdout:term.stdout,stderr:term.stdout},{runCli,VERSION:'0.4.12'});
 await until(()=>term.vt.text().includes('ready'),'ready');assert.match(term.vt.text(),/Model: not set/);
 term.type('begin\r');await until(()=>release,'running');term.type('later\x1bq');term.type('keep this draft');
 await until(()=>term.vt.text().includes('Todo 1/6'),'Todo summary');assert.doesNotMatch(term.vt.text(),/Step 5/);
 term.type('\x14');await until(()=>term.vt.text().includes('Step 5'),'expanded Todo');assert.match(term.vt.text(),/later/);assert.match(term.vt.text(),/keep this draft/);
 term.type('\x13');await until(()=>steered==='keep this draft','actual steer callback');assert.deepEqual(input.queued(),['later']);
 release();await until(()=>term.vt.text().includes('ready'),'idle');term.type('/exit\r');assert.equal(await done,0);
});
test('repeated idle Ctrl+C and Escape keep the workbench alive; /help opens a searchable panel',async()=>{
 const term=fakeTerminal();let ended=false;
 const runCli=async(_args,io)=>{io.onUiContext?.({lang:'en'});for(;;){const text=await io.prompter.ask('koder › ');if(text==='/exit'||text==null)return 0;}};
 const done=runWorkbench(['chat'],{env:env(),stdin:term.stdin,stdout:term.stdout,stderr:term.stdout},{runCli,VERSION:'0.4.12'}).then(code=>{ended=true;return code;});
 await until(()=>term.vt.text().includes('ready'),'ready');term.type('\x03\x03');await new Promise(r=>setTimeout(r,50));assert.equal(ended,false);
 term.type('/help\r');await until(()=>term.vt.text().includes('Slash commands'),'help panel');term.type('mode');await until(()=>term.vt.text().includes('/mode'),'chat shortcut is searchable');
 term.type('\x1b');await new Promise(r=>setTimeout(r,50));term.type('/exit\r');assert.equal(await done,0);
});
