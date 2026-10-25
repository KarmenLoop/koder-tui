import {renderStatus,tipAt} from './status.mjs';
import {fitSpans,sp,wrapSpans} from './paint.mjs';
import {renderMarkdown} from './markdown.mjs';
import {C} from './theme.mjs';
import {sanitize,truncate,textWidth} from './text.mjs';
import {loopFrame} from './loop.mjs';
import {catalog,slashCatalog,searchCatalog} from './catalog.mjs';

export function createLayout(){
 let cache={};
 return function render(s){
  const {cols,rows,lang,context,output,activities,draft,answer,question,panel,search,queueIndex,queueFocus,currentTask,completed,status,phase,runtimeVersion}=s;
  const tr=(zh,en)=>lang==='en'?en:zh;
  const line=(text='',width=cols,fg=C.text,bg=C.panelBg)=>fitSpans([sp(sanitize(text),{fg,bg})],width,{fg,bg});
  if(cols<40||rows<12)return {rows:Array.from({length:rows},(_,i)=>line(i===0?tr('请扩大终端至 40×12。','Resize terminal to at least 40×12.'):'')),cursor:null,scroll:0};
  const compact=rows<20,wide=cols>=110,side=wide?32:0,main=cols-(wide?side+1:0),ringWidth=main>=72?22:0;
  const q=s.queue||[],heading=[line(` KODER  /  WORKBENCH 0.3.0     CLI ${runtimeVersion}`,cols,C.accent,C.headerBg),line(` ${truncate(context.workspace,Math.max(12,cols-50))}   ${context.engine} · ${context.mode}     Ctrl+P ${tr('模块','Modules')} ${catalog.length}`,cols,C.dim)];
  if(compact)heading.splice(1);
  const queueRows=wide?0:compact?1:2;
  const layout=draft.layout(main-6),inputRows=Math.min(compact?1:4,layout.rows.length),inputTop=Math.max(0,layout.cursor.row-inputRows+1);
  const promptLines=question&&!question.chat?wrapSpans([sp(tr('需要你的输入 · ','Your input · ')+sanitize(question.prompt),{fg:C.warn})],main-4).slice(compact?-1:-2):[];
  const questionHeight=promptLines.length?promptLines.length+(compact?1:2):0;
  const items=s.todo?.items||[],todoCapacity=Math.max(0,rows-heading.length-(inputRows+2)-2-questionHeight-queueRows-2),todoRows=items.length?1+(s.todoExpanded?Math.min(items.length,6,todoCapacity):0):0;
  const todoOffset=Math.max(0,Math.min(s.todoOffset||0,Math.max(0,items.length-(todoRows-1))));
  const bodyHeight=Math.max(1,rows-heading.length-(inputRows+2)-2-questionHeight-todoRows-queueRows);
  const textWidth=Math.max(16,main-3-ringWidth);
  let content;
  if(s.view==='activity')content=activities.map(x=>[sp(`${x.name} · ${x.code===null?tr('执行中','running'):`exit ${x.code}`} · ${x.native?tr('原生终端','native console'):tr('工作台','workbench')}`,{fg:x.code?C.warn:C.soft})]);
  else {const key=`${textWidth}:${lang}:${C.panelBg}`;if(cache.text!==output||cache.key!==key)cache={key,text:output,rows:renderMarkdown(output,textWidth)};content=cache.rows;}
  if(!output&&s.view!=='activity')content=[line(tr(' 把任务交给 Koder。',' Give Koder a task.'),textWidth,C.text),line(tr(' CLI 的全部能力，共用同一执行引擎。',' All CLI capabilities, one execution engine.'),textWidth,C.dim)];
  const scroll=Math.max(0,Math.min(s.scroll,Math.max(0,content.length-bodyHeight))),start=Math.max(0,content.length-bodyHeight-scroll);
  const body=Array.from({length:bodyHeight},(_,i)=>fitSpans([sp(' '),...(content[start+i]||[])],main,{fg:C.text,bg:C.panelBg}));
  if(ringWidth){const ring=loopFrame(ringWidth,Math.min(11,bodyHeight),phase);for(let i=0;i<ring.length;i++)body[i]=[...fitSpans(body[i],main-ringWidth),...fitSpans(ring[i],ringWidth,{bg:C.panelBg})];}
  let selectedIndex=s.panelIndex;
  if(panel){
   const entries=panel==='help'?slashCatalog:catalog,list=searchCatalog(search.value,lang,entries),room=Math.max(1,bodyHeight-5);selectedIndex=Math.max(0,Math.min(selectedIndex,list.length-1));const from=Math.max(0,selectedIndex-room+1);
   const overlay=[line((panel==='help'?tr(' 斜杠命令',' Slash commands'):tr(' 全部 CLI 模块',' All CLI modules'))+`  ${list.length}/${entries.length}`,main,C.accent),line(` ${tr('搜索','Search')}: ${search.value}▍`,main),line(' Ctrl+S Steer · Ctrl+T Todo · Ctrl+Q Queue · Esc/Ctrl+C Stop · Ctrl+D Exit',main,C.dim)];
   for(let i=from;i<Math.min(list.length,from+room);i++)overlay.push(line(` ${i===selectedIndex?'›':' '} ${(panel==='help'?'/'+list[i].name:list[i].name).padEnd(13)} ${list[i].summary[lang]||list[i].summary.en}`,main,i===selectedIndex?C.accent:C.soft,i===selectedIndex?C.selectBg:C.panelBg));
   if(list[selectedIndex])overlay.push(line(' '+truncate(list[selectedIndex].usage,main-2),main,C.dim));
   overlay.push(line(tr(' Enter/Tab 填入 · Esc 返回草稿',' Enter/Tab stage · Esc back to draft'),main,C.warn));overlay.slice(0,bodyHeight).forEach((row,i)=>body[i]=row);
  }
  const left=[...body];
  if(!wide){left.push(line(` ${tr('队列','Queue')} ${q.length} · ${currentTask?tr('执行中','Running')+': '+truncate(currentTask.text,main-22):tr('空闲','Idle')}  [Ctrl+Q]`,main,C.accent));const item=q[Math.max(0,Math.min(queueIndex,q.length-1))];if(!compact)left.push(line(item?` ${queueFocus?'›':' '} ${queueIndex+1}. ${item}`:tr(' 暂无排队任务 · Alt+Q 将草稿加入队列',' Queue empty · Alt+Q queues the draft'),main,C.dim));}
  if(items.length){left.push(line(` ${s.todoExpanded?'▾':'▸'} Todo ${items.filter(x=>x.status==='completed').length}/${items.length} · Ctrl+T`+(s.todoExpanded&&items.length>todoRows-1?' · Alt+↑↓':''),main,C.accent));if(s.todoExpanded)for(const item of items.slice(todoOffset,todoOffset+todoRows-1))left.push(line(` ${({completed:'✓',in_progress:'●',cancelled:'−',pending:'○'})[item.status]||'○'} ${item.title}`,main,item.status==='in_progress'?C.accent:C.soft));}
  if(promptLines.length){left.push(...promptLines.map(x=>fitSpans([sp(' '),...x],main,{bg:C.panelBg})));let text=question.secret?'*'.repeat([...answer.value].length):answer.value;left.push(line(' > '+truncate(text,main-5),main,C.warn));if(!compact)left.push(line(tr(' Esc 取消回答；下方任务草稿仍保留',' Esc cancels answer; task draft stays below'),main,C.dim));}
  left.push(line(' ╭─ '+tr('任务 / CLI 命令','Task / CLI command')+' '+'─'.repeat(Math.max(0,main-28))+'╮',main,C.accent));
  const composerTop=left.length;
  for(let i=0;i<inputRows;i++)left.push(line(' │ '+(layout.rows[inputTop+i]||''),main,C.text));
  left.push(line(' ╰'+'─'.repeat(Math.max(0,main-3))+'╯',main,C.dim));
  left.push(line(` ${status} · ${context.session} · ${queueFocus?tr('↑↓选择 Alt+↑↓排序 Del移除','↑↓ select Alt+↑↓ reorder Del remove'):s.statusSettings?.enabled===false||s.statusSettings?.tips===false?'':tipAt(Date.now(),lang)}`,main,C.dim));
  left.push(line(' '+renderStatus({context,settings:{...s.statusSettings,tips:false},width:main-2,lang,todo:s.todo,queued:q.length,git:s.git}),main,C.dim));
  while(left.length<rows-heading.length)left.push(line('',main));
  let right=[];
  if(wide){
   right=[line(` ${queueFocus?'› ':''}${tr('任务队列','Task queue')}  [Ctrl+Q]`,side,C.accent),line(tr(' 当前执行',' Current'),side,C.dim),line(currentTask?' ● '+truncate(currentTask.text,side-4):tr(' ○ 空闲',' ○ Idle'),side,currentTask?C.accent:C.dim),line('',side),line(` ${tr('排队','Queued')} ${q.length}`,side,C.dim)];
   const available=Math.max(1,rows-right.length-9),from=Math.max(0,queueIndex-available+1);
   if(!q.length)right.push(line(tr(' 暂无排队任务',' No queued tasks'),side,C.dim));
   for(let i=from;i<Math.min(q.length,from+available);i++)right.push(line(` ${queueFocus&&i===queueIndex?'›':' '} ${i+1}. ${truncate(q[i],side-7)}`,side,i===queueIndex&&queueFocus?C.accent:C.soft));
   right.push(line('',side),line(tr(' 最近结果',' Recent results'),side,C.dim));
   for(const task of completed.slice(-3))right.push(line(` ${task.state==='completed'?'✓':task.state==='cancelled'?'−':'!'} ${truncate(task.text,side-5)}`,side,task.state==='completed'?C.ok:C.warn));
   while(right.length<rows-4)right.push(line('',side));right.push(line(tr(' Alt+Q 将草稿加入队列',' Alt+Q queues the draft'),side,C.dim),line(tr(' Alt+↑↓ 调整未执行任务',' Alt+↑↓ reorders queued tasks'),side,C.dim));
  }
  const merged=left.slice(0,rows-heading.length).map((r,i)=>wide?[...fitSpans(r,main),sp('│',{fg:C.border,bg:C.panelBg}),...fitSpans(right[i]||[],side,{bg:C.panelBg})]:r);
  let cursor={x:Math.min(main-2,3+layout.cursor.col),y:heading.length+composerTop+layout.cursor.row-inputTop};
  if(question&&!question.chat)cursor={x:Math.min(main-2,3+textWidthOfAnswer(answer.value,question.secret)),y:heading.length+bodyHeight+queueRows+todoRows+promptLines.length};
  if(panel||queueFocus)cursor=null;
  return {rows:[...heading,...merged],cursor,scroll,todoOffset,panelIndex:selectedIndex};
 };
}
function textWidthOfAnswer(text,secret){return secret?[...text].length:textWidth(text);}
