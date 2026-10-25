import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';

const expected='fa93cf1ce4834f04b899529a8a676ebee18d99725afad9c8d614940ba3351092';
const actual=crypto.createHash('sha256').update(fs.readFileSync('EULA.md')).digest('hex');
if(actual!==expected)throw Error('The agreement differs from the verified Koder CLI Koder-EULA-1.1 text. Review the upstream agreement before changing this pin.');
const tracked=execFileSync('git',['ls-files','-z'],{encoding:'utf8'}).split('\0').filter(Boolean);
const forbidden=tracked.filter(name=>/^(?:workbench|test-runtime-support|private-source|src|bin|kernel|vendor|packages)\//.test(name));
if(forbidden.length)throw Error('Proprietary development paths are not allowed in this public branch: '+forbidden.join(', '));
for(const name of ['LICENSE','SOURCE-STATUS.md','THIRD_PARTY_NOTICES.md','licenses/legacy-cli/GPL-3.0.txt'])if(!tracked.includes(name))throw Error('Required licensing notice missing: '+name);
console.log('Public repository scope and unchanged CLI agreement verified.');
