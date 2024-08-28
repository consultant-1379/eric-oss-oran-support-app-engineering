#!/bin/bash
KUBECONFIG=$1
NAMESPACE=$2
REPORT_PATH=$3

echo "helm uninstall"
helm uninstall eric-oss-oran-support-app-engineering -n ${NAMESPACE}
