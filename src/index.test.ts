import * as fs from 'fs';
import * as exec from '@cloud-cli/exec';
import sys from './index';
import { vi, describe, it, expect } from 'vitest';
import { help } from '@cloud-cli/cli';

vi.mock('fs');
vi.mock('@cloud-cli/exec');
vi.mock('@cloud-cli/cli', async (importOriginal) => {
  const mod: any = await importOriginal();
  return {
    ...mod,
    help: mod.help,
  };
});

const execOutput = {
  ok: true,
  code: 0,
  stdout: '',
  stderr: '',
};

describe('system commands', () => {
  it('should install a module', async () => {
    vi.spyOn(exec, 'exec')
      .mockReset()
      .mockImplementationOnce(async () => execOutput);

    await expect(sys.install({ m: 'test' })).resolves.toBe(true);
    expect(exec.exec).toHaveBeenCalledWith('npm', ['i', '@cloud-cli/test']);
  });

  it('should run a command', async () => {
    vi.spyOn(exec, 'execString')
      .mockReset()
      .mockImplementationOnce(async () => execOutput);

    await expect(sys.run({ c: 'ls -al' })).resolves.toBe('');
    expect(exec.execString).toHaveBeenCalledWith('ls -al');
  });

  it('should update all modules', async () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(false);
    vi.spyOn(exec, 'exec')
      .mockReset()
      .mockImplementationOnce(async () => execOutput);

    await expect(sys.update()).resolves.toBe(true);
    expect(exec.exec).toHaveBeenCalledWith('npm', ['update']);
  });

  it('should use pnpm when a pnpm lock file is present', async () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(exec, 'exec')
      .mockReset()
      .mockImplementationOnce(async () => execOutput);

    await expect(sys.update()).resolves.toBe(true);
    expect(exec.exec).toHaveBeenCalledWith('pnpm', ['update']);
  });

  it('should show system stats', async () => {
    const memoryOutput = {
      ok: true,
      code: 0,
      stdout: 'whatever\nMem:   16Gi  1Gi  15Gi',
      stderr: '',
    };

    const diskOutput = {
      ok: true,
      code: 0,
      stdout: 'whatever\n/data.    20G    10G  50%',
      stderr: '',
    };

    const outputs = [diskOutput, memoryOutput];

    vi.spyOn(exec, 'exec')
      .mockReset()
      .mockImplementation(async () => outputs.shift());

    await expect(sys.stats()).resolves.toBe(diskOutput.stdout + '\n\n' + memoryOutput.stdout);

    expect(exec.exec).toHaveBeenCalledWith('df', ['-hl', '-x', 'overlay', '--output=target,size,avail,pcent']);
    expect(exec.exec).toHaveBeenCalledWith('free', ['-h']);
  });

  it('should capture update errors', async () => {
    vi.spyOn(exec, 'exec')
      .mockReset()
      .mockImplementationOnce(async () => ({
        ...execOutput,
        ok: false,
        stderr: 'npm failed',
      }));

    await expect(sys.update()).rejects.toEqual(new Error('npm failed'));
    expect(exec.exec).toHaveBeenCalledTimes(1);
  });

  it('should capture install errors', async () => {
    vi.spyOn(exec, 'exec')
      .mockReset()
      .mockImplementationOnce(async () => ({
        ...execOutput,
        ok: false,
        stderr: 'npm failed',
      }));

    await expect(sys.install({ m: 'foo' })).rejects.toEqual(new Error('npm failed'));
    expect(exec.exec).toHaveBeenCalledTimes(1);
  });

  it('should retrieve cloudy logs', async () => {
    const output = { ...execOutput, stdout: 'logs' };
    vi.spyOn(exec, 'exec')
      .mockReset()
      .mockImplementation(async () => output);

    const logs1 = await sys.logs({});
    const logs2 = await sys.logs({ lines: 50 });

    expect(exec.exec).toHaveBeenCalledTimes(2);
    expect(exec.exec).toHaveBeenCalledWith('journalctl', ['-n', '50', '_PID=' + process.pid]);
    expect(exec.exec).toHaveBeenCalledWith('journalctl', ['-n', '100', '_PID=' + process.pid]);
    expect(logs1).toBe('logs');
    expect(logs2).toBe('logs');
  });

  it('should restart the cloud CLI server', async () => {
    vi.spyOn(exec, 'exec')
      .mockReset()
      .mockImplementationOnce(async () => execOutput);

    sys.restart();
    await expect(new Promise((r) => setTimeout(r, 200))).resolves.toBeUndefined();

    expect(exec.exec).toHaveBeenCalledTimes(1);
    expect(exec.exec).toHaveBeenCalledWith('systemctl', ['restart', 'cloud']);
  });

  it('should create a cloud systemctl file', () => {
    vi.spyOn(fs, 'writeFileSync');
    sys.createService();
    expect(fs.writeFileSync).toHaveBeenCalledWith(process.cwd() + '/cloud.service', expect.any(String));
  });

  describe('help', () => {
    it('should have a [help] Symbol export that is a function', () => {
      expect(sys[help]).toBeDefined();
      expect(typeof sys[help]).toBe('function');
    });

    it('should return a string help text', () => {
      const helpText = sys[help]();
      expect(typeof help).toBe('symbol');
      expect(typeof helpText).toBe('string');
      expect(helpText).toContain('System');
      expect(helpText).toContain('sys.update');
      expect(helpText).toContain('sys.install');
      expect(helpText).toContain('sys.restart');
      expect(helpText).toContain('sys.run');
      expect(helpText).toContain('sys.createService');
      expect(helpText).toContain('sys.logs');
      expect(helpText).toContain('sys.stats');
    });

    it('should not expose "help" as a normal command key', () => {
      expect(Object.hasOwn(sys, 'help')).toBe(false);
    });
  });
});
