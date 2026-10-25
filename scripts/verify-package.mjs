import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {spawn} from 'node:child_process';
import http from 'node:http';
const root=process.cwd(),dir=path.join(root,'artifacts'),platform=process.platform==='win32'?'windows-x64':`macos-${process.arch}`;
const name=`koder-tui-0.3.0-${platform}${process.platform==='win32'?'.zip':'.tar.gz'}`;
const sums=fs.readFileSync(path.join(dir,'SHA256SUMS'),'utf8');
const expected=sums.split('\n').find(l=>l.endsWith('  '+name))?.split(' ')[0];
if(!expected||crypto.createHash('sha256').update(fs.readFileSync(path.join(dir,name))).digest('hex')!==expected)throw Error('Package checksum mismatch');
const results=[];
async function run(bin,args,options={}){
 const child=spawn(bin,args,{cwd:root,env:{...process.env,KODER_AUTO_UPDATE:'0',TERM:'xterm-256color',...options.env},...options,stdio:['ignore','pipe','pipe']});
 let output='';child.stdout.on('data',b=>{output+=b;process.stdout.write(b)});child.stderr.on('data',b=>{output+=b;process.stderr.write(b)});
 const timer=setTimeout(()=>child.kill(), options.timeoutMs || 120000);
 const code=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('exit',resolve)});clearTimeout(timer);
 if(code!==0)throw Error(`${bin} exited ${code}`);return output;
}
if(process.platform==='win32')await run('powershell.exe',['-NoProfile','-Command',`$ErrorActionPreference='Stop'; Add-Type -AssemblyName System.IO.Compression.FileSystem; [IO.Compression.ZipFile]::ExtractToDirectory('${path.join(dir,name).replaceAll("'","''")}','${dir.replaceAll("'","''")}')`],{timeoutMs:600000});
else await run('tar',['-xzf',path.join(dir,name),'-C',dir]);
results.push('archive_checksum_and_extraction');
const pkg=path.join(dir,'koder-tui'),node=path.join(pkg,process.platform==='win32'?'runtime/node.exe':'runtime/bin/node'),entry=path.join(pkg,'packages/koder-tui/bin/koder-tui.mjs');
const home=fs.mkdtempSync(path.join(os.tmpdir(),'koder-tui-release-'));
const env={...process.env,KODER_AUTO_UPDATE:'0',TERM:'xterm-256color',KODER_CLI_HOME:path.join(home,'profile'),KODER_TUI_EULA_ACCEPT:'1'};
if(!(await run(node,[entry,'--version'],{env})).includes('koder-tui 0.3.0 (CLI 0.4.12)'))throw Error('Wrong version');
const modules=JSON.parse(await run(node,[entry,'--list-modules','--json'],{env}));if(modules.length!==58)throw Error('Missing CLI routes');
await run(node,[entry,'--','help'],{env});results.push('bundled_node_version_and_58_cli_routes');
const tests=path.join(pkg,'packages/koder-tui/test');
fs.cpSync(path.join(root,'workbench/test'),tests,{recursive:true});
fs.cpSync(path.join(root,'test-runtime-support'),path.join(pkg,'packages/koder-cli/test'),{recursive:true});
await run(node,['--test','--test-timeout=30000',...fs.readdirSync(tests).filter(n=>n.endsWith('.test.mjs')).map(n=>path.join(tests,n))],{env});results.push('workbench_regression');
const server=http.createServer((req,res)=>{
 const file=path.basename(new URL(req.url,'http://localhost').pathname);
 if(![name,'SHA256SUMS'].includes(file)){res.writeHead(404).end();return}
 fs.createReadStream(path.join(dir,file)).pipe(res);
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const installRoot=path.join(home,'安装 space'),bin=path.join(home,'bin space');
const installEnv={...env,KODER_TUI_HOME:installRoot,KODER_TUI_BIN_DIR:bin,KODER_TUI_DOWNLOAD_BASE:`http://127.0.0.1:${server.address().port}`};
try{
 if(process.platform==='win32'){
  await run('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',path.join(root,'install/koder-tui.ps1')],{env:installEnv,timeoutMs:600000});
  const launcher=path.join(installRoot,'bin/koder-tui.cmd').replaceAll("'","''");
  await run('powershell.exe',['-NoProfile','-Command',`& '${launcher}' --version; exit $LASTEXITCODE`],{env});
 }else{
  await run('bash',[path.join(root,'install/koder-tui.sh')],{env:installEnv,timeoutMs:600000});
  await run(path.join(bin,'koder-tui'),['--version'],{env});
 }
 results.push('isolated_install_and_launcher_with_unicode_and_spaces');
}finally{await new Promise(resolve=>server.close(resolve))}
const result={platform:process.platform,architecture:process.arch,package:name,sha256:expected,results,notRun:['live_model','real_account_writes','Windows_ConPTY_IME_GUI']};
fs.writeFileSync(path.join(dir,'validation-'+platform+'.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result));
