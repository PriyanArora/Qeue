FROM maven:3.9.9-eclipse-temurin-21 AS builder

WORKDIR /app

COPY pom.xml .

RUN mvn dependency:go-offline -B

COPY src ./src

RUN mvn clean package -DskipTests

FROM eclipse-temurin:21-jre AS runner

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder ./app/target/registration-service-0.0.1-SNAPSHOT.jar ./app.jar

EXPOSE 4002
EXPOSE 9001

HEALTHCHECK --interval=10s --timeout=5s --retries=10 CMD curl -fsS http://localhost:4002/api/internal/health || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]
