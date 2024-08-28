#!/bin/bash
KUBECONFIG=$1
NAMESPACE=$2

k6 run --summary-export config1.json getConfig.js
beforeScheduleCheck=$(python3 beforeReschedule.py)
echo "Number of check points passed before rescheduling: ${beforeScheduleCheck}"
pod=($(kubectl --kubeconfig ${KUBECONFIG} get pods --namespace ${NAMESPACE} -o=name|grep eric-oss-a1-policy-mgmt-svc))
IFS='/' read -ra name <<< "$pod"
c=0
for i in "${name[@]}"; do
    var[c++]="$i"
done
podName=${var[1]}
echo "Pod to be rescheduled: ${podName}"

podNode=($( kubectl --kubeconfig ${KUBECONFIG} get pods  ${podName} -o wide --namespace ${NAMESPACE}))
for i in "${podNode[@]}"
do
   if [[ $i == *"node-"* ]]; then
     nodeName="$i"
   fi
done

clusterNodes=($(kubectl --kubeconfig ${KUBECONFIG} get nodes -o=name))
for i in "${clusterNodes[@]}"
do
   if [[ $i != *${nodeName}* ]]; then
     currentNodeName="$i"
     break
   fi
done
echo ${currentNodeName}
echo "Pod is running on: ${nodeName}"

IFS='/' read -ra change <<< "$currentNodeName"
c=0
for i in "${change[@]}"; do
    var[c++]="$i"
done
ASSIGNNODE=${var[1]}
#val="\"$ASSIGNNODE\""
#echo $val
echo "Pod is getting rescheduling to: ${ASSIGNNODE}"

kubectl --kubeconfig=${KUBECONFIG} -n ${NAMESPACE} patch deployment eric-oss-a1-policy-mgmt-svc --patch '{"spec": {"template": {"spec": {"nodeSelector": {"kubernetes.io/hostname": "'$ASSIGNNODE'"}}}}}'

sleep 120s
k6 run --summary-export config2.json getConfig.js
afterScheduleCheck=$(python3 afterReschedule.py)
echo "Number of check points passed after rescheduling: ${afterScheduleCheck}"
if [ $beforeScheduleCheck == $afterScheduleCheck ]; then
    echo "Move between workers scenario is passed"
fi

sleep 30s
pod=($(kubectl --kubeconfig ${KUBECONFIG} get pods --namespace ${NAMESPACE} -o=name|grep eric-oss-a1-policy-mgmt-svc))
IFS='/' read -ra name <<< "$pod"
c=0
for i in "${name[@]}"; do
    var[c++]="$i"
done
podName=${var[1]}
kubectl delete pod ${podName} -n ${NAMESPACE}
k6 run --summary-export endPointCheck.json getPolicies.js
endPointCheck=$(python3 checkEndPoint.py)
echo "Number of check points failed after pod is deleted: ${endPointCheck}"
if [ $endPointCheck == 2 ]; then
    echo "SIGTERM/SIGKILL scenario is passed"
fi
sleep 60s