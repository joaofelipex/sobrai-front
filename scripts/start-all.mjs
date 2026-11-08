// Sobe a API (../sobrai-back) e o app juntos: npm run mixco
// Uso: clone os dois repositórios lado a lado e rode este comando dentro de sobrai-front.
import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { networkInterfaces } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const front = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const back = resolve(process.env.BACK_DIR || resolve(front, '..', 'sobrai-back'));
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

if (!existsSync(resolve(back, 'package.json'))) {
  console.error(`\n✘ Não encontrei a API em ${back}\n  Clone o sobrai-back ao lado do sobrai-front (ou defina BACK_DIR=caminho).\n`);
  process.exit(1);
}

const major = Number(process.versions.node.split('.')[0]);
if (major < 20) { console.error(`\n✘ Node ${process.versions.node} é antigo demais. Use Node 20.12 ou mais novo.\n`); process.exit(1); }

// Instala dependências só na primeira vez.
for (const dir of [back, front]) {
  if (!existsSync(resolve(dir, 'node_modules'))) {
    console.log(`→ Instalando dependências em ${dir} (só na primeira vez)…`);
    const r = spawnSync(npm, ['install', '--no-audit', '--no-fund'], { cwd: dir, stdio: 'inherit', shell: process.platform === 'win32' });
    if (r.status !== 0) { console.error('✘ npm install falhou.'); process.exit(1); }
  }
}

const children = [];
const run = (label, cwd, args) => {
  // detached (Linux/Mac): cada serviço vira líder de um grupo de processos, para encerrarmos a árvore toda.
  const child = spawn(npm, args, { cwd, shell: process.platform === 'win32', env: process.env, detached: process.platform !== 'win32' });
  const prefix = (line) => line && console.log(`[${label}] ${line}`);
  for (const stream of [child.stdout, child.stderr]) stream.on('data', (d) => String(d).split(/\r?\n/).forEach(prefix));
  child.on('exit', (code) => { if (!stopping) { console.error(`\n✘ ${label} encerrou (código ${code}). Parando tudo.`); stop(1); } });
  children.push(child);
};

let stopping = false;
const stop = (code = 0) => {
  stopping = true;
  for (const c of children) {
    try {
      if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(c.pid), '/T', '/F']);
      else process.kill(-c.pid, 'SIGTERM'); // o grupo inteiro: npm + node/ng serve
    } catch { /* já encerrou */ }
  }
  setTimeout(() => process.exit(code), 300);
};
process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));

run('api', back, ['start']);
run('app', front, ['run', 'dev']);

const lan = Object.values(networkInterfaces()).flat().find((i) => i && i.family === 'IPv4' && !i.internal)?.address;
setTimeout(() => {
  console.log('\n──────────────────────────────────────────────');
  console.log('  MiXCo no ar (aguarde o app terminar de compilar)');
  console.log('  Computador:  http://localhost:3000');
  if (lan) console.log(`  Celular:     http://${lan}:3000  (mesmo Wi-Fi)`);
  console.log('  Parar:       Ctrl+C');
  console.log('──────────────────────────────────────────────\n');
}, 1500);
