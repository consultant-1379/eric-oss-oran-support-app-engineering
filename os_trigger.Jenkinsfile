import groovy.json.JsonOutput
pipeline {
    agent {
        label params.AGENT_LABEL
    }
    options {
      disableConcurrentBuilds()
      ansiColor('xterm')
    }
    parameters {
      string( name: 'AGENT_LABEL',
        defaultValue: 'evo_docker_engine',
        description: 'Specify the Jenkins agent label where the pipeline should be run')
    }
    stages {
        stage('Call Spinnaker Webhook') {
            steps {
            script {
                def json = JsonOutput.toJson(params)
                def post = new URL("https://spinnaker-api.rnd.gic.ericsson.se/webhooks/webhook/os_trigger").openConnection()
                post.setRequestMethod("POST")
                post.setDoOutput(true)
                post.setRequestProperty("Content-Type", "application/json")
                post.getOutputStream().write(json.getBytes("UTF-8"))
                def postRC = post.getResponseCode()
                if(postRC.equals(200)) {
                    println(post.getInputStream().getText())
                }
                else {
                    println(postRC)
                }
            }
            }
        }
    }
}