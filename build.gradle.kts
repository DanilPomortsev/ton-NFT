tasks.register<GradleBuild>("backendRun") {
    group = "application"
    description = "Run Kotlin backend from root directory"
    dir = file("backend-kotlin")
    tasks = listOf("bootRun")
}

tasks.register<GradleBuild>("run") {
    group = "application"
    description = "IDE-friendly alias to run backend from root"
    dir = file("backend-kotlin")
    tasks = listOf("bootRun")
}
