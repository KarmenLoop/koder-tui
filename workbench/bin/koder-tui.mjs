#!/usr/bin/env node
import module from 'node:module';
import {fileURLToPath} from 'node:url';
import {defaultEntry,loadRuntime} from '../src/runtime.mjs';
import {supervise,runWorker} from '../../koder-cli/src/process-lifecycle.mjs';
module.enableCompileCache?.();
const argv=process.argv.slice(2),entry=fileURLToPath(import.meta.url);
try{
 const [major,minor]=process.versions.node.split('.').map(Number);
 if(!((major===22&&minor>=21)||major>=24)||!process.allowedNodeEnvironmentFlags.has('--use-env-proxy'))throw Error('NODE_RUNTIME_UNSUPPORTED: Node.js 22.21+ or 24+ is required.');
 if(argv.includes('--list-modules')){
  const {catalog}=await import('../src/catalog.mjs');process.stdout.write(argv.includes('--json')?JSON.stringify(catalog,null,2)+'\n':catalog.map(x=>`${x.name.padEnd(14)} ${x.summary.en}`).join('\n')+'\n');
 }else if(argv[0]==='--version'||argv[0]==='-v'){
  const runtime=await loadRuntime();process.stdout.write(`koder-tui 0.3.0 (CLI ${runtime.VERSION})\n`);
 }else if(argv[0]==='--help'||argv[0]==='-h'){
  process.stdout.write('Koder TUI — independent terminal workbench\n\nkoder-tui [-w workspace] [--lang zh|en] [--session name] [CLI global options]\nkoder-tui --list-modules [--json]\nkoder-tui -- <exact CLI arguments>\n\nCtrl+P: search all modules; Enter/Tab: stage an editable command\nAlt+Q: queue draft; Ctrl+Q: focus queue; Alt+Up/Down: reorder; Delete: remove\nCtrl+S: steer; Ctrl+T: Todo; Ctrl+O: activity; PageUp/PageDown: transcript; Esc: cancel current action\nEsc/Ctrl+C interrupt without exiting. /exit or Ctrl+D exits. /help opens command search. /statusline configures the footer. Approval prompts never consume queued task input.\nAll command, configuration, business and engine behavior comes from the bundled CLI.\n');
 }else if(argv[0]==='--'||argv.includes('--json')){
  process.exitCode=await supervise(process.env.KODER_TUI_RUNTIME_ENTRY||defaultEntry,argv[0]==='--'?argv.slice(1):argv);
 }else if(process.env.KODER_CLI_WORKER==='1'&&typeof process.send==='function'){
  const runtime=await loadRuntime();
  process.exitCode=await runWorker(argv,{runtime,run:async(args,io)=>{
   if(runtime.TUI_EMBEDDING_API!==2){
    process.stderr.write('TUI_RUNTIME_COMPATIBILITY: this updated CLI has no tested embedding API; continuing in its native terminal with the saved conversation.\n');
    return runtime.runCli(args,io);
   }
   const {runWorkbench}=await import('../src/workbench.mjs');return runWorkbench(args,io,runtime);
  }});
 }else{
  process.exitCode=await supervise(entry,argv[0]==='chat'?argv:['chat',...argv],{mapReplacement:(target,env)=>({entry,env:{...env,KODER_TUI_RUNTIME_ENTRY:target.entry}})});
 }
}catch(error){
 process.stdout.write('\x1b[0m\x1b[?2004l\x1b[?25h\x1b[?1049l');try{process.stdin.setRawMode?.(false);}catch{}
 process.stderr.write(`TUI_START_FAILED: ${error.code||error.message}\n`);if(process.connected)process.disconnect();process.exitCode=1;
}
