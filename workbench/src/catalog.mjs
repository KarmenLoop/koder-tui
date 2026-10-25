import fs from 'node:fs';
import {COMMANDS} from '../../koder-cli/src/help.mjs';
import {resolveCommand} from '../../koder-cli/src/cli.mjs';
const source=fs.readFileSync(new URL('../../koder-cli/src/cli.mjs',import.meta.url),'utf8');
const loaders=source.split('const LOADERS = {')[1]?.split('\n};')[0];
if(!loaders)throw Error('CLI_COMMAND_CATALOG_UNAVAILABLE');
const descriptions=new Map(COMMANDS.map(item=>[item.name,item]));
export const catalog=[...loaders.matchAll(/^\s+(\w+):/gm)].map(([,name])=>({name,aliases:[],group:'setup',summary:{zh:name,en:name},usage:`koder ${name} --help`,...descriptions.get(name)}));
const chatSource=fs.readFileSync(new URL('../../koder-cli/src/commands/chat.mjs',import.meta.url),'utf8');
const chatSlashSource=(chatSource.match(/const SLASH = \[([^\]]+)\]/)?.[1]||'')+[...chatSource.matchAll(/SLASH\.push\(([^)]+)\)/g)].map(m=>m[1]).join(',');
const chatNames=[...chatSlashSource.matchAll(/["']\/([^"']+)["']/g)].map(m=>m[1]);
const chatSet=new Set(chatNames);
const extra={
 todo:['查看或清除本轮清单','View or clear the session checklist'],undo:['撤销上一轮对话和清单','Undo the previous conversation turn and checklist'],
 mode:['切换执行模式','Switch execution mode'],yes:['本次审批方式','Invocation approval mode'],
 new:['新会话','New conversation'],exit:['退出工作台','Exit workbench'],quit:['退出工作台','Exit workbench'],
 suggest:['后续输入建议','Next-message suggestions'],prefill:['预填可编辑草稿','Fill an editable draft'],
 skill:['选择当前会话技能','Select session skills'],menu:['上下文输入菜单','Contextual input menu'],
 modules:['全部 CLI 模块','All CLI modules'],queue:['下一条任务排队','Queue a later task'],
 activity:['活动记录','Activity history'],clear:['清空显示区','Clear visible output'],statusline:['配置底部状态栏','Configure status fields']
};
const uiNames=['modules','queue','activity','clear','statusline'];
export const slashCatalog=[...new Set([...catalog.map(x=>x.name),...chatNames,...uiNames])].map(name=>{
 const command=catalog.find(x=>x.name===name)||catalog.find(x=>x.name===resolveCommand(name));
 return {...command,name,aliases:command?.aliases||[],group:command?.group||'chat',summary:extra[name]?{zh:extra[name][0],en:extra[name][1]}:command?.summary||{zh:name,en:name},usage:'/'+name+(name==='statusline'?' [mode|goal|model|tasks|cwd|git|tips] [on|off]':name==='queue'?' <task>':'')};
});

// An argv editor, never a shell. Backslashes stay literal for Windows paths.
export function parseWords(text) {
  const words=[];let word='',quote=null,started=false;
  for(let i=0;i<text.length;i++){
    const ch=text[i];
    if(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(ch))throw Error('ARGUMENT_CONTROL_CHARACTER');
    if(quote){if(ch===quote){if(text[i+1]===quote){word+=ch;i++;}else quote=null;}else word+=ch;continue;}
    if(ch==='"'||ch==="'"){quote=ch;started=true;}
    else if(/\s/.test(ch)){if(started){words.push(word);word='';started=false;}}
    else {word+=ch;started=true;}
  }
  if(quote)throw Error('ARGUMENT_QUOTE_UNCLOSED');
  if(started)words.push(word);
  return words;
}
export function parseLocal(text) {
  const value=text.trim();
  if(!value.startsWith('/')&&!/^koder\s/.test(value))return null;
  const words=parseWords(value.startsWith('/')?value.slice(1):value.replace(/^koder\s+/,''));
  const name=chatSet.has(words[0])?words[0]:resolveCommand(words[0])||uiNames.find(x=>x===words[0]);
  return name?{name,argv:[name,...words.slice(1)]}:null;
}
export function searchCatalog(query='',lang='zh',items=catalog) {
  const words=query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  return items.filter(item=>words.every(word=>[item.name,...item.aliases,item.summary.zh,item.summary.en,item.group].join(' ').toLocaleLowerCase().includes(word)))
    .sort((a,b)=>(a.name===query?-1:b.name===query?1:0)||a.group.localeCompare(b.group)||a.name.localeCompare(b.name));
}
export const quoteArg=value=>/^[\w./:@=,+-]+$/.test(value)?value:'"'+value.replaceAll('"','""')+'"';
