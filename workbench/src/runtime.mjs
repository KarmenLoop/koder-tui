import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
export const defaultEntry=fileURLToPath(new URL('../../koder-cli/bin/koder.mjs',import.meta.url));
export async function loadRuntime(env=process.env){
 const entry=env.KODER_TUI_RUNTIME_ENTRY||defaultEntry,root=path.dirname(path.dirname(entry));
 const [cli,lifecycle]=await Promise.all([import(pathToFileURL(path.join(root,'src/cli.mjs')).href),import(pathToFileURL(path.join(root,'src/update-lifecycle.mjs')).href)]);
 return {...cli,createRestartController:lifecycle.createRestartController,entry};
}
