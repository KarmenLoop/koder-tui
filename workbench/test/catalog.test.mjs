import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {catalog,slashCatalog,parseWords,parseLocal,searchCatalog} from '../src/catalog.mjs';
const source=fs.readFileSync(new URL('../../koder-cli/src/cli.mjs',import.meta.url),'utf8');
const routes=[...source.split('const LOADERS = {')[1].split('\n};')[0].matchAll(/^\s+(\w+):/gm)].map(x=>x[1]);
test('every actual CLI route appears in the directory, without duplicates',()=>{assert.equal(routes.length,58);assert.deepEqual(catalog.map(x=>x.name).sort(),routes.sort());assert.equal(new Set(catalog.map(x=>x.name)).size,58);});
test('quoted arguments preserve Windows paths and shell symbols literally',()=>{assert.deepEqual(parseWords('github commit "owner/repo" "C:\\Users\\Project Name\\file.txt" --title "$(touch x); hi"'),['github','commit','owner/repo','C:\\Users\\Project Name\\file.txt','--title','$(touch x); hi']);assert.deepEqual(parseWords("run '' --mode code"),['run','','--mode','code']);assert.throws(()=>parseWords('model "unfinished'),/QUOTE/);});
test('registered aliases are local; absolute paths and unknown text stay tasks',()=>{assert.equal(parseLocal('/迁移 status').argv[0],'migrate');assert.equal(parseLocal('koder github repos').argv[0],'github');assert.equal(parseLocal('/Users/me/app.js explain'),null);assert.equal(parseLocal('please review code'),null);});
test('directory searches localized descriptions and exact command names',()=>{assert.ok(searchCatalog('迁移','zh').some(x=>x.name==='migrate'));assert.ok(searchCatalog('github','en').some(x=>x.name==='github'));assert.ok(searchCatalog('课堂','zh').some(x=>x.name==='learn')||searchCatalog('教程','zh').some(x=>x.name==='learn'));});

test('help covers all dispatcher routes and actual chat shortcuts without changing /skill semantics',()=>{assert.ok(catalog.every(x=>slashCatalog.some(s=>s.name===x.name)));for(const name of ['todo','undo','reload-tui','statusline','mode'])assert.ok(slashCatalog.some(x=>x.name===name));assert.equal(new Set(slashCatalog.map(x=>x.name)).size,slashCatalog.length);assert.equal(parseLocal('/skill writing').argv[0],'skill');});
