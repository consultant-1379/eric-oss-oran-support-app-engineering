#!/bin/sh
#KUBECONFIG=$1
#NAMESPACE=$2
#WORKSPACE=${env.WORKSPACE}
#sleep 80s
k6 run --summary-export summary.json /tests/main.js > /dev/null
#K6 run Main.js --http-debug = "full" > /dev/null
sleep 60s
cat /tests/main.js
#k6 run --summary-export summary1.json oasTests.js
#sleep 30s
#kubectl delete pod  a1-simulator --namespace ${NAMESPACE}
#k6 run --summary-export summary2.json oasTestsNegative.js
#sleep 30s
#sh ./robustnessCheck.sh
#k6 run Main.js > /dev/null
while true ; do sleep 600s ; done > /dev/null