#!/usr/bin/env bash

# given a single case id (e.g., 19820427023459I) will check to see if
# it exists in the output directory, otherwise fetch it --
# it won't store the file if there's a problem with the request

# usage: ./fix-missing.sh <case_id>
# if [ `ls out/${1}.html 2> /dev/null` ]; then
#   exit
# else
#   curl -f -s -o out/${1}.html \
#     "https://www.asias.faa.gov/apex/f?p=100:18:::NO::AP_BRIEF_RPT_VAR:${1}"
# fi

if [ `ls out/${1}.html 2> /dev/null` ]; then
  exit
else
  http_response=$(curl -f -s -o out/${1}.html -w "%{http_code}" "https://www.asias.faa.gov/apex/f?p=100:18:::NO::AP_BRIEF_RPT_VAR:${1}")
  if [ $http_response != "200" ]; then
    echo ${1} >> retries.txt
  fi
fi

# BEST USED when chained together with a file of IDs and xargs in parallel:
# cat id_list.txt | xargs -n 1 -P 32 ./fix-missing.sh 