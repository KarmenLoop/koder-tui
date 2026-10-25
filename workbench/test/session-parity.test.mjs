import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fakeTerminal,until} from './vt.mjs';
import {runWorkbench} from '../src/workbench.mjs';
import {writeAcceptance} from '../../koder-cli/src/eula.mjs';
import {saveConfig,loadConfig} from '../../koder-cli/src/config.mjs';
import {createMemory} from '../../koder-cli/src/memory.mjs';
import {toolStep,textStep} from '../../koder-cli/test/helpers.mjs';

test('actual workbench streams Todo, steers with Ctrl+S in queue mode, and undoes the same session',async t=>{
 const home=fs.mkdtempSync(path.join(os.tmpdir(),'tui-session-'));let done,release,session,requests=0;
 const env={KODER_CLI_HOME:home,HOME:home,CI:'1',NO_COLOR:'1',KODER_AUTO_UPDATE:'0',TERM:'xterm-256color'};
 const term=fakeTerminal({cols:130,rows:36}),items=Array.from({length:8},(_,i)=>({id:'step'+i,title:'Actual step '+i,status:i===0?'in_progress':'pending'}));
 t.after(async()=>{release?.();session?.cancel();term.type('\x04');await done;fs.rmSync(home,{recursive:true,force:true});});
 writeAcceptance(env);saveConfig({sessionInputMode:'queue',tui:{todoExpanded:false},fixturePreserved:true},env);
 const provider={model:'scripted-workbench',contextWindow:64000,async complete(req){
  if(++requests===1)return toolStep('todo_set',{items});
  if(requests===2){req.onDelta?.('Streaming owned output');await new Promise(r=>release=r);return textStep('First answer');}
  if(requests===3){assert.ok(req.messages.some(m=>m.role==='user'&&m.content==='Use concise details'));return toolStep('todo_set',{items:items.map(x=>({...x,status:'completed'}))});}
  return textStep('Owned result complete');
 }};
 done=runWorkbench(['chat','--lang','en'],{env,cwd:home,stdin:term.stdin,stdout:term.stdout,stderr:term.stdout,providerOverride:provider,onSession:s=>session=s});
 await until(()=>term.vt.text().includes('ready'),'ready');term.type('Discuss the checklist\r');
 await until(()=>release&&term.vt.text().includes('Todo 0/8'),'actual Todo before model completes',10000);
 term.type('Use concise details');await until(()=>term.vt.text().includes('Use concise details'),'streaming draft');
 term.type('\x14');await until(()=>term.vt.text().includes('Actual step 5'),'expanded checklist');
 term.type('\x1b[1;3B\x1b[1;3B');await until(()=>term.vt.text().includes('Actual step 7'),'long list scroll');
 term.type('\x13');await until(()=>session.thread.steering?.length===1,'same-engine steering receipt');release();
 await until(()=>term.vt.text().includes('Todo 8/8')&&term.vt.text().includes('ready'),'turn settles',10000);
 assert.equal(session.thread.messages.filter(m=>m.steer).length,1);assert.match(term.vt.text(),/Model: scripted-workbench/);assert.match(term.vt.text(),/Context: \d+%/);
 term.type('/undo\r');await until(()=>!session.thread.todo?.items?.length,'same-session undo');
 assert.equal(session.thread.messages.length,0);assert.ok(createMemory({workspace:home,env}).read().conversation.undoAudit.length);
 term.type('/statusline git on\r');await until(()=>loadConfig(env).tui?.statusLine?.git===true,'persisted footer config');assert.equal(loadConfig(env).fixturePreserved,true);assert.equal(loadConfig(env).tui.todoExpanded,false);
 term.type('\x03\x03');await new Promise(r=>setTimeout(r,50));term.type('/exit\r');assert.equal(await done,0);
});

test('40 by 12 keeps the composer and model slot visible during Todo and a fresh approval',async t=>{
 const term=fakeTerminal({cols:40,rows:12}),home=fs.mkdtempSync(path.join(os.tmpdir(),'tui-small-'));let done,approve;
 t.after(async()=>{term.type('\x1b');await new Promise(r=>setTimeout(r,40));term.type('\x04');await done;fs.rmSync(home,{recursive:true,force:true});});
 done=runWorkbench(['chat'],{env:{CI:'1',KODER_CLI_HOME:home},stdin:term.stdin,stdout:term.stdout,stderr:term.stdout},{VERSION:'fixture',async runCli(_args,io){
  io.onUiContext({lang:'en'});await io.prompter.ask('koder › ');io.onUiTodo({items:Array.from({length:64},(_,i)=>({id:''+i,title:'Step '+i,status:'pending'}))});io.prompter.setBusy({submit:()=>true});approve=io.prompter.ask('Approve this synthetic operation with a long title?',{fresh:true});await approve;io.prompter.setBusy(null);for(;;){const text=await io.prompter.ask('koder › ');if(text==null||text==='/exit')return 0;}
 }});
 await until(()=>term.vt.text().includes('ready'),'ready');term.type('begin\r');await until(()=>approve,'approval');term.type('\x14');
 await until(()=>term.vt.text().includes('Task / CLI command'),'small composer');assert.match(term.vt.text(),/Model: not set/);assert.match(term.vt.text(),/Context: —%/);assert.equal(term.vt.text().split('\n').length,12);
});
