#!/usr/bin/env groovy
package pipeline

def testVersion
def cleaned

pipeline {
    agent {
        label "common_agents"
    }
     parameters {
        string(name: 'KUBECONFIG_FILE',
                description: 'Kubernetes configuration file to specify which environment to install on' )
        string(name: 'NAMESPACE',
                description: 'Namespace to install the EO Chart' )
        string(name: 'GAS_HOSTNAME',
                description: 'GAS_HOSTNAME_URL used for oran support application tesing' )
     }
    options { timestamps () }
    environment {
        BUILD_URL = "${env.JOB_URL}${env.BUILD_ID}/"
        TESTWARE_CLI_IMAGE="armdocker.rnd.ericsson.se/proj-eric-oss-dev-test/k6-reporting-tool-cli:latest"
    }
    stages {
        stage('Prepare') {
            steps {
                cleanWs()
            }
        }
        stage('Checkout') {
            steps {
                checkout([$class: 'GitSCM', branches: [[name: '*/master']], extensions: [[$class: 'CleanBeforeCheckout']], userRemoteConfigs: [[credentialsId: 'eoadm100-user-creds', url: 'https://gerrit-gamma.gic.ericsson.se/OSS/com.ericsson.oss.appEngineering/eric-oss-oran-support-app-engineering']]])
                sh "chmod +x -R ${env.WORKSPACE}"
            }
        }
        stage('K6 Testing') {
            steps {
                script {
                    withCredentials( [file(credentialsId: params.KUBECONFIG_FILE, variable: 'KUBECONFIG')]) {
                        sh "install -m 600 ${KUBECONFIG} ./admin.conf"
                        sh "./deployment/scripts/deployK6Pod.sh ${env.KUBECONFIG} ${env.NAMESPACE} ${env.BUILD_URL} ${env.GAS_HOSTNAME}"
                    }
                }
            }
        }
        stage('OS Query result') {
            parallel{
                stage('Copy Report') {
                    steps {
                        script {
                            withCredentials( [file(credentialsId: params.KUBECONFIG_FILE, variable: 'KUBECONFIG')]) {
                                sh "install -m 600 ${KUBECONFIG} ./admin.conf"
                                try {
                                    testVersion = sh(script: "kubectl --kubeconfig=${env.KUBECONFIG} -n ${env.NAMESPACE} exec eric-oss-oran-support-app-engineering -- sh -c 'echo \$TEST_VERSION'", returnStdout: true, label: 'Get testware version').trim()
                                    echo "Testware version: ${testVersion}"
                                    sh "kubectl get po -n ${env.NAMESPACE}"
                                } catch (Exception e) {
                                    echo "Warning: Failed to get testware version. Error: ${e.getMessage()}"
                                }
                                cleaned = sh "./deployment/scripts/copyK6Report.sh ${env.KUBECONFIG} ${env.NAMESPACE} ."
                            }
                        }
                    }
                }
                stage('Tail eric-oss-oran-support-app-engineering log') {
                    steps{
                        script {
                            withCredentials( [file(credentialsId: params.KUBECONFIG_FILE, variable: 'KUBECONFIG')]) {
                                sh "install -m 600 ${KUBECONFIG} ./admin.conf"
                                sh "sleep 90"
                                testVersion = sh(script: "kubectl --kubeconfig=${env.KUBECONFIG} -n ${env.NAMESPACE} exec eric-oss-oran-support-app-engineering -- sh -c 'echo \$TEST_VERSION'", returnStdout: true).trim()
                                sh "kubectl --kubeconfig=${env.KUBECONFIG} -n ${env.NAMESPACE} logs eric-oss-oran-support-app-engineering -f || exit 0"
                            }
                        }
                    }
                }
            }
        }
    }
    post {
        always {
            archiveArtifacts 'summary.json'
            archiveArtifacts 'oran_support_result.html'
            archiveArtifacts 'eric-oss-oran-support-app-engineering.log'
            publishHTML([allowMissing: true,
                alwaysLinkToLastBuild: true,
                keepAll: true,
                reportDir: '',
                reportFiles: 'oran_support_result.html',
                reportName: 'Report',
                reportTitles: ''])
            script {
                withCredentials( [file(credentialsId: params.KUBECONFIG_FILE, variable: 'KUBECONFIG')]) {
                    RPT_API_URL = sh(script: "kubectl --kubeconfig=${env.KUBECONFIG} get secrets/testware-resources-secret --template={{.data.api_url}} -n ${NAMESPACE} | base64 -d",
                        returnStdout: true)
                    RPT_GUI_URL = sh(script: "kubectl --kubeconfig=${env.KUBECONFIG} get secrets/testware-resources-secret --template={{.data.gui_url}} -n ${NAMESPACE} | base64 -d",
                        returnStdout: true)
                }
                TESTWARE_CLI_CMD = "docker run --rm -t --pull always -e RPT_API_URL=${RPT_API_URL} " +
                    "-e RPT_GUI_URL=${RPT_GUI_URL} -v ${WORKSPACE}:${WORKSPACE} "+
                    "--user `id -u`:`id -g` ${TESTWARE_CLI_IMAGE} testware-cli "
                def testwareOutput = sh(script: "${TESTWARE_CLI_CMD} get-status -u ${env.BUILD_URL} --path ${WORKSPACE}", returnStdout: true).trim()
                def outputMap = [:]

                def lines = testwareOutput.readLines()
                for (String line : lines) {
                    line = line.replaceAll("\u001B\\[[;\\d]*m", "").trim()
                    if (line.startsWith(">")) {
                        line = line.substring(1).trim()
                    }
                def (key, value) = line.split(/\s*:\s*/, 2)
                outputMap[key.trim()] = value.trim()
                }
                def passed = outputMap['passed'] == 'True'
                def reportLink = outputMap['reportLink']

                def htmlOutput = """
                 <table>
                    <tr>
                        <td><img src='${env.JENKINS_URL}static/2833d4bf/images/svgs/warning.svg' alt='Warning'></td>
                        <td><h2>Test Status</h2></td>
                    </tr>
                </table>
                <ul>
                    <li>Status: <span style="color: ${passed ? 'green' : 'red'};">${passed ? 'SUCCESSFUL' : 'FAILED'}</span></li>
                    <li><a href='${reportLink}'>Live Report Link</a></li>
                </ul>
                """
                if(currentBuild.description != null) {
                    currentBuild.description = currentBuild.description + htmlOutput
                } else {
                    currentBuild.description = htmlOutput
                }
                sh """
                    echo 'status=${passed}' > artifact.properties
                    echo 'jobDetailsUrl=${BUILD_URL}' >> artifact.properties
                    echo 'testVersion=${testVersion}' >> artifact.properties
                """
            }
            archiveArtifacts artifacts: 'artifact.properties', allowEmptyArchive: false
            script {
                withCredentials( [file(credentialsId: params.KUBECONFIG_FILE, variable: 'KUBECONFIG')]) {
                    sh "install -m 600 ${KUBECONFIG} ./admin.conf"
                    try {
                            sh "echo cleanup helm:"
                            sh "./deployment/scripts/cleanUp.sh ${env.KUBECONFIG} ${env.NAMESPACE} ."
                    } catch (Exception e) {
                        echo "Warning: Failed at cleanup. Error: ${e.getMessage()}"
                    }
                    sh "echo post jenkins ended"
                }
            }
        }
    }
}