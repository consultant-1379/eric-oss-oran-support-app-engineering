#!/bin/bash
KUBECONFIG=$1
NAMESPACE=$2
PODFILE=$3
kubectl --namespace ${NAMESPACE} --kubeconfig ${KUBECONFIG} apply -f ${PODFILE}/Chart/k6pod.yaml;