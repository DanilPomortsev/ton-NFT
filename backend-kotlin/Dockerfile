# Сборка (Debian: gradlew + libc без сюрпризов Alpine)
FROM eclipse-temurin:17-jdk-jammy AS build
WORKDIR /app

COPY gradlew settings.gradle.kts build.gradle.kts ./
COPY gradle ./gradle
COPY src ./src

RUN chmod +x ./gradlew \
    && ./gradlew bootJar --no-daemon -x test

# Запуск
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

RUN groupadd --system --gid 1001 app && useradd --system --uid 1001 --gid app app
COPY --from=build /app/build/libs/app.jar /app/app.jar
RUN chown -R app:app /app
USER app

EXPOSE 8080
ENV PORT=8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
