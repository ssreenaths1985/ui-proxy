
node() {
    try {
        String ANSI_GREEN = "\u001B[32m"
        String ANSI_NORMAL = "\u001B[0m"
        String ANSI_BOLD = "\u001B[1m"
        String ANSI_RED = "\u001B[31m"
        String ANSI_YELLOW = "\u001B[33m"

        ansiColor('xterm') {
            stage('Checkout') {
                cleanWs()
                checkout scm
                }
        }
            stage('docker-pre-Build') {
              sh '''
              cd $docker_file_path
              pwd
              docker build -f ./Dockerfile.build -t $docker_pre_build .
              docker run --name=$docker_pre_build $docker_pre_build && docker cp $docker_pre_build:/usr/src/app/dist.zip .
              sleep 30
              docker rm -f $docker_pre_build
              docker rmi -f $docker_pre_build
              unzip dist.zip              
                '''
        }
      
  /*            stage('SonarQube analysis') {
               
                  sh 'cd $docker_file_path && npm install'
             
   			 // requires SonarQube Scanner 2.8+
   				 def scannerHome = tool 'sonar_scanner';
   				 withSonarQubeEnv('sonarqube') {
    					   sh '''
                   cd $docker_file_path && pwd && /var/lib/jenkins/tools/hudson.plugins.sonar.SonarRunnerInstallation/sonar_scanner/bin/sonar-scanner
                 '''
    			 }
  	}
  stage("Quality Gate") {
  
    timeout(time: 1, unit: 'HOURS') {       // Just in case something goes wrong, pipeline will be killed after a timeout
  		 def qg = waitForQualityGate() // Reuse taskId previously collected by withSonarQubeEnv
   		 if (qg.status != 'OK') {
    		error "Pipeline aborted due to quality gate failure: ${qg.status}"
   					}
  
  }
}  */

            stage('docker-build') {
                sh '''
                   commit_id=$(git rev-parse --short HEAD)
                   echo $commit_id> commit_id.txt
                   cd $docker_file_path
                   pwd
                   docker build -f Dockerfile -t $docker_server/$docker_repo:$commit_id .
                   docker tag $docker_server/$docker_repo:$commit_id $docker_server/$docker_repo:$image_tag
                   '''
        }

         stage('docker-push') {

               sh '''
                  pwd
                  commit_id=$(git rev-parse --short HEAD)
                  docker push $docker_server/$docker_repo:$commit_id
                  docker push $docker_server/$docker_repo:$image_tag
                  docker rmi -f $docker_server/$docker_repo:$commit_id
                  docker rmi -f $docker_server/$docker_repo:$image_tag
                  rm -rf dist
                  rm -rf dist.zip

                  '''

                    }
                 }
    catch (err) {
        currentBuild.result = "FAILURE"
        throw err
    }

}
 
