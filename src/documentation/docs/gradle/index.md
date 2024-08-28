# Introduction to Testware Build

To facilitate the build, deploy and run activities we have produced a [Gradle](https://gradle.org/) build to be reused and customized for our staging repositories.

## Why Gradle?

Gradle is a widely used open source build tool with a rich [library of plugins](https://plugins.gradle.org/) to provide common build tasks like managing containers, releasing versions, etc...

Gradle is not platform dependent and even tough uses groovy as primary language, it can be used to build different types of development packages such as node, python, kotlin, etc...

## Gradle Wrapper

[Gradle Wrapper](https://docs.gradle.org/current/userguide/gradle_wrapper.html) provides a handy way to setup the build requirements. 

You don't need to have a build installation in your local (or CI) environment to run the build. The only pre-requisite is a JVM.

You can run any task in your build using the gradlew script provided at the root of this repository.

```shell
./gradlew build
```

When running for the first time the script will download a copy of gradle and prepare it fot the build run.

## Tasks

Each activity in the build is created as a separate task, and each task can have it's dependencies.

E.g.: To push a docker image we need to build it first, so we can declare a dependency between the tasks.
This means when running push, a build will be triggered first

```groovy
task build() {
  ...
}

task push(dependsOn: build) {
  ...
}
```

## Structure

### build.gradle

It's our main build file which imports all other modules. 

#### gradle.properties

Common properties file used by the gradle build. Contains the groupId and project version.

```properties
group = 'com.ericsson.oss.internaltools'
version=1.0.3-SNAPSHOT
```

#### settings.gradle

Settings file with common configuration for the build. Contains the project name

```groovy
rootProject.name = 'eric-oss-oran-support'
```

### Modules

To keep the build files small and easier to read and understand, a feature grouping structure was defined.

The tasks implementation is separated into different files according to it's grouping and then imported in the main build file.

Each task can still be called from the main build file. 


