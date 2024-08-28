#!/bin/bash
KUBECONFIG=$1
NAMESPACE=$2
REPORT_PATH=$3
retries="10";
while [ $retries -ge 0 ]
do
    if [[ "$retries" -eq "0" ]]
    then
        echo no report file available
        kubectl --namespace ${NAMESPACE} delete pod k6-testsuite
        exit 1
    elif ! kubectl --namespace ${NAMESPACE} --kubeconfig ${KUBECONFIG} cp k6-testsuite:/home/k6/scripts/test-output.json ${REPORT_PATH}/test-output.json ;
    then
        let "retries-=1"
        echo report not available, Retries left = $retries :: Sleeping for 10 seconds
        sleep 10
    else
        echo report copied
        kubectl --namespace ${NAMESPACE} delete pod k6-testsuite
        break
    fi
done