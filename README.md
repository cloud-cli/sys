# System management commands

```
npm i @cloud-cli/sys
```

## Bootstrap the CLI server

```
npm i @cloud-cli/sys @cloud-cli/cli
alias cy="./node_modules/.bin/cy"
cy --serve&
cy createService
fg
# Ctrl+C to stop the server
ln -s $PWD/cloud.service /etc/systemd/system/cloud.service
systemctl daemon-reload
systemctl enable cloud
systemct restart cloud
```

## Usage

**Restart the CLI server:**

```
cy sys.restart
```

**Install a new module:**

```
cy sys.install -m foo
```

**Update server modules or a single module:**

```
cy sys.update
cy sys.update -m foo
```

**Create a systemd unit to run the CLI server:**

```
cy sys.createService
```
