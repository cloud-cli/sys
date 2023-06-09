import fs from 'fs';
import * as exec from '@cloud-cli/exec';
import sys from './index';

const execOutput = {
  ok: true,
  code: 0,
  stdout: '',
  stderr: '',
};

describe('system commands', () => {
  it('should install a module', async () => {
    jest
      .spyOn(exec, 'exec')
      .mockReset()
      .mockImplementationOnce(async () => execOutput);

    await expect(sys.install({ m: 'test' })).resolves.toBe(true);
    expect(exec.exec).toHaveBeenCalledWith('npm', ['i', '@cloud-cli/test']);
  });

  it('should update a module', async () => {
    jest
      .spyOn(exec, 'exec')
      .mockReset()
      .mockImplementationOnce(async () => execOutput);

    await expect(sys.update({ m: 'test' })).resolves.toBe(true);
    expect(exec.exec).toHaveBeenCalledWith('npm', ['update', '@cloud-cli/test']);
  });

  it('should update all modules', async () => {
    jest
      .spyOn(exec, 'exec')
      .mockReset()
      .mockImplementationOnce(async () => execOutput);

    await expect(sys.update({})).resolves.toBe(true);
    expect(exec.exec).toHaveBeenCalledWith('npm', ['update']);
  });

  it('should capture update errors', async () => {
    jest
      .spyOn(exec, 'exec')
      .mockReset()
      .mockImplementationOnce(async () => ({
        ...execOutput,
        ok: false,
        stderr: 'npm failed',
      }));

    await expect(sys.update({})).rejects.toEqual(new Error('npm failed'));
    expect(exec.exec).toHaveBeenCalledTimes(1);
  });

  it('should capture install errors', async () => {
    jest
      .spyOn(exec, 'exec')
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
    jest
      .spyOn(exec, 'exec')
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
    jest
      .spyOn(exec, 'exec')
      .mockReset()
      .mockImplementationOnce(async () => execOutput);

    sys.restart();
    await expect(new Promise((r) => setTimeout(r, 200))).resolves.toBeUndefined();

    expect(exec.exec).toHaveBeenCalledTimes(1);
    expect(exec.exec).toHaveBeenCalledWith('systemctl', ['restart', 'cloud']);
  });

  it('should create a cloud systemctl file', () => {
    jest.spyOn(fs, 'writeFileSync');
    sys.createService();
    expect(fs.writeFileSync).toHaveBeenCalledWith(process.cwd() + '/cloud.service', expect.any(String));
  });
});
