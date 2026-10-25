import test from 'node:test';
import assert from 'node:assert/strict';
import {createOutputBuffer} from '../src/output.mjs';
test('split OSC and CSI sequences cannot enter transcript or clipboard',()=>{const b=createOutputBuffer(128);b.append('hello\x1b]52;c;secret');b.append('\x07 world\x1b[');b.append('2J!');assert.equal(b.text,'hello world!');b.append('x'.repeat(500));assert.ok(b.text.length<=128);});
