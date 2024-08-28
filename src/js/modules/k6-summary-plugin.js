import http from 'k6/http';
import { sleep } from 'k6';

export function publishSummary(data, opts = {}) {

    let thresholdCounters = getThresholdCounters(data)
    let useCasesResult = getUseCases(data.root_group.groups)

    let summary = {
        "totalUseCases": useCasesResult.totalUseCases,
        "totalMissingUCImplementation": useCasesResult.totalMissingUCImplementation,
        "completionTime": Date.now(),
        "requests": data.metrics.http_reqs.values.count,
        "failedRequests": data.metrics.http_req_failed.values.passes,
        "requestRate": data.metrics.http_reqs.values.rate,
        "thresholds": thresholdCounters.total,
        "failedThresholds": thresholdCounters.failed,
        "assertions": data.metrics.checks.values.passes + data.metrics.checks.values.fails,
        "failedAssertions": data.metrics.checks.values.fails,
        "iterations": data.metrics.iterations.values.count,
        "iterationsRate": data.metrics.iterations.values.rate,
        "startTime": opts.startTime,
        testContext: {
            executionId: opts.uuid
        },
        useCases: useCasesResult.useCases,
        metrics: getMetrics(data.metrics)
    }

    if (data.metrics.vus != null) {
        summary["minVirtualUsers"] = data.metrics.vus.values.min
        summary["maxVirtualUsers"] = data.metrics.vus.values.max
    }


    // Write operations on the database happen async, so we need to give a few seconds before processing.
    sleep(3)
    postSummary(summary, opts.reportingToolURL)

    return "\nSummary posted to InfluxDB: "+ JSON.stringify(summary);
}

function postSummary(summary, baseUrl) {
    let response = http.post(baseUrl+ "/api/v1/summary", JSON.stringify(summary), {
        "headers": {
            "Content-Type": "application/json"
        },
        "responseType": "text"
    })

    console.log("POST "+ baseUrl+ "/api/v1/summary -> status: "+ response.status)
}

function getMetrics(metrics) {
    let result = []

    Object.entries(metrics).forEach(item => {
        if (item[1].type !== "trend") {
            console.log("Metric "+  item[0] +" uses an unsupported type: "+ item[1].type)
        } else {
            let metric = {
                name: item[0],
                type: item[1].type.toUpperCase(),
                values: item[1].values
            }
            if (item[1].thresholds != null) {
                let thresholdStatus = {}
                let thresholdDef = {}
                Object.entries(item[1].thresholds).forEach(t => {
                    let splitted = t[0].split("<")
                    thresholdStatus[splitted[0]] = t[1].ok
                    thresholdDef[splitted[0]] = "<"+splitted[1]
                    metric.thresholdsStatus = thresholdStatus
                    metric.thresholdsDefinition = thresholdDef
                })
            }
            result.push(metric)
        }
    })

    return result
}

function getUseCases(groups) {

    let result = {
        totalUseCases: 0,
        totalMissingUCImplementation: 0,
        totalMissingUCKPIs: 0,
        useCases: []
    }

    for (let i in groups) {
        result.totalUseCases++

        let stepsResult = getSteps(groups[i].groups);
        let useCase = {
            name: groups[i].name,
            path: groups[i].path,
            type: "USE_CASE",
            assertions: getAssertions(groups[i].checks),
            steps: stepsResult.steps
        }

        // If there are no checks in use case and step levels then implementation is missing
        if (useCase.assertions.length === 0 && !stepsResult.hasChecks) {
            result.totalMissingUCImplementation++
        }

        result.useCases.push(useCase)
    }

    return result
}

function getAssertions(assertionsList) {

    let result = []
    for (let i in assertionsList) {
        console.debug("Node -> "+ assertionsList[i])
        let assertion = {
            name: assertionsList[i].name,
            path: assertionsList[i].path,
            passes: assertionsList[i].passes,
            fails: assertionsList[i].fails
        }
        result.push(assertion)
    }

    return result;
}

function getSteps(stepsList) {

    let result = {
        steps: [],
        hasChecks: false
    }
    for (let i in stepsList) {
        let step = {
            name: stepsList[i].name,
            path: stepsList[i].path,
            type: "STEP",
            order: i,
            assertions: getAssertions(stepsList[i].checks)
        }
        if (step.assertions.length > 0) {
            result.hasChecks = true
        }
        result.steps.push(step)
    }
    return result
}

function getThresholdCounters(data) {
    let thresholdFailures = 0;
    let thresholdCount = 0;
    for (let metricName in data.metrics) {
        if (data.metrics[metricName].thresholds) {
            thresholdCount++;
            let thresholds = data.metrics[metricName].thresholds;
            for (let thresName in thresholds) {
                if (!thresholds[thresName].ok) {
                    thresholdFailures++;
                }
            }
        }
    }

    return {total: thresholdCount, failed: thresholdFailures}
}


