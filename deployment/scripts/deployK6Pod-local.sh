#!/bin/bash
KUBECONFIG=$1
NAMESPACE=$2
GAS_HOSTNAME=$3
docker build -t armdocker.rnd.ericsson.se/proj-edca-dev/k6-os-testsuite:1 --build-arg hostname=${GAS_HOSTNAME} --no-cache .
docker push armdocker.rnd.ericsson.se/proj-edca-dev/k6-os-testsuite:1
kubectl --namespace ${NAMESPACE} --kubeconfig ${KUBECONFIG} apply -f ./deployment/chart/main/templates/network-policy/os-a1.yaml
kubectl --namespace ${NAMESPACE} --kubeconfig ${KUBECONFIG} apply -f ./deployment/chart/main/templates/network-policy/os-sim.yaml
kubectl --namespace ${NAMESPACE} --kubeconfig ${KUBECONFIG} apply -f ./deployment/chart/main/templates/network-policy/sim-a1.yaml
echo "GAS_HOSTNAME:" ${GAS_HOSTNAME}
kubectl --namespace ${NAMESPACE} --kubeconfig ${KUBECONFIG} apply -f ./deployment/chart/oas-k6pod.yaml
