import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
const testEnv=()=>({CI:'1',KODER_CLI_HOME:path.join(os.tmpdir(),'koder-tui-profile-'+crypto.randomUUID())});
import test from 'node:test';
import assert from 'node:assert/strict';
import {fakeTerminal,until} from './vt.mjs';
import {runWorkbench} from '../src/workbench.mjs';

test('module search stages an editable command and restores a previous draft on Escape',async()=>{
 const term=fakeTerminal(),seen=[];
 const runCli=async(_argv,io)=>{io.onUiContext?.({lang:'en',workspace:process.cwd(),mode:'standard',engine:'koder'});for(;;){const input=await io.prompter.ask('koder › ');if(input==null||input==='/exit')return 0;seen.push(input);}};
 const done=runWorkbench(['chat'],{stdin:term.stdin,stdout:term.stdout,stderr:term.stdout,env:testEnv(),cwd:process.cwd()},{runCli,VERSION:'0.4.12'});
 await until(()=>term.vt.text().includes('WORKBENCH'),'workbench frame');
 term.type('draft');term.type('\x10');term.type('github');
 await until(()=>term.vt.text().includes('github'),'module search');
 term.type('\x1b');await new Promise(r=>setTimeout(r,60));
 assert.match(term.vt.text(),/draft/);
 term.type('\x15');term.type('\x10');term.type('migrate');term.type('\r');
 await until(()=>term.vt.text().includes('/migrate'),'staged command');
 assert.equal(seen.length,0,'selection alone cannot execute the module');
 term.type('\x15');term.type('/exit\r');
 assert.equal(await done,0);assert.equal(term.raw.at(-1),false);assert.ok(!term.vt.modes.has('1049'));
});

test('Escape cancels an owned module without ending the chat',async()=>{
 const term=fakeTerminal();let cancelled=false;
 const runCli=async(_args,io)=>{for(;;){const line=await io.prompter.ask('koder › ');if(line==='/exit'||line==null)return 0;if(line==='/review')await io.dispatchLocal(['review'],io,async(_argv,commandIo)=>{await new Promise(resolve=>{commandIo.stopSignal?.addEventListener('abort',()=>{cancelled=true;resolve();},{once:true});});return 130;});}};
 const done=runWorkbench(['chat'],{stdin:term.stdin,stdout:term.stdout,stderr:term.stdout,env:testEnv(),cwd:process.cwd()},{runCli,VERSION:'0.4.12'});
 await until(()=>term.vt.text().includes('ready'),'prompt');term.type('/review\r');await until(()=>term.vt.text().includes('running'),'module started');
 term.type('\x1b');await until(()=>cancelled,'owned module cancelled');term.type('/exit\r');assert.equal(await done,0);
});

test('owner shutdown reaches a native module and restores the terminal',async()=>{
 const term=fakeTerminal(),shutdown=new AbortController();let stopped=false;
 const runCli=async(_args,io)=>{const text=await io.prompter.ask('koder › ');if(text)await io.dispatchLocal(['gateway','run'],io,async(_argv,nativeIo)=>{await new Promise(resolve=>nativeIo.stopSignal.addEventListener('abort',()=>{stopped=true;resolve();},{once:true}));return 130;});return 0;};
 const done=runWorkbench(['chat'],{stdin:term.stdin,stdout:term.stdout,stderr:term.stdout,stopSignal:shutdown.signal,env:testEnv()},{runCli,VERSION:'0.4.12'});
 await until(()=>term.vt.text().includes('ready'),'prompt');term.type('/gateway run\r');await until(()=>term.raw.at(-1)===false,'native input owner');shutdown.abort();assert.equal(await done,130);assert.equal(stopped,true);assert.equal(term.raw.at(-1),false);
});

test('native protected input has a real output stream and never enters transcript',async()=>{
 const term=fakeTerminal();let received;
 const runCli=async(_args,io)=>{for(;;){const text=await io.prompter.ask('koder › ');if(text==null||text==='/exit')return 0;await io.dispatchLocal(['migrate'],io,async(_argv,nativeIo)=>{received=await nativeIo.promptSecret('Protected fixture: ');return 0;});}};
 const done=runWorkbench(['chat'],{stdin:term.stdin,stdout:term.stdout,stderr:term.stdout,env:testEnv()},{runCli,VERSION:'0.4.12'});
 await until(()=>term.vt.text().includes('ready'),'prompt');term.type('/migrate\r');await until(()=>term.vt.log.includes('Protected fixture:'),'secret prompt');term.type('fixture-secret\r');await until(()=>received==='fixture-secret','protected read');
 await until(()=>term.raw.at(-1)===true,'workbench returned');assert.ok(!term.vt.log.includes('fixture-secret'));term.type('/exit\r');assert.equal(await done,0);
});


test('an embedding runtime failure before CLI readiness preserves supervisor fallback',async()=>{const term=fakeTerminal();let ready=0;const code=await runWorkbench(['chat'],{stdin:term.stdin,stdout:term.stdout,stderr:term.stdout,env:testEnv(),onReady:async()=>ready++},{VERSION:'bad-candidate',runCli:async()=>{throw Error('STARTUP_FIXTURE');}});assert.equal(code,1);assert.equal(ready,0);assert.equal(term.raw.at(-1),false);});

test('composer and queue remain visible through fresh answers and queue reordering',async()=>{
 const term=fakeTerminal({cols:130,rows:36});let backendPrompt,requestAnswer,asked=false;
 const runCli=async(_args,io)=>{backendPrompt=io.prompter;io.onReady?.();await io.prompter.ask('koder › ');io.prompter.setBusy({submit:async()=>false});io.onUiTask?.({state:'running',text:'owned task'});await new Promise(r=>requestAnswer=r);const answer=await io.prompter.ask('Approve fixture?',{fresh:true});asked=answer===null;io.prompter.setBusy(null);for(;;){const text=await io.prompter.ask('koder › ');if(text==='/exit'||text==null)return 0;}};
 const done=runWorkbench(['chat'],{stdin:term.stdin,stdout:term.stdout,stderr:term.stdout,env:testEnv()},{runCli,VERSION:'0.4.12'});
 await until(()=>term.vt.text().includes('ready'),'ready');term.type('start\r');await until(()=>requestAnswer,'running');
 term.type('first\x1bq');term.type('second\x1bq');term.type('main draft');requestAnswer();
 await until(()=>term.vt.text().includes('Approve fixture?'),'approval appears');
 assert.match(term.vt.text(),/main draft/);assert.match(term.vt.text(),/任务队列|Task queue/);assert.match(term.vt.text(),/first/);assert.match(term.vt.text(),/second/);
 term.type('\x11');term.type('\x1b[1;3B');await until(()=>backendPrompt.snapshot().queue[0]==='second','reordered actual FIFO');
 term.type('\x1b');await new Promise(r=>setTimeout(r,50));term.type('\x1b');await until(()=>asked,'approval cancelled separately');
 term.type('\x15/exit\r');assert.equal(await done,0);
});

test('both queue entry points normalize commands while preserving task paths',async()=>{
 const term=fakeTerminal();let prompter,release;
 const runCli=async(_args,io)=>{prompter=io.prompter;await io.prompter.ask('koder › ');io.prompter.setBusy({submit:async()=>false});await new Promise(r=>release=r);return 0;};
 const done=runWorkbench(['chat'],{stdin:term.stdin,stdout:term.stdout,stderr:term.stdout,env:testEnv()},{runCli,VERSION:'0.4.12'});
 await until(()=>term.vt.text().includes('ready'),'ready');term.type('hold\r');await until(()=>release,'held task');
 term.type('koder ci --help\x1bq');term.type('/queue koder github repos\r');term.type('/Users/me/app.js explain\x1bq');
 await until(()=>prompter.queued().length===3,'queued entries');
 assert.deepEqual(prompter.queued(),['/ci --help','/github repos','/Users/me/app.js explain']);
 release();assert.equal(await done,0);
});
