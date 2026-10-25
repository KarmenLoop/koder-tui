import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PassThrough} from 'node:stream';
import {createContext} from '../../koder-cli/src/cli.mjs';
import {createSession} from '../../koder-cli/src/session.mjs';
import {tmp,capture,scripted,textStep} from '../../koder-cli/test/helpers.mjs';
test('a session cancelled at construction handoff closes before any model turn',async t=>{
 const home=tmp('koder-tui-cancel-'),controller=new AbortController(),provider=scripted([textStep('must not run')]);
 t.after(()=>fs.rmSync(home,{recursive:true,force:true}));
 let closed=0,created;
 const ctx=createContext({command:'run',argv:[],opts:{memory:false},positionals:[],io:{
  env:{KODER_CLI_HOME:home,NO_COLOR:'1'},cwd:home,stdin:new PassThrough(),stdout:capture().stream,stderr:capture().stream,
  providerOverride:provider,tui:true,stopSignal:controller.signal,noTerminal:true,
  onSession:session=>{created=session;const close=session.close.bind(session);session.close=async()=>{closed++;await close();};controller.abort();}
 }});
 await assert.rejects(async()=>{const session=await createSession(ctx,{memory:false});await session.turn('must not start');},{name:'AbortError'});
 assert.ok(created);assert.equal(closed,1);assert.equal(provider.calls.length,0);
});
