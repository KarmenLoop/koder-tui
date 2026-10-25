import test from 'node:test';
import assert from 'node:assert/strict';
import {statusSettings,renderStatus,tipAt,STATUS_FIELDS} from '../src/status.mjs';
test('unconfigured status retains the Model slot and unknown context',()=>{
 const text=renderStatus({context:{mode:'standard'},width:100,lang:'en'});
 assert.match(text,/Model: not set/);assert.match(text,/Context: —%/);
});
test('status config validates every field and context is based on actual usage',()=>{
 assert.deepEqual(STATUS_FIELDS,['mode','goal','model','tasks','cwd','git','tips']);
 assert.equal(statusSettings({tui:{statusLine:{git:true,goal:true}}}).git,true);
 assert.throws(()=>statusSettings({tui:{statusLine:{git:'yes'}}}),/STATUSLINE/);
 const text=renderStatus({context:{mode:'code',model:'fixture',usage:{estimated:2000,window:8000}},width:100,lang:'en'});
 assert.match(text,/Context: 25%/);assert.match(text,/Model: fixture/);
});
test('tips rotate and narrow output keeps model and context readable',()=>{
 assert.notEqual(tipAt(0,'en'),tipAt(6000,'en'));
 const text=renderStatus({context:{model:null},width:40,lang:'en'});
 assert.match(text,/Model: not set/);assert.match(text,/—%/);assert.ok(text.length<=40);
});

test('shared CLI status item config and hidden footer remain compatible',()=>{const settings=statusSettings({tui:{statusLine:{enabled:false,items:['model','cwd','git','context']}}});assert.equal(settings.cwd,true);assert.equal(settings.git,true);assert.equal(settings.mode,false);assert.equal(renderStatus({settings}), '');});

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {readGitStatus} from '../src/status.mjs';
test('optional Git field observes an owned branch and tracked modifications',async t=>{
 const cwd=fs.mkdtempSync(path.join(os.tmpdir(),'tui-git-'));t.after(()=>fs.rmSync(cwd,{recursive:true,force:true}));
 const run=(...args)=>execFileSync('git',args,{cwd,stdio:'pipe'});
 run('init','-q','-b','workbench');fs.writeFileSync(path.join(cwd,'a.txt'),'one');run('add','a.txt');
 run('-c','user.name=Fixture','-c','user.email=fixture@example.invalid','-c','commit.gpgsign=false','commit','-qm','fixture');
 assert.equal(await readGitStatus(cwd),'workbench');fs.writeFileSync(path.join(cwd,'a.txt'),'two');assert.equal(await readGitStatus(cwd),'workbench *');
});
