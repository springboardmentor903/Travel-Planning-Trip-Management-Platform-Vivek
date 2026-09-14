# Build stage
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app

# Copy pom.xml and source code to build the application
COPY pom.xml .
COPY src ./src

# Build the executable JAR without running tests
RUN mvn clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

# Run as non-root user for security
RUN groupadd -r spring && useradd -r -g spring spring
USER spring:spring

# Copy built JAR from the build stage
COPY --from=build --chown=spring:spring /app/target/*.jar app.jar

# Support Render dynamic PORT environment variable (default to 8080 if not set)
ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java -Dserver.port=${PORT:-8080} -jar app.jar"]
