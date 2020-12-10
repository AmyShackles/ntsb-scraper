#!/usr/bin/env bash

# given a single case id (e.g., 19820427023459I) will check to see if
# it exists in the output directory, otherwise fetch it --
# if there is a problem with the request, it will append the ID to retries.txt
# This way, subsequent runs of the script can be done on a reduced subset

# usage: ./fix-missing.sh <case_id>
FILE="./out/${1}.html"
if test -f "$FILE"; then
  exit
else
  http_response=$(curl -f -s -o out/${1}.html -w "%{http_code}" "https://www.asias.faa.gov/apex/f?p=100:18:::NO::AP_BRIEF_RPT_VAR:${1}")
  if [ $http_response != "200" ]; then
    echo ${1} >> retries.txt
  fi
fi

# BEST USED when chained together with a file of IDs and xargs in parallel:
# cat retries.txt| xargs -n 1 -P 32 ./fix-missing.sh