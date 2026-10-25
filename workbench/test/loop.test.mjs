import test from 'node:test';
import assert from 'node:assert/strict';
import {loopFrame} from '../src/loop.mjs';
test('the reference loop keeps a transparent exterior and hole while highlights animate',()=>{const a=loopFrame(30,14,0),b=loopFrame(30,14,2);assert.equal(a.length,14);assert.equal(a[0][0].text,' ');assert.equal(a[7][15].text,' ');assert.ok(a.flat().some(x=>x.text!==' '));assert.notDeepEqual(a,b);});
