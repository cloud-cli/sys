import { exec } from '@cloud-cli/exec';
import fs from 'fs';

interface UpdateOptions { m: string }

async function update(options: Partial<UpdateOptions>) {
  const args = ['update'];
  if (options && options.m) {
    args.push('@cloud-cli/' + options.m);
  }

  const o = await exec('npm', args);
  return o.ok || Promise.reject(new Error(o.stderr));
}

async function install(options: UpdateOptions) {
  const args = ['i', '@cloud-cli/' + options.m];
  const o = await exec('npm', args);
  return o.ok || Promise.reject(new Error(o.stderr));
}

async function restart() {
  setTimeout(() => exec('systemctl', ['restart', 'cloud']), 100);
  return true;
}

function createService() {
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
}
`;

  fs.writeFileSync(pwd + '/cloud.service', service);

  return true;
}

export default { update, install, restart, createService };