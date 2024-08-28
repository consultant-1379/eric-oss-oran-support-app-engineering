#!/bin/bash
KUBECONFIG=$1
NAMESPACE=$2
REPORT_PATH=$3

if ! kubectl --namespace "${NAMESPACE}" --kubeconfig "${KUBECONFIG}" get pods | grep -q "a1-simulator"; then
  kubectl --kubeconfig ${KUBECONFIG} run a1-simulator --image="armdocker.rnd.ericsson.se/proj-eric-oss-dev-test/a1-simulator" --port 8085 --port 8185 --env="A1_VERSION=OSC_2.1.0" --env="ALLOW_HTTP=true" --overrides="$(cat ./deployment/scripts/overrides.json)" --namespace ${NAMESPACE}
  kubectl --kubeconfig ${KUBECONFIG} expose pod a1-simulator --type=ClusterIP --port=8085 --target-port=8085 --namespace ${NAMESPACE}
  kubectl --kubeconfig ${KUBECONFIG} port-forward svc/eric-oss-a1-policy-mgmt-svc 9080:9080 -n ${NAMESPACE} & pid=$!
fi
    sleep 6
  curl -X GET -H "Content-Type: application/json" http://localhost:9080/a1-policy/v2/configuration > ./deployment/scripts/configured.json
HTTP_STATUS=$(curl -w "%{http_code}" -o /dev/null -X PUT -H "Content-Type: application/json" -d @./deployment/scripts/populated.json http://localhost:9080/a1-policy/v2/configuration)

if [[ "$HTTP_STATUS" == 500 ]] ; then
echo "Changing config map"
kubectl --kubeconfig ${KUBECONFIG} get configmap eric-oss-a1-policy-mgmt-svc-configmap --namespace ${NAMESPACE} -o yaml > ./deployment/scripts/config-ric.yaml
#sed -i.bak '74d;73r ric-config.yaml' config-ric.yaml
for var in ` grep -Fn '"ric": []' ./deployment/scripts/config-ric.yaml | cut -f 1 -d ":" `; do
echo "ric config is empty at line number:$var"
echo "before changes config-ric.yaml"
cat ./deployment/scripts/config-ric.yaml
sed -n ${var}p ./deployment/scripts/config-ric.yaml 
sed -i.bak "${var}d;$((var-1))r ./deployment/scripts/ric-config.yaml" ./deployment/scripts/config-ric.yaml
echo "ric config content after ric is configured"
sed -n ${var}p ./deployment/scripts/config-ric.yaml
echo "after changes config-ric.yaml"
cat ./deployment/scripts/config-ric.yaml
done
kubectl --namespace ${NAMESPACE} --kubeconfig ${KUBECONFIG} apply -f ./deployment/scripts/config-ric.yaml
fi

kubectl --namespace ${NAMESPACE} --kubeconfig ${KUBECONFIG} get pods | grep eric-oss-a1-policy-mgmt-svc
#kubectl --namespace ${NAMESPACE} --kubeconfig ${KUBECONFIG} get networkpolicy
sleep 60s