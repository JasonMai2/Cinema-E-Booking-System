#!/usr/bin/env bash
pids=$(ps aux | grep '[s]pring-boot:run' | awk '{print $2}')
if [ -z "$pids" ]; then
  echo "No backend process found."
else
  echo "Killing: $pids"
  kill $pids
fi
