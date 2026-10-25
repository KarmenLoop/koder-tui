import {StringDecoder} from 'node:string_decoder';
export function createOutputBuffer(limit=200000){
  const decoder=new StringDecoder('utf8');let text='',state='normal';
  return {
    append(chunk){
      let clean='';
      for(const ch of decoder.write(Buffer.isBuffer(chunk)?chunk:Buffer.from(String(chunk)))){
        if(state==='osc'){if(ch==='\x07')state='normal';else if(ch==='\x1b')state='osc-escape';continue;}
        if(state==='osc-escape'){state=ch==='\\'?'normal':'osc';continue;}
        if(state==='csi'){if(/[@-~]/.test(ch))state='normal';continue;}
        if(state==='escape'){state=ch==='['?'csi':ch===']'||ch==='P'||ch==='_'||ch==='^'?'osc':'normal';continue;}
        if(ch==='\x1b'){state='escape';continue;}
        if(ch==='\n'||ch==='\t'||ch>=' '&&!(ch>='\x7f'&&ch<='\x9f'))clean+=ch==='\t'?'  ':ch;
      }
      text=(text+clean).slice(-limit);return clean;
    },
    get text(){return text;},
    clear(){text='';},
  };
}
