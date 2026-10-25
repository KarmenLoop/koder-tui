import test from 'node:test';
import assert from 'node:assert/strict';
import {Writable,PassThrough} from 'node:stream';
import * as cli from '../../koder-cli/src/cli.mjs';
const out=new Writable({write(_c,_e,cb){cb();}});
test('CLI exposes optional embedding hooks and keeps dispatch overrides',async()=>{
 assert.equal(cli.TUI_EMBEDDING_API,2);
 const env={KODER_CLI_HOME:process.cwd()+'/test-missing-profile'};
 const ctx=cli.createContext({command:'help',argv:[],opts:{},positionals:[],io:{cwd:process.cwd(),env,stdin:new PassThrough(),stdout:out,stderr:out,dispatchLocal:async(argv,io,run)=>{assert.deepEqual(argv,['version']);assert.equal(io.previewSession,true);assert.equal(typeof run,'function');return 41;}}});
 assert.equal(await ctx.dispatch(['version'],{previewSession:true}),41);
});
