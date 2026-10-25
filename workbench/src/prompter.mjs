import {classifyMidRunInput} from '../../koder-cli/src/session-input.mjs';
import {stripVTControlCharacters} from 'node:util';
export const isChatPrompt=text=>/^koder(?:\[[^\]]*\])*!?\s*›\s*$/.test(stripVTControlCharacters(text));
export function createUiPrompter({onQuestion=()=>{},onBusy=()=>{},onPrefill=()=>({ok:false}),snapshotDraft=()=>'',suspend=fn=>fn(),output,initial={},onQueue=()=>{},snapshotExtra=()=>({}),freezeInput=()=>({}),snapshotHistory=()=>[]}={}) {
  const queue=[...(initial.queue||[])];let pending=null,busy=null,closed=false,seq=0,submissions=0,tail=Promise.resolve();
  function settle(value){const read=pending;pending=null;read?.resolve(value);}
  const api={
    output,
    get closed(){return closed;},
    get awaitingApproval(){return Boolean(pending&&!pending.chat);},
    get pending(){return pending?{id:pending.id,prompt:pending.prompt,fresh:pending.fresh,secret:pending.secret,chat:pending.chat}:null;},
    attachMenu(){},
    setBusy(value){busy=value;onBusy(Boolean(value));},
    async ask(prompt,{fresh=false,secret=false}={}){
      if(closed)return null;
      if(pending)throw Error('UI_INPUT_ALREADY_OWNED');
      const chat=isChatPrompt(prompt);
      if(chat&&!fresh){if(submissions)await tail;if(closed)return null;if(queue.length){const text=queue.shift();onQueue();return text;}}
      return new Promise(resolve=>{pending={id:++seq,prompt:String(prompt),fresh,secret,chat,resolve};onQuestion(api.pending);});
    },
    // Queued tasks can satisfy only ordinary chat, never questions/approvals.
    submit(text){
      if(closed)return Promise.resolve();
      const handler=busy;
      // Control interrupts cannot wait behind an unresolved steering receipt.
      if(handler&&classifyMidRunInput(text).kind==='interrupt')return Promise.resolve(handler.submit(text));
      submissions++;
      const receipt=handler?Promise.resolve(handler.submit(text)):Promise.resolve(false);
      receipt.catch(()=>{});
      const job=tail.then(()=>receipt).then(accepted=>{
        if(closed||accepted===true)return;
        if(pending?.chat&&!pending.fresh)settle(text);else {queue.push(text);onQueue();}
      });
      const completed=job.finally(()=>submissions--);tail=completed.catch(()=>{});return completed;
    },
    async steer(text){
      if(closed||!busy)return {accepted:false,reason:'STEER_NOT_RUNNING'};
      if(pending&&!pending.chat)return {accepted:false,reason:'STEER_AWAITING_ANSWER'};
      if(!busy.steer)return {accepted:false,reason:'STEER_ENGINE_QUEUE_ONLY'};
      const handler=busy;submissions++;
      const receipt=Promise.resolve().then(()=>handler.steer(text)).finally(()=>submissions--);
      tail=Promise.all([tail,receipt.catch(()=>{})]).then(()=>{});
      return receipt;
    },
    answer(text,id){if(closed||!pending||pending.chat||pending.id!==id)return false;settle(text);return true;},
    enqueue(text){
      if(closed)return;
      const admit=()=>{if(closed)return;if(pending?.chat&&!pending.fresh)settle(text);else {queue.push(text);onQueue();}};
      if(!submissions){admit();return;}
      // An explicit TODO must not overtake earlier input whose CLI steering
      // receipt has not yet decided whether it belongs in the queue.
      submissions++;const job=tail.then(admit);
      const completed=job.finally(()=>submissions--);tail=completed.catch(()=>{});return completed;
    },
    queued(){return [...queue];},
    moveQueued(index,delta){const to=index+delta;if(!Number.isInteger(index)||!Number.isInteger(delta)||index<0||index>=queue.length||to<0||to>=queue.length)return false;const [item]=queue.splice(index,1);queue.splice(to,0,item);onQueue();return true;},
    removeQueued(index){if(!Number.isInteger(index)||index<0||index>=queue.length)return false;queue.splice(index,1);onQueue();return true;},
    prefill(text){return closed?{ok:false,reason:'closed'}:onPrefill(text);},
    interrupt(){settle(null);},
    wake(){settle(null);},
    snapshot(){return {queue:[...queue],draft:snapshotDraft(),history:snapshotHistory(),pendingSubmissions:submissions,...snapshotExtra()};},
    freeze(){const saved={...api.snapshot(),...freezeInput()};api.close();return saved;},
    withInputSuspended(fn){return suspend(fn);},
    close(){closed=true;queue.length=0;busy=null;settle(null);},
  };
  return api;
}
