// Synthetic provider only. Launched by pty-parity.py in an isolated profile.
import {runWorkbench} from '../src/workbench.mjs';
import {writeAcceptance} from '../../koder-cli/src/eula.mjs';
import {saveConfig} from '../../koder-cli/src/config.mjs';
writeAcceptance(process.env);saveConfig({sessionInputMode:'queue'},process.env);
let calls=0,seen=false;
const provider={model:'pty-synthetic',contextWindow:64000,async complete(req){
 const items=Array.from({length:8},(_,i)=>({id:'step'+i,title:'PTY step '+i,status:i===0?'in_progress':'pending'}));
 if(++calls===1)return {text:'',toolCalls:[{id:'pty-todo',name:'todo_set',arguments:{items}}]};
 if(calls===2){req.onDelta?.('PTY streaming marker');await new Promise((resolve,reject)=>{const timer=setTimeout(resolve,4000);req.signal.addEventListener('abort',()=>{clearTimeout(timer);reject(req.signal.reason);},{once:true});});return {text:'First model step settled',toolCalls:[]};}
 if(calls===3){seen=req.messages.some(m=>m.role==='user'&&m.content==='PTY steering supplement');if(!seen)throw Error('STEERING_NOT_SEEN');return {text:'',toolCalls:[{id:'pty-todo-done',name:'todo_set',arguments:{items:items.map(x=>({...x,status:'completed'}))}}]};}
 return {text:'PTY_STEER_SEEN',toolCalls:[]};
}};
const code=await runWorkbench(['chat','--lang','en'],{providerOverride:provider});
process.stdout.write('\nPTY_MODEL_STEERING='+seen+'\n');process.exitCode=code;
