import test from 'node:test';
import assert from 'node:assert/strict';
import {createUiPrompter} from '../src/prompter.mjs';
test('queued task text cannot answer a fresh approval',async()=>{let question;const p=createUiPrompter({onQuestion:q=>question=q});assert.equal(typeof p.enqueue,'function');p.enqueue('yes');const approval=p.ask('Allow?',{fresh:true});assert.equal(question.fresh,true);assert.equal(p.answer('y',question.id-1),false);p.answer('n',question.id);assert.equal(await approval,'n');assert.equal(await p.ask('koder › '),'yes');p.close();});
test('busy input uses CLI steering and preserves unaccepted task order',async()=>{const p=createUiPrompter();assert.equal(typeof p.setBusy,'function');const got=[];p.setBusy({submit:async t=>{got.push(t);return t==='steer';}});await p.submit('steer');await p.submit('next');assert.deepEqual(got,['steer','next']);p.setBusy(null);assert.equal(await p.ask('koder › '),'next');p.close();});
test('close releases pending prompts and rejects late answers',async()=>{let question;const p=createUiPrompter({onQuestion:q=>question=q});assert.equal(typeof p.ask,'function');const read=p.ask('token',{secret:true,fresh:true});p.close();assert.equal(await read,null);assert.equal(p.answer('late',question.id),false);assert.deepEqual(p.snapshot().queue,[]);});
test('suspension restores ownership even if the protected operation throws',async()=>{const states=[];const p=createUiPrompter({suspend:async fn=>{states.push('leave');try{return await fn();}finally{states.push('enter');}}});assert.equal(typeof p.withInputSuspended,'function');await assert.rejects(p.withInputSuspended(async()=>{throw Error('expected');}),/expected/);assert.deepEqual(states,['leave','enter']);p.close();});
test('resume restores queued tasks and tracks unresolved input admission',async()=>{
 let release;const p=createUiPrompter({initial:{queue:['saved']}});
 assert.deepEqual(p.snapshot().queue,['saved']);assert.equal(await p.ask('koder › '),'saved');
 p.setBusy({submit:()=>new Promise(r=>release=r)});const waiting=p.submit('late');
 await new Promise(r=>setImmediate(r));assert.equal(p.snapshot().pendingSubmissions,1);
 p.close();release(false);await waiting;assert.deepEqual(p.snapshot().queue,[]);
});
test('colored CLI chat prompt stays the ordinary task input',async()=>{let q;const p=createUiPrompter({onQuestion:value=>q=value});const pending=p.ask('\x1b[38;2;124;166;255mkoder\x1b[0m › ');assert.equal(q.chat,true);await p.submit('task');assert.equal(await pending,'task');p.close();});
test('an interrupt reaches CLI immediately while steering receipt is pending',async()=>{const calls=[];let release;const p=createUiPrompter();p.setBusy({submit:text=>{calls.push(text);return text==='/stop'?Promise.resolve(true):new Promise(r=>release=r);}});const first=p.submit('steer');await new Promise(r=>setImmediate(r));const stop=p.submit('/stop');await new Promise(r=>setImmediate(r));assert.deepEqual(calls,['steer','/stop']);release(true);await first;await stop;p.close();});
test('queued TODO items reorder and delete without touching a fresh approval',async()=>{let q;const p=createUiPrompter({onQuestion:x=>q=x});p.enqueue('first');p.enqueue('second');p.enqueue('third');assert.equal(typeof p.moveQueued,'function');assert.equal(p.moveQueued(2,-1),true);assert.deepEqual(p.snapshot().queue,['first','third','second']);const approval=p.ask('Confirm?',{fresh:true});assert.equal(p.removeQueued(0),true);assert.deepEqual(p.snapshot().queue,['third','second']);p.answer('n',q.id);assert.equal(await approval,'n');assert.equal(await p.ask('koder › '),'third');p.close();});
test('explicit enqueue preserves order behind a pending steering receipt',async()=>{
 let release;const p=createUiPrompter();p.setBusy({submit:()=>new Promise(r=>release=r)});
 const first=p.submit('first'),second=p.enqueue('second');
 release(false);await first;await second;
 assert.deepEqual(p.queued(),['first','second']);
 p.setBusy(null);assert.equal(await p.ask('koder › '),'first');assert.equal(await p.ask('koder › '),'second');p.close();
});
test('closing while chat awaits an input receipt cannot reopen the prompt',async()=>{
 let release;const p=createUiPrompter();p.setBusy({submit:()=>new Promise(r=>release=r)});
 const submission=p.submit('late');const read=p.ask('koder › ');
 p.close();release(false);await submission;await new Promise(r=>setImmediate(r));
 assert.equal(p.pending,null);assert.equal(await read,null);
});
test('explicit steer uses a receipt and cannot answer a fresh question',async()=>{
 let received;const p=createUiPrompter();p.setBusy({submit:async()=>false,steer:async text=>{received=text;return {accepted:true,reason:'STEER_ACCEPTED'};}});
 assert.equal(typeof p.steer,'function');
 assert.equal((await p.steer('new constraint')).accepted,true);assert.equal(received,'new constraint');assert.deepEqual(p.queued(),[]);
 const read=p.ask('Approve?',{fresh:true});const q=p.pending;
 assert.equal((await p.steer('yes')).accepted,false);assert.equal(p.pending.id,q.id);p.answer('n',q.id);assert.equal(await read,'n');p.close();
});
