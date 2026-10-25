import test from 'node:test';
import assert from 'node:assert/strict';
import {createKeyParser} from '../src/keys.mjs';
test('update snapshots preserve incomplete UTF-8 and an unfinished paste',()=>{const first=createKeyParser();first.feed(Buffer.from([0xe4,0xb8]));assert.equal(typeof first.snapshot,'function');const next=createKeyParser(first.snapshot());assert.deepEqual(next.feed(Buffer.from([0xad])),[{name:'text',text:'中'}]);first.feed('\x1b[200~draft\n');const resumed=createKeyParser(first.snapshot());assert.deepEqual(resumed.feed('\x1b[201~'),[{name:'paste',text:'draft\n'}]);});
