# Running your Tests Locally

To run the tests you can run:

```shell
./gradlew run
```

This will create and run a container based on the K6 base image mapping your source to /src and resources to /resources 

> This is just a basic example. In reality most tests will require additional variables or arguments so you need to customize this task to fit your needs.

Example: Lets say you need to provide a baseUrl environment variable
```groovy
task createQuickRunContainer(type: DockerCreateContainer) {
    group = "run"
    description = "creates a container to run the K6 tests"

    containerName = "${rootProject.name}-run"
    imageId = defaultDockerTag
    envVars = ["baseUrl": "http://localhost/api"]
    hostConfig.autoRemove = true
}
```

For more information on the supported configuration, check the [plugin documentation](https://bmuschko.github.io/gradle-docker-plugin/api/com/bmuschko/gradle/docker/tasks/container/DockerCreateContainer.html).