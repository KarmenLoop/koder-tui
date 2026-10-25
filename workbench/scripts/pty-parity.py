import os,pty,fcntl,termios,struct,subprocess,selectors,time,json,tempfile,pathlib,hashlib,re
ROOT=pathlib.Path(__file__).resolve().parents[1];E=ROOT.parents[2]/'evidence'
NODE=subprocess.check_output(['which','node'],text=True).strip()
with tempfile.TemporaryDirectory(prefix='koder-tui-pty-') as home:
 env={**os.environ,'HOME':home,'KODER_CLI_HOME':home+'/profile','KODER_AUTO_UPDATE':'0','TERM':'xterm-256color','COLORTERM':'truecolor'}
 for key in ('CI','NO_COLOR','KODER_REDUCED_MOTION'):env.pop(key,None)
 subprocess.run([NODE,'--input-type=module','-e',"import {writeAcceptance} from './src/eula.mjs';writeAcceptance(process.env)"],cwd=ROOT.parent/'koder-cli',env=env,check=True)
 master,slave=pty.openpty();fcntl.ioctl(slave,termios.TIOCSWINSZ,struct.pack('HHHH',36,120,0,0));before=termios.tcgetattr(slave)
 p=subprocess.Popen([NODE,str(ROOT/'scripts/pty-parity.mjs')],cwd=home,env=env,stdin=slave,stdout=slave,stderr=slave,start_new_session=True)
 sel=selectors.DefaultSelector();sel.register(master,selectors.EVENT_READ);raw=bytearray();checks=[]
 def read_until(marker,timeout=12):
  deadline=time.monotonic()+timeout
  while time.monotonic()<deadline:
   if marker in raw or marker in re.sub(rb'\x1b\[[0-?]*[ -/]*[@-~]',b'',raw):return
   if p.poll() is not None:raise RuntimeError('child exited before '+repr(marker))
   for _key,_events in sel.select(.1):
    try:raw.extend(os.read(master,65536))
    except OSError:break
  (E/'pty-parity-last-attempt.raw').write_bytes(raw)
  raise RuntimeError('timeout for '+repr(marker))
 def drain_for(seconds):
  deadline=time.monotonic()+seconds
  while time.monotonic()<deadline:
   for _key,_events in sel.select(.02):raw.extend(os.read(master,65536))
 try:
  read_until(b'WORKBENCH');read_until(b'ready');checks.append('actual_ui_started')
  # Drain startup paint, then require new terminal output without user input.
  # This exercises the live animation timer in a real PTY, not just two pure
  # renderer calls with different synthetic timestamps.
  deadline=time.monotonic()+.3
  while time.monotonic()<deadline:
   for _key,_events in sel.select(.05):raw.extend(os.read(master,65536))
  motion_start=len(raw);deadline=time.monotonic()+1.5
  while time.monotonic()<deadline:
   for _key,_events in sel.select(.05):raw.extend(os.read(master,65536))
  assert len(raw)>motion_start,'no live animation output'
  checks.append('idle_animation_emits_changed_frames')
  read_until(b'Model: pty-synthetic');checks.append('actual_model_slot')
  os.write(master,b'\x03\x03');drain_for(.2);assert p.poll() is None;checks.append('idle_ctrl_c_does_not_exit')
  os.write(master,b'/help\r');read_until(b'Slash commands');checks.append('searchable_slash_help')
  os.write(master,b'\x1b');drain_for(.2)
  os.write(master,b'Discuss these steps\r');read_until(b'PTY streaming marker');read_until(b'Todo 0/8')
  os.write(master,b'PTY steering supplement');drain_for(.2);read_until(b'PTY steering supplement');checks.append('draft_visible_while_streaming')
  os.write(master,b'\x14');read_until(b'PTY step 5');checks.append('ctrl_t_expands_real_todo')
  os.write(master,b'\x13');read_until(b'PTY_STEER_SEEN');read_until(b'Todo 8/8');checks.append('ctrl_s_reaches_same_model_turn')
  os.write(master,b'/undo\r');read_until(b'Previous conversation turn and Todo restored');checks.append('undo_restores_session_and_todo')
  os.write(master,b'/exit\r');deadline=time.monotonic()+15
  while p.poll() is None and time.monotonic()<deadline:
   for _key,_events in sel.select(.1):
    try:raw.extend(os.read(master,65536))
    except OSError:pass
  code=p.wait(timeout=1)
  for _key,_events in sel.select(.1):
   try:raw.extend(os.read(master,65536))
   except OSError:pass
  after=termios.tcgetattr(slave)
  assert code==0,code
  assert b'PTY_MODEL_STEERING=true' in raw
  assert bool(before[3]&termios.ECHO)==bool(after[3]&termios.ECHO),'echo not restored'
  assert bool(before[3]&termios.ICANON)==bool(after[3]&termios.ICANON),'canonical mode not restored'
  assert b'\x1b[?1049l' in raw and b'\x1b[?2004l' in raw and b'\x1b[?25h' in raw
  checks.append('exit_0_and_terminal_modes_restored')
  (E/'pty-parity-final.raw').write_bytes(raw)
  (E/'pty-parity-final.json').write_text(json.dumps({'platform':'macOS','node':NODE,'checks':checks,'exitCode':code,'bytes':len(raw),'rawSha256':hashlib.sha256(raw).hexdigest(),'modelApi':'NOT_RUN','accounts':'NOT_RUN'},indent=2)+'\n')
  print(json.dumps({'checks':checks,'exitCode':code,'bytes':len(raw)}))
 finally:
  if p.poll() is None:p.terminate();p.wait(timeout=10)
  os.close(master);os.close(slave);sel.close()
