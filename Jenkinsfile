
pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Verify Repository') {
            steps {
                echo 'Social Cup repository checked out successfully!'
                echo 'Automatic trigger test!'
                echo 'Second automatic trigger test!'
                bat 'dir'
            }
        }
    }
}


