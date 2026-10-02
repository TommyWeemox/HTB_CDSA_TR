# Elastic KQL / EQL

## KQL

```
event.code : 4625
process.name : "cmd.exe" and not user.name : "SYSTEM"
process.command_line : *-enc*
host.name : "WS*" and event.category : "network"
```

## EQL

```eql
process where process.name == "rundll32.exe" and process.args_count == 1

sequence by user.name with maxspan=5m
  [authentication where event.outcome == "failure"]
  [authentication where event.outcome == "success"]
```

## Champs ECS utiles

`process.name`, `process.command_line`, `process.parent.name`, `user.name`, `host.name`, `source.ip`, `destination.ip`, `event.code`, `file.path`, `registry.path`.
