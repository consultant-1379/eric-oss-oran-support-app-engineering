#!/bin/bash

if helm status eric-oss-oran-support-app-engineering -n ${NAMESPACE}; then
  helm uninstall eric-oss-oran-support-app-engineering -n ${NAMESPACE}
  echo 'it was not deleted'
  sleep 10
fi