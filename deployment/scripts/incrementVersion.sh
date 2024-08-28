#!/bin/bash

pattern=".*test\ [0-9]+.*"
while IFS= read -r line; do
    if [[ $line =~ $pattern ]]; then
        echo $line > oldnum.txt
        break
    fi
done < "src/js/main.js"

old=`sed 's/[^0-9]*\([0-9]\+\).*/\1/' oldnum.txt`
new=`expr $old + 1`

sed -i "s/$line\$/    console\.log\(\"test $new\"\)/g" src/js/main.js

rm -f oldnum.txt