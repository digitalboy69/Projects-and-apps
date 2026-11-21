#!/bin/sh
# usage: sh install.sh /path/to/project
exec python3 "$(dirname "$0")/install.py" "$@"
