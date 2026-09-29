import { exec, execString } from '@cloud-cli/exec';
import * as fs from 'fs';
import { help } from '@cloud-cli/cli';

interface InstallOptions {
  m: string;
}
interface RunOptions {
  c: string;
}

async function update() {
  `Update dependencies`;

  const o = await exec('npm', ['update']);
  return o.ok || Promise.reject(new Error(o.stderr));
}

async function install(options: InstallOptions) {
  `Install a Cloudy plugin. cy sys.install --m <plugin>`;

  const args = ['i', '@cloud-cli/' + options.m];
  const o = await exec('npm', args);
  return o.ok || Promise.reject(new Error(o.stderr));
}

async function restart() {
  `Restart the cloud service`;

  setTimeout(() => exec('systemctl', ['restart', 'cloud']), 100);
  return true;
}

async function run({ c }: RunOptions) {
  `Run a commmand`;

  const o = await execString(c);
  return o.ok ? o.stdout : Promise.reject(o.stderr);
}

function createService() {
  `Generate a systemd template for Cloudy`;

  const pwd = process.cwd();
  const service = `[Unit]
Description=Cloud CLI
After=network.target
Wants=network-online.target

[Service]
Restart=always
Type=simple
WorkingDirectory=${pwd}
ExecStart=${pwd}/node_modules/.bin/cy --serve
Environment=DEBUG=1

[Install]
WantedBy=multi-user.target
`;

  fs.writeFileSync(pwd + '/cloud.service', service);

  return true;
}

async function stats() {
  `Show memory and disk usage stats`;

  const disk = await exec('df', ['-hl', '-x', 'overlay', '--output=target,size,avail,pcent']);
  const memory = await exec('free', ['-h']);

  return [disk.stdout, memory.stdout].join('\n\n');
}

async function logs(options) {
  `Show recent system log entries`;

  const { lines = 100 } = options;
  const args = ['-n', String(lines), '_PID=' + process.pid];
  const o = await exec('journalctl', args);

  return o.stdout;
}

export default {
  update,
  install,
  restart,
  createService,
  logs,
  stats,
  run,
  [help]: () => `System administration functions

Available commands:
  sys update - Update dependencies
  sys install --m <plugin> - Install a Cloudy plugin
  sys restart - Restart the cloud service
  sys run --c <command> - Run a command
  sys logs [--lines <n>] - Show recent system log entries
  sys stats - Show memory and disk usage stats

Options:
  lines - Number of log lines to show (default: 100)
  command - Command to execute
  m - Plugin name`,
};
