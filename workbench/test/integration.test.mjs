import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fakeTerminal,until} from './vt.mjs';
import {runWorkbench} from '../src/workbench.mjs';
import {writeAcceptance} from '../../koder-cli/src/eula.mjs';

test('actual CLI commands, project switching, mode and lesson 180 run in the workbench',async t=>{
 const home=fs.mkdtempSync(path.join(os.tmpdir(),'koder-workbench-'));
 t.after(()=>fs.rmSync(home,{recursive:true,force:true}));
 const env={HOME:home,KODER_CLI_HOME:path.join(home,'profile'),CI:'1',NO_COLOR:'1',KODER_AUTO_UPDATE:'0',TERM:'xterm-256color'};
 writeAcceptance(env);const term=fakeTerminal({cols:150,rows:42});
 const done=runWorkbench(['chat','--lang','en','--no-memory'],{env,cwd:home,stdin:term.stdin,stdout:term.stdout,stderr:term.stdout});
 await until(()=>term.vt.text().includes('ready'),'CLI prompt');
 term.type('/version\r');await until(()=>term.vt.text().includes('version · exit 0'),'version result');
 term.type('/mode code\r');await until(()=>term.vt.text().includes('koder · code')&&term.vt.text().includes('default'),'mode retained');
 term.type('/project create Workbench-Synthetic\r');
 await until(()=>fs.existsSync(path.join(home,'Koder Projects/Workbench-Synthetic/.koder/project.json')),'actual project created');
 await until(()=>term.vt.text().includes('ready'),'project prompt');
 term.type('/learn 180 --print\r');await until(()=>term.vt.text().includes('learn · exit 0'),'lesson 180 printed',15000);
 term.type('/exit\r');assert.equal(await done,0);assert.equal(term.raw.at(-1),false);
 assert.ok(!term.vt.modes.has('1049'));
});
