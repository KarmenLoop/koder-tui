import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {supervise} from '../../koder-cli/src/process-lifecycle.mjs';

test('UI supervisor maps verified runtime replacement and keeps resume data',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'koder-ui-supervisor-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const entry=path.join(dir,'worker.mjs');
 fs.writeFileSync(entry,`process.on('message',m=>{if(m.type==='koder:boot'){process.send({type:'koder:ready',protocol:1});if(process.env.TUI_TEST_GENERATION==='new'){if(m.resume?.input?.draft!=='saved draft')process.exitCode=4;process.disconnect();}else process.send({type:'koder:restart',protocol:1,target:{entry:'new-runtime',version:'0.4.13'},resume:{argv:['chat'],input:{draft:'saved draft'}}});}else if(m.type==='koder:accepted'){process.exitCode=75;process.disconnect();}});process.send({type:'koder:hello',protocol:1});`);
 let mapped=0;
 const code=await supervise(entry,['chat'],{env:{...process.env,TUI_TEST_GENERATION:'old'},mapReplacement:(target,env)=>{mapped++;assert.equal(target.version,'0.4.13');return {entry,env:{...env,TUI_TEST_GENERATION:'new'}};}});
 assert.equal(code,0);assert.equal(mapped,1);
});
