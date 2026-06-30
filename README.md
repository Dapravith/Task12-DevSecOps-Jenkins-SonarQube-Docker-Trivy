# Task 12: DevSecOps Pipeline with Jenkins, SonarQube, Trivy, and Docker

This project demonstrates a complete **DevSecOps CI/CD pipeline** for a simple Node.js microservice.

The pipeline uses:

- **GitHub** for source code management
- **Jenkins** for CI/CD automation
- **SonarQube** for static code analysis and Quality Gate
- **Trivy** for file-system and Docker image security scanning
- **Docker** for container build and deployment
- **AWS EC2 Ubuntu servers** for Jenkins and SonarQube hosting

---

## Project Goal

The goal is to build a pipeline that can automatically:

1. Clone source code from GitHub.
2. Check Node.js, npm, and Docker runtime availability.
3. Install project dependencies.
4. Run SonarQube code analysis.
5. Validate the SonarQube Quality Gate.
6. Run Trivy file-system scan.
7. Build a Docker image.
8. Run Trivy Docker image scan.
9. Deploy the NodeAPI microservice as a Docker container.
10. Verify the deployed API using a health check.

---

## Architecture

```text
Developer
   |
   v
GitHub Repository
   |
   v
Jenkins EC2 Server
   |
   |-- Clone source code
   |-- Install dependencies
   |-- Run SonarQube scanner
   |-- Wait for Quality Gate
   |-- Run Trivy file scan
   |-- Build Docker image
   |-- Run Trivy image scan
   |-- Deploy Docker container
   |-- Health check API
   |
   v
NodeAPI Docker Container

SonarQube EC2 Server
   |
   |-- Receives analysis report from Jenkins
   |-- Processes Quality Gate
   |-- Sends webhook result back to Jenkins
```

---

## Repository Structure

```text
Task12-DevSecOps-Jenkins-SonarQube-Docker-Trivy/
├── README.md
├── LICENSE
├── .gitignore
└── NodeAPI/
    ├── Dockerfile
    ├── Jenkinsfile
    ├── README.md
    ├── package.json
    ├── package-lock.json
    ├── sonar-project.properties
    └── src/
        ├── app.js
        ├── server.js
        ├── middlewares/
        └── routes/
```

---

## NodeAPI Overview

The `NodeAPI` application is a simple Express.js microservice.

### Main Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | API welcome response |
| GET | `/health` | API health check |
| GET | `/api/users` | List sample users |
| GET | `/api/users/:id` | Get user by ID |
| GET | `/api/products` | List sample products |
| GET | `/api/products/:id` | Get product by ID |

---

## Tech Stack

| Tool | Purpose |
|---|---|
| Node.js | Backend runtime |
| Express.js | API framework |
| Docker | Containerization |
| Jenkins | CI/CD pipeline automation |
| SonarQube | Code quality and security analysis |
| SonarScanner | Sends source code analysis to SonarQube |
| Trivy | Vulnerability, secret, and misconfiguration scanning |
| AWS EC2 | Cloud servers for Jenkins and SonarQube |

---

# Part 1: AWS EC2 Setup

## 1. Create Two EC2 Instances

Create two Ubuntu EC2 instances.

| Server | Purpose | Recommended Type | Ports |
|---|---|---|---|
| Jenkins EC2 | Jenkins, Node.js, Docker, Trivy pipeline runner | `t3.medium` | `22`, `8080`, `8000` |
| SonarQube EC2 | SonarQube server running in Docker | `t3.medium` or `t3.large` | `22`, `9000` |

---

## 2. Create Key Pair

Create a key pair in AWS EC2.

Example:

```text
task12-keypair.pem
```

Set local permission:

```bash
chmod 400 task12-keypair.pem
```

SSH into Jenkins EC2:

```bash
ssh -i task12-keypair.pem ubuntu@JENKINS_PUBLIC_IP
```

SSH into SonarQube EC2:

```bash
ssh -i task12-keypair.pem ubuntu@SONARQUBE_PUBLIC_IP
```

---

## 3. Configure Security Groups

### Jenkins EC2 Inbound Rules

| Type | Port | Source | Purpose |
|---|---:|---|---|
| SSH | `22` | Your IP | SSH access |
| Custom TCP | `8080` | Your IP and SonarQube EC2 IP | Jenkins UI and SonarQube webhook |
| Custom TCP | `8000` | Your IP or `0.0.0.0/0` | NodeAPI access |

### SonarQube EC2 Inbound Rules

| Type | Port | Source | Purpose |
|---|---:|---|---|
| SSH | `22` | Your IP | SSH access |
| Custom TCP | `9000` | Your IP and Jenkins EC2 IP | SonarQube UI and Jenkins access |

---

# Part 2: Jenkins EC2 Setup

## 4. Install Java and Jenkins

Run on Jenkins EC2:

```bash
sudo apt update
sudo apt install -y fontconfig openjdk-21-jre wget gnupg curl
java -version
```

Install Jenkins:

```bash
sudo mkdir -p /etc/apt/keyrings

sudo wget -O /etc/apt/keyrings/jenkins-keyring.asc \
  https://pkg.jenkins.io/debian-stable/jenkins.io-2026.key

echo "deb [signed-by=/etc/apt/keyrings/jenkins-keyring.asc] https://pkg.jenkins.io/debian-stable binary/" \
  | sudo tee /etc/apt/sources.list.d/jenkins.list > /dev/null

sudo apt update
sudo apt install -y jenkins
```

Start Jenkins:

```bash
sudo systemctl enable jenkins
sudo systemctl start jenkins
sudo systemctl status jenkins
```

Get Jenkins initial password:

```bash
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
```

Open Jenkins:

```text
http://JENKINS_PUBLIC_IP:8080
```

Install suggested plugins.

---

## 5. Install Jenkins Plugins

Go to:

```text
Manage Jenkins
→ Plugins
→ Available Plugins
```

Install:

```text
Git
Pipeline
SonarQube Scanner
Docker Pipeline
Blue Ocean optional
```

---

## 6. Install Docker on Jenkins EC2

Run:

```bash
sudo apt update
sudo apt install -y ca-certificates curl

sudo install -m 0755 -d /etc/apt/keyrings

sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  -o /etc/apt/keyrings/docker.asc

sudo chmod a+r /etc/apt/keyrings/docker.asc

sudo tee /etc/apt/sources.list.d/docker.sources <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
EOF

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

Start Docker:

```bash
sudo systemctl enable docker
sudo systemctl start docker
docker --version
```

Allow Jenkins to use Docker:

```bash
sudo usermod -aG docker jenkins
sudo usermod -aG docker ubuntu
sudo systemctl restart jenkins
```

Test Docker:

```bash
docker ps
docker run hello-world
```

If Docker permission still fails, reboot the EC2 server:

```bash
sudo reboot
```

---

## 7. Install Node.js and npm on Jenkins EC2

Run:

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg

curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -

sudo apt install -y nodejs
```

Check:

```bash
node -v
npm -v
```

Check as Jenkins user:

```bash
sudo -u jenkins node -v
sudo -u jenkins npm -v
```

Restart Jenkins:

```bash
sudo systemctl restart jenkins
```

---

# Part 3: SonarQube EC2 Setup

## 8. Install Docker on SonarQube EC2

SSH into SonarQube EC2:

```bash
ssh -i task12-keypair.pem ubuntu@SONARQUBE_PUBLIC_IP
```

Install Docker using the same Docker installation steps from Jenkins EC2.

Check:

```bash
docker --version
docker ps
```

---

## 9. Configure SonarQube System Requirements

SonarQube requires extra Linux host settings.

Run on SonarQube EC2:

```bash
sudo tee /etc/sysctl.d/99-sonarqube.conf <<EOF
vm.max_map_count=524288
fs.file-max=131072
EOF

sudo sysctl --system
```

Verify:

```bash
sysctl vm.max_map_count
sysctl fs.file-max
```

Expected:

```text
vm.max_map_count = 524288
fs.file-max = 131072
```

---

## 10. Run SonarQube with Docker

Create Docker volumes:

```bash
docker volume create sonarqube_data
docker volume create sonarqube_extensions
docker volume create sonarqube_logs
```

Run SonarQube:

```bash
docker run -d \
  --name sonarqube \
  --restart unless-stopped \
  -p 9000:9000 \
  -v sonarqube_data:/opt/sonarqube/data \
  -v sonarqube_extensions:/opt/sonarqube/extensions \
  -v sonarqube_logs:/opt/sonarqube/logs \
  sonarqube:community
```

Check:

```bash
docker ps
docker logs -f sonarqube
```

Open SonarQube:

```text
http://SONARQUBE_PUBLIC_IP:9000
```

Default login:

```text
Username: admin
Password: admin
```

Change the password after first login.

---

# Part 4: Jenkins and SonarQube Integration

## 11. Generate SonarQube Token

In SonarQube:

```text
User Profile
→ My Account
→ Security
→ Generate Token
```

Create token:

```text
Token Name: SonarQube-trivy-token
Type: Global Analysis Token
```

Copy the token value.

Important: the token value is shown only once.

---

## 12. Add Token to Jenkins Credentials

In Jenkins:

```text
Manage Jenkins
→ Credentials
→ System
→ Global credentials
→ Add Credentials
```

Use:

```text
Kind: Secret text
Secret: paste SonarQube token value
ID: SonarQube-trivy-token
Description: SonarQube token for Jenkins
```

---

## 13. Configure SonarQube Server in Jenkins

In Jenkins:

```text
Manage Jenkins
→ System
→ SonarQube servers
```

Add:

```text
Name: SonarQube-trivy-token
Server URL: http://SONARQUBE_PUBLIC_IP:9000
Server authentication token: SonarQube-trivy-token
Environment variables: checked
```

The name must match this Jenkinsfile value:

```groovy
SONARQUBE_SERVER = 'SonarQube-trivy-token'
```

---

## 14. Configure SonarScanner Tool in Jenkins

In Jenkins:

```text
Manage Jenkins
→ Tools
→ SonarQube Scanner installations
```

Add:

```text
Name: SonarScanner
Install automatically: checked
```

The name must match this Jenkinsfile value:

```groovy
SCANNER_HOME = tool 'SonarScanner'
```

---

## 15. Add SonarQube Webhook to Jenkins

This is required for the Jenkins `waitForQualityGate` stage.

In SonarQube:

```text
Administration
→ Configuration
→ Webhooks
→ Create
```

Use:

```text
Name: Jenkins Webhook
URL: http://JENKINS_PUBLIC_IP:8080/sonarqube-webhook/
```

Important:

- Use the Jenkins public IP, not the SonarQube IP.
- Use port `8080`.
- Keep the final `/`.

Test from SonarQube EC2:

```bash
curl -I http://JENKINS_PUBLIC_IP:8080
```

A `200 OK` or `403 Forbidden` response means SonarQube can reach Jenkins.

A timeout means the Jenkins EC2 security group is blocking port `8080`.

---

# Part 5: GitHub Project Setup

## 16. Clone the Repository Locally

```bash
git clone https://github.com/Dapravith/Task12-DevSecOps-Jenkins-SonarQube-Docker-Trivy.git
cd Task12-DevSecOps-Jenkins-SonarQube-Docker-Trivy
```

---

## 17. Run NodeAPI Locally

```bash
cd NodeAPI
npm install
npm start
```

The API runs on:

```text
http://localhost:8000
```

Test:

```bash
curl http://localhost:8000/health
```

Expected response:

```json
{
  "status": "UP",
  "service": "task12-nodeapi-microservice",
  "timestamp": "..."
}
```

---

## 18. Build and Run Docker Locally

Inside the `NodeAPI` folder:

```bash
docker build -t task12-nodeapi:v1 .
docker run -d --name task12-nodeapi-container -p 8000:8000 task12-nodeapi:v1
```

Test:

```bash
curl http://localhost:8000/health
```

Stop container:

```bash
docker stop task12-nodeapi-container
docker rm task12-nodeapi-container
```

---

# Part 6: Jenkins Pipeline

## 19. Jenkinsfile Location

The Jenkinsfile is located at:

```text
NodeAPI/Jenkinsfile
```

---

## 20. Pipeline Stages

The pipeline contains these stages:

```text
Clone from GitHub
→ Check Runtime
→ Check Project Structure
→ Install Dependencies
→ SonarQube Analysis
→ Quality Gate
→ Trivy File Scan
→ Build Docker Image
→ Trivy Image Scan
→ Run Docker Container
→ Health Check
→ Check Running Containers
```

---

## 21. Important Jenkinsfile Values

| Variable | Value | Purpose |
|---|---|---|
| `SONARQUBE_SERVER` | `SonarQube-trivy-token` | Jenkins SonarQube server name |
| `SONAR_PROJECT_KEY` | `task12-nodeapi-microservice` | SonarQube project key |
| `APP_DIR` | `NodeAPI` | Application folder |
| `IMAGE_NAME` | `task12-nodeapi` | Docker image name |
| `CONTAINER_NAME` | `task12-nodeapi-container` | Docker container name |
| `APP_PORT` | `8000` | Public host port |
| `CONTAINER_PORT` | `3000` | Internal container port used by pipeline |

Important note:

If your app runs internally on port `8000`, use `CONTAINER_PORT = '8000'`.
If your Jenkinsfile runs the container with `-e PORT=$CONTAINER_PORT`, make sure the Docker `HEALTHCHECK` and port mapping use the same internal port.

---

## 22. Create Jenkins Pipeline Job

In Jenkins:

```text
Dashboard
→ New Item
→ Pipeline
```

Use:

```text
Job name: DevSecOps pipeline trivy
Type: Pipeline
```

Then configure:

```text
Pipeline definition: Pipeline script from SCM
SCM: Git
Repository URL: https://github.com/Dapravith/Task12-DevSecOps-Jenkins-SonarQube-Docker-Trivy.git
Branch: main
Script Path: NodeAPI/Jenkinsfile
```

Save.

---

## 23. Run Jenkins Build

Click:

```text
Build Now
```

Expected final result:

```text
Finished: SUCCESS
```

---

# Part 7: Validation

## 24. Validate SonarQube Report

Open:

```text
http://SONARQUBE_PUBLIC_IP:9000
```

Go to the project:

```text
task12-nodeapi-microservice
```

Check:

```text
Quality Gate: Passed
Bugs
Vulnerabilities
Code Smells
Security Hotspots
```

---

## 25. Validate Trivy File Scan

In Jenkins console output, find:

```text
========== Trivy File Scan ==========
```

Expected result should show scan output for:

```text
package-lock.json
Dockerfile
```

---

## 26. Validate Trivy Image Scan

In Jenkins console output, find:

```text
========== Trivy Image Scan ==========
```

Expected result should show scan output for:

```text
task12-nodeapi:<BUILD_NUMBER>
```

---

## 27. Validate Docker Container

On Jenkins EC2:

```bash
docker ps
```

Expected:

```text
task12-nodeapi-container
```

Check logs:

```bash
docker logs task12-nodeapi-container
```

---

## 28. Test API with Curl

On Jenkins EC2:

```bash
curl http://localhost:8000/health
```

Expected:

```json
{
  "status": "UP",
  "service": "task12-nodeapi-microservice",
  "timestamp": "..."
}
```

---

## 29. Test API with Postman

Open Postman and send:

```text
GET http://JENKINS_PUBLIC_IP:8000/health
```

Expected:

```text
Status: 200 OK
```

---

# Part 8: Common Errors and Fixes

## Error: Docker command not found

Install Docker on the EC2 server.

```bash
docker --version
```

---

## Error: Docker permission denied

Fix:

```bash
sudo usermod -aG docker jenkins
sudo systemctl restart jenkins
sudo reboot
```

---

## Error: npm not found

Fix:

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
sudo systemctl restart jenkins
```

---

## Error: package.json not found

Reason:

```text
package.json is inside the NodeAPI folder.
```

Fix:

```groovy
dir("${APP_DIR}") {
    sh 'npm ci --no-audit --fund=false'
}
```

---

## Error: No tool named SonarScanner found

Fix in Jenkins:

```text
Manage Jenkins
→ Tools
→ SonarQube Scanner installations
```

Make sure the scanner name is exactly:

```text
SonarScanner
```

---

## Error: SonarQube installation does not match any configured installation

Fix in Jenkins:

```text
Manage Jenkins
→ System
→ SonarQube servers
```

Make sure the server name is exactly:

```text
SonarQube-trivy-token
```

---

## Error: Quality Gate timeout

Fix:

1. Add SonarQube webhook:

```text
http://JENKINS_PUBLIC_IP:8080/sonarqube-webhook/
```

2. Open Jenkins EC2 port `8080` from SonarQube EC2.

3. Keep this Jenkinsfile stage:

```groovy
stage('Quality Gate') {
    steps {
        timeout(time: 10, unit: 'MINUTES') {
            waitForQualityGate abortPipeline: true
        }
    }
}
```

---

## Error: API health check failed

Check container logs:

```bash
docker logs task12-nodeapi-container
```

Check port mapping:

```bash
docker ps
```

Make sure the app listens on the same internal port used by Docker.

Example:

```bash
-p 8000:3000 -e PORT=3000
```

or:

```bash
-p 8000:8000 -e PORT=8000
```

Use one style consistently.

---

# Part 9: Screenshot Checklist

Use these screenshots for assignment submission.

| Task | Screenshot Required |
|---:|---|
| 1 | Two EC2 instances: Jenkins and SonarQube |
| 2 | Jenkins installed and accessible on port `8080` |
| 3 | SonarQube running in Docker on port `9000` |
| 4 | SonarQube webhook to Jenkins |
| 5 | Jenkins SonarQube credentials and server config |
| 6 | SonarScanner tool config in Jenkins |
| 7 | GitHub repository with NodeAPI code |
| 8 | Full Jenkins declarative pipeline script |
| 9 | Manual Jenkins build result |
| 10 | SonarQube project report |
| 11 | Trivy file scan output |
| 12 | Dockerfile and Docker build output |
| 13 | Trivy image scan output |
| 14 | Docker container running on EC2 |
| 15 | Jenkins pipeline graph with green stages |
| 16 | Postman API response |

---

# Final Pipeline Flow

```text
GitHub
→ Jenkins
→ SonarQube Analysis
→ Quality Gate
→ Trivy File Scan
→ Docker Build
→ Trivy Image Scan
→ Docker Run
→ Health Check
→ Postman Test
```

---

## Final Result

After successful implementation, the API should be accessible at:

```text
http://JENKINS_PUBLIC_IP:8000/health
```

Expected response:

```json
{
  "status": "UP",
  "service": "task12-nodeapi-microservice",
  "timestamp": "..."
}
```

---

## Conclusion

This project completes a basic but practical DevSecOps workflow. It combines CI/CD automation, code quality analysis, security scanning, Docker image creation, vulnerability scanning, container deployment, and API validation.

This workflow helps detect code issues, dependency vulnerabilities, Docker misconfigurations, and deployment problems earlier in the development lifecycle.
