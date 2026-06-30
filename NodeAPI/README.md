# Task 12 NodeAPI Microservice

Simple Node.js Express microservice for a DevSecOps pipeline using:

- GitHub
- Jenkins
- SonarQube
- Trivy
- Docker

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | API welcome message |
| GET | `/health` | Health check |
| GET | `/api/users` | List users |
| GET | `/api/users/:id` | Get user by ID |
| GET | `/api/products` | List products |
| GET | `/api/products/:id` | Get product by ID |

## Run Locally

```bash
npm install
npm start
```

Open:

```bash
http://localhost:3000
http://localhost:3000/health
```

## Run with Docker

```bash
docker build -t task12-nodeapi:v1.0 .
docker run -d --name task12-nodeapi-container -p 3000:3000 task12-nodeapi:v1.0
```

Test:

```bash
curl http://localhost:3000/health
```

## Jenkins Setup Notes

Before running the pipeline, update this line inside `Jenkinsfile`:

```groovy
url: 'git@github.com:Dapravith/Task12-DevSecOps-Jenkins-SonarQube-Docker-Trivy.git'
```

Also make sure Jenkins has:

- Docker installed
- Jenkins user added to Docker group
- SonarQube Scanner configured as `SonarScanner`
- SonarQube server configured as `SonarQube-Server`
- SonarQube webhook configured as:

```text
http://JENKINS_PUBLIC_IP:8080/sonarqube-webhook/
```

## Postman Test

Use:

```text
GET http://JENKINS_PUBLIC_IP:3000/health
```

Expected response:

```json
{
  "status": "UP",
  "service": "task12-nodeapi-microservice",
  "timestamp": "..."
}
```


## GitHub Repository

SSH:

```bash
git@github.com:Dapravith/Task12-DevSecOps-Jenkins-SonarQube-Docker-Trivy.git
```

HTTPS:

```bash
https://github.com/Dapravith/Task12-DevSecOps-Jenkins-SonarQube-Docker-Trivy.git
```
