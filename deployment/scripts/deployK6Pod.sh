#!/bin/bash
KUBECONFIG=$1
NAMESPACE=$2
BUILD_URL=$3
GAS_HOSTNAME=$4
echo "BUILD_URL: " ${BUILD_URL}
echo "GAS_HOSTNAME:" ${GAS_HOSTNAME}
echo "APP_VERSION:" ${APP_VERSION}

APP_VERSION=`helm list -n ${NAMESPACE} --filter eric-oss-oran-support -o json | jq -r '.[0].chart' | cut -d '-' -f5`


if helm status eric-oss-oran-support-app-engineering -n ${NAMESPACE}; then
  helm uninstall eric-oss-oran-support-app-engineering -n ${NAMESPACE}
  echo '    POD WAS NOT DELETED LAST RUN    '
  sleep 4
fi
if helm repo list | grep -q "^testware-repository\s"; then
    echo "Repository testware-repository already exists. Updating..."
    helm repo update testware-repository
else
    echo "Repository testware-repository does not exist. Adding..."
    helm repo add testware-repository https://arm.seli.gic.ericsson.se/artifactory/proj-eric-oss-drop-helm-local --username testautoci --password '&SmgE!!RJ87joL7T'
fi

helm install eric-oss-oran-support-app-engineering testware-repository/eric-oss-oran-support-app-engineering -n ${NAMESPACE} --kubeconfig ${KUBECONFIG} --set env.BUILD_URL=${BUILD_URL} --set env.APP_VERSION=${APP_VERSION} --set env.GAS_HOSTNAME=${GAS_HOSTNAME}