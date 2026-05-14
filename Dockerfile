# Корневой Dockerfile для Render: репо с package.json в корне — иначе Render выбирает Node без JAVA_HOME.
# В настройках сервиса: Environment = Docker, Dockerfile Path = Dockerfile, Root Directory = (пусто).

FROM eclipse-temurin:17-jdk-jammy AS build
WORKDIR /app

COPY backend-kotlin/gradlew backend-kotlin/settings.gradle.kts backend-kotlin/build.gradle.kts ./
COPY backend-kotlin/gradle ./gradle
COPY backend-kotlin/src ./src

RUN chmod +x ./gradlew \
    && ./gradlew bootJar --no-daemon -x test

FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

RUN groupadd --system --gid 1001 app && useradd --system --uid 1001 --gid app app
COPY --from=build /app/build/libs/app.jar /app/app.jar
RUN chown -R app:app /app
USER app

EXPOSE 8080
ENV PORT=8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
