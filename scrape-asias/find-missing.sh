#!/usr/bin/env bash

# given a single case id (e.g., 19820427023459I) will check to see if
# it exists in the output directory, otherwise print ID to stdout

FILE="./out/${1}.html"
if test -f "$FILE"; then
  	exit
else
	echo ${1}
fi
