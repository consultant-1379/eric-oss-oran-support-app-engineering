#!/bin/bash
KUBECONFIG=$1
NAMESPACE=$2
REPORT_PATH=$3


# Delete network policies and pod
function cleanup() {
  # kubectl get pod -n ${NAMESPACE}
  kubectl describe pod eric-oss-oran-support-app-engineering -n ${NAMESPACE}
  # kubectl logs eric-oss-oran-support-app-engineering -n ${NAMESPACE}

  check_container_status() {
    local timeout=600
    local end_time=$((SECONDS + timeout))

    echo "kubectl get networkpolicy ... describe pod ... logs"
    kubectl get networkpolicy -n ${NAMESPACE} | grep deny
    kubectl get networkpolicy -n ${NAMESPACE}
    kubectl describe pod eric-oss-oran-support-app-engineering -n ${NAMESPACE}
    kubectl logs eric-oss-oran-support-app-engineering -n ${NAMESPACE}

    while [ $SECONDS -lt $end_time ]; do
      local container_status=$(kubectl get pod eric-oss-oran-support-app-engineering -n ${NAMESPACE} -o jsonpath="{.status.containerStatuses[?(@.name=='eric-oss-oran-support-app-engineering')].state.terminated}")
      if [ -n "$container_status" ]; then
        kubectl --namespace ${NAMESPACE} --kubeconfig ${KUBECONFIG} logs eric-oss-oran-support-app-engineering > ${REPORT_PATH}/eric-oss-oran-support-app-engineering.log
        return 0
      fi
      echo "copyK6Report.sh: Waiting for container eric-oss-oran-support-app-engineering within pod eric-oss-oran-support-app-engineering to be Terminated..."
      sleep 20
    done

    return 1
  }

  if check_container_status; then
    echo "Container eric-oss-oran-support-app-engineering is in Terminated state. Deleting the helm chart..."
    helm uninstall eric-oss-oran-support-app-engineering -n ${NAMESPACE}
  else
    echo "Timeout: Container eric-oss-oran-support-app-engineering did not reach Terminated state within the specified timeout. (5 min)"
  fi
}


# Save pod log and test output
function saveLogs() {
  echo 'Saving pod logs and summary.json'
  kubectl --namespace ${NAMESPACE} --kubeconfig ${KUBECONFIG} cp eric-oss-oran-support-app-engineering:/reports/summary.json ${REPORT_PATH}/summary.json
}
# The below logic will try to fetch result.html from k6 pod.
# Note that result.html is only generated after test is completed, while summary.json is updated continuously during test execution
# Will wait for at most 20 mins for the file to be generated.
echo 'sleep 180s to shorten log spam '
sleep 180 # 2.5 min to shorten log spam
retries="40";
echo retries:$retries
while [ $retries -ge 0 ]
do
  sleep 15
  kubectl --namespace ${NAMESPACE} --kubeconfig ${KUBECONFIG} cp eric-oss-oran-support-app-engineering:/reports/oran_support_result.html ${REPORT_PATH}/oran_support_result.html /dev/null
  stat ${REPORT_PATH}/oran_support_result.html 2> /dev/null
  ResultFound=$?
  if [ $ResultFound -eq 0 ]; then
    echo 'HTML report downloaded.'
    break;
  else
    echo 'Test report file  not yet available, Retries left =' $retries;
    let "retries-=1";
  fi
done

# Logs and cleanup is executed even if report is not present
saveLogs
  echo 'cleanup: '
cleanup

echo ${REPORT_PATH}
ls -l "${REPORT_PATH}/summary.json"
failCount=$(jq -r '.metrics.checks.values.fails' "${REPORT_PATH}/summary.json")
passes=$(jq -r '.metrics.checks.values.passes' "${REPORT_PATH}/summary.json")

echo "Fail count: $failCount"
echo "Passes count: $passes"

if [ -z "$failCount" ]; then
  echo "Unable to find the 'metrics.checks.values.fails' field in the JSON file or its value is null."
  exit 1
fi

if [ -z "$passes" ]; then
  echo "Unable to find the 'metrics.checks.values.passes' field in the JSON file or its value is null."
fi

if [ "$failCount" -eq 0 ] && [ "$passes" -ge 140 ]; then
  echo "All requests are successful in the report."
else
  echo "Failures detected in the report."
  exit 1
fi