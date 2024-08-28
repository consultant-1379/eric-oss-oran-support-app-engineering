# Updating an existent repository

This guide provides a step by step approach of how to update an existent staging repository to enable reporting, PCR and Publish.

## Pre Requisites

1) You need to order PCR (pre code review) and Publish jenkins jobs before starting this work. 

   This is a [sample ticket](https://jira-oss.seli.wh.rnd.internal.ericsson.com/browse/IDUN-37383) created for the K6 sample.

2) Your testware needs to be using the latest version of K6 base image

3) Your local environment should have Java 11 installed

## Steps

### Update your Dockerfile

1) Make sure you are using the latest version of K6 base image

```dockerfile
FROM armdocker.rnd.ericsson.se/proj-eric-oss-drop/eric-oss-oran-support-app-engineering:latest
```

2) Include a **version** build argument and set an environment variable **TESTWARE_VERSION** to it's value
```dockerfile
ARG version
ENV TESTWARE_VERSION=$version
```

3) Set the default values for APP_NAME, PRODUCT and STAGING_TYPE
```dockerfile
# APPLICATION for app staging repository, or PRODUCT for a product staging repository
ENV STAGING_TYPE="APPLICATION"

# The application name (artifactId of the application repository). Only applicable for application staging repositories
ENV APP_NAME="eric-oss-oran-support"

# The product name (artifactId of the product integration chart repository).
ENV PRODUCT="eric-oss-eiap"
```

4) Make sure you have your code and resources in the exoected folders
```dockerfile
ADD js/ /tests
ADD resources/ /resources
```

5) **IMPORTANT**: Do not override the CMD or ENTRYPOINT. The base image produces a command line with all tags required for reporting.  If you override the command, you will lose those and the report will not work.

Full sample:

```dockerfile
FROM armdocker.rnd.ericsson.se/proj-eric-oss-drop/eric-oss-oran-support-app-engineering:latest

ARG version

# This should match the version of the image being published in the repository.
# Do not use "latest" as testware version
ENV TESTWARE_VERSION=$version

# Defines the staging type on which the container will run
# The default value here is APPLICATION, but if the test is reused in a different loop the env var
# should be set with the new value at runtime
ENV STAGING_TYPE="APPLICATION"

# The application under test. This shuld be immutable
ENV APP_NAME="eric-oss-oran-support"

ADD js/ /tests
ADD resources/ /resources
```

### Create a chart source code

1) Create a folder deployment/chart/main

2) Copy the deployment/chart/main contents from the [eric-oss-oran-support](https://gerrit.ericsson.se/plugins/gitiles/OSS/com.ericsson.oss.internaltools/eric-oss-oran-support/+/refs/heads/master/deployment/chart/main) repository to your project.

3) Update values.yaml **STAGING_TYPE** to **PRODUCT** if the repository if product staging, otherwise skip to the next step
```yaml
env:
  ...
  STAGING_TYPE: "APPLICATION"
```
4) Update Chart.yaml description
```yaml
description: Testware for application <your app name>
```

5) Feel free to modify the chart to your needs (e.g. add additional environment variables needed for your tests)

### Create a sample documentation

1) Create a folder src/documentation
2) Create a file src/documentation/mkdocs.yaml with the following content

```yaml
site_name: <Your Application Name. E.g. Application Manager>
copyright: Copyright &copy; 2022 Ericsson AB - All Rights Reserved

use_directory_urls: false
site_dir: /site/docs

theme:
  name: material
  logo: img/ericsson_econ.svg
  favicon: img/favicon.ico
  font: false
  custom_dir: overrides
  features:
    - navigation.instant
    - navigation.sections

extra_css:
  - css/extra.css

extra_javascript:
  - javascript/extra.js

markdown_extensions:
  - attr_list
  - md_in_html

extra:
  generator: false

plugins:
  - search
  - glightbox
  - build_plantuml:
      render: "local"
      bin_path: "/usr/bin/plantuml"
      output_format: "svg"
      diagram_root: "docs/diagrams"
      output_folder: "gen"
      input_folder: "src"
      input_extensions: "puml"

nav:
  - Home: 'index.md'

```
3) Create a file src/documentation/Dockerfile with the following content:
```dockerfile
FROM python:3.9-alpine

COPY . /src
WORKDIR /src

RUN pip install mkdocs mkdocs-material mkdocs-build-plantuml-plugin mkdocs-glightbox
RUN mkdir -p /site/docs

CMD mkdocs build
```

4) Create a file src/documentation/docs/index.md with the following template (feel free to start documenting your repository here)
```markdown
# Your Application Name

Your documentation starts here
```

5) Copy from [eric-oss-oran-support](https://gerrit.ericsson.se/plugins/gitiles/OSS/com.ericsson.oss.internaltools/eric-oss-oran-support/+/refs/heads/master/src/documentation) the following files/folders

* docs/css

* docs/javascript

* docs/img

* overrides

### Copy and configure the gradle files

1) Copy from [eric-oss-oran-support](https://gerrit.ericsson.se/plugins/gitiles/OSS/com.ericsson.oss.internaltools/eric-oss-oran-support/+/refs/heads/master/) the following files/folders

* gradle (folder)

* build.gradle

* gradle.properties

* gradlew

* gradlew.bat

* settings.gradle

2) Make sure to add the following to your .gitignore

```gitignore
# Version file used by ADP. This is auto generated by the build
VERSION_PREFIX

# Gradle wrapper files from local build
.gradle

# Gradle build folder
build

# Files generated by Bob
.bob*
bob
artifact.properties
```

3) Edit gradle.properties and reset the version to 1.0.1-SNAPSHOT and groupId to your repository groupId
```properties
group = 'com.ericsson.oss.internaltools'
version=1.0.1-SNAPSHOT
```
4) Edit gradle.setting and update the project name to your testware repository artifactId
```groovy
rootProject.name = 'eric-oss-oran-support'
```

5) Now to test your build try to generate the documentation:
```shell
./gradlew buildDocumentation
```

6) Your documentation should be created at **build/generated_docs**

### Update your testware code

1) Update your main.js file to add:

Import the publishSummary module
```js
import { publishSummary } from "/modules/plugins/k6-summary-plugin/k6-summary-plugin.js"
```

Get the start time of your testware run. Add this before your test methods (init phase)
```js
const startTime = Date.now();
```

Get the variables created by the K6 Base Image. Add this before your test methods (init phase)
```js
// Set the UUID generated by the K6 image as a constant to be used in your code.
const UUID = `${__ENV.UUID}`;
//Set the API url used to publish results to the K6 Reporting Tool
const K6_API_URL = `${__ENV.K6_API_URL}`;
```

Call publishSummary on the **handleSummary** callback.
```js
export function handleSummary(data) {
    console.log('Preparing the end-of-test summary...');
    return {
        //This plugin is responsible to push the summary data to the Reporting Tool API
        'stdout': publishSummary(data, {uuid: UUID, startTime: startTime,
            reportingToolURL: K6_API_URL}),
    }
}
```

2) If you have any tag defined in the options file or constant, you need to move it to ADDITIONAL_ARGS environment variable.

```js
const options = {
    tags: {
        my_tag: "value"
    }
}
```

Should move to an environment variable at your K6 run (Dockerfile and chart)

```shell
ADDITIONAL_ARGS=" --tag my_tag=value"
```

3) Replace the constant options by a file resources/config/default.options.json

```json
{
  "scenarios": {
    "scenario_01": {
      "exec": "scenario01",
      "executor": "shared-iterations",
      "vus": 3,
      "iterations": 25
    },
    "scenario_02": {
      "exec": "scenario02",
      "executor": "shared-iterations",
      "vus": 3,
      "iterations": 15
    }
  },
  "thresholds": {
    "http_reqs{expected_response:true}": ["rate>10"],
    "Non Legacy Pass Rate": ["rate>0.9"],
    "K6 Test API duration": ["avg<10","max<30"]
  }
}
```

This makes your run much more flexible as you can use different options files for each situation.

> This is important to allow your testware to be used in different loops.
>
> E.g: We might have different load and KPIs being validated in application, product and release stages.

### Configure your ruleset (bob)

1) Create a file ruleset2.0.yaml at the root of your project

2) Copy the contents from [eric-oss-oran-support](https://gerrit.ericsson.se/plugins/gitiles/OSS/com.ericsson.oss.internaltools/eric-oss-oran-support/+/refs/heads/master/ruleset2.0.yaml)

3) Update the properties to match your repository
```yaml
properties:
  - docker-image-name: eric-oss-oran-support
  - image-title: "eric-oss-oran-support"
  # product or application
  - staging: application
```

### Configure your Pre Code Review Jenkinsfile

1) Copy the file [precodereview.Jenkinsfile](https://gerrit.ericsson.se/plugins/gitiles/OSS/com.ericsson.oss.internaltools/eric-oss-oran-support/+/refs/heads/master/precodereview.Jenkinsfile)

### Configure your Publish Jenkinsfile

1) Copy the file [publish.Jenkinsfile](https://gerrit.ericsson.se/plugins/gitiles/OSS/com.ericsson.oss.internaltools/eric-oss-oran-support/+/refs/heads/master/publish.Jenkinsfile)

### Testing your changes

1) Generate the docker image

````shell
./gradlew clean build
````

2) Run the following command to check if the image was created locally

```shell
docker images | grep k6-quick-start
```

> Remenber to replace k6-quick-start with your own artifactId

You should see your image available in the list
```shell
armdocker.rnd.ericsson.se/proj-eric-oss-drop/eric-oss-oran-support                 1.0.4                  d8864d30e444   22 hours ago        34.9MB
```

3) Create the Helm Chart

```shell
./gradlew helmPackage
```

Your helm charts should be created at **build/helm/charts**

```shell
ls build/helm/charts

eric-oss-oran-support           eric-oss-oran-support-1.0.4.tgz
```
