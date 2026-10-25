// Black-box input smoke check against the installed runtime; no provider or account calls.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {PassThrough,Writable} from 'node:stream';
import {performance} from 'node:perf_hooks';
const {runWorkbench}=await import(pathToFileURL(path.resolve(process.argv[2],'packages/koder-tui/src/workbench.mjs')));
const home=fs.mkdtempSync(path.join(os.tmpdir(),'tui-input-smoke-')),stop=new AbortController();
let output='',runtimeIo;
const stdout=new Writable({write(chunk,_encoding,callback){output+=chunk.toString();callback();}});
Object.assign(stdout,{isTTY:true,columns:130,rows:36});
const stdin=new PassThrough();Object.assign(stdin,{isTTY:true,setRawMode(){return this;}});
const done=runWorkbench(['chat','--lang','en'],{stdin,stdout,stderr:stdout,stopSignal:stop.signal,cwd:home,env:{CI:'1',KODER_CLI_HOME:home,KODER_AUTO_UPDATE:'0'}},{VERSION:'release-check',async runCli(_args,io){runtimeIo=io;for(;;){if(await io.prompter.ask('koder › ')==null)return 0;}}});
async function waitFor(text){const until=Date.now()+3000;while(!output.includes(text)){if(Date.now()>until)throw Error('Input did not render: '+text);await new Promise(r=>setTimeout(r,2));}}
try{
 await waitFor('ready');stdin.write('\x11');await new Promise(r=>setTimeout(r,25));output='';stdin.write('中');await waitFor('│ 中');
 stdin.write('\x11\x1b[200~文 paste\x1b[201~');await waitFor('│ 中文 paste');
 stdin.write('\x15');await new Promise(r=>setTimeout(r,25));
 runtimeIo.stdout.write(('History **bold** `code` 中文\n').repeat(4000));await new Promise(r=>setTimeout(r,100));
 const samples=[];let draft='';
 for(const ch of 'responsiveness') {output='';runtimeIo.stdout.write('streamed chunk\n');draft+=ch;const start=performance.now();stdin.write(ch);await waitFor('│ '+draft);samples.push(performance.now()-start);}
 console.log(JSON.stringify({checks:['queue_focus_first_character','unicode_bracketed_paste','typing_during_streaming'],samples:samples.length,maxEchoMs:Math.max(...samples),environment:'in-process terminal stream fixture; not device IME acceptance'}));
}finally{stop.abort();await done;fs.rmSync(home,{recursive:true,force:true});}
