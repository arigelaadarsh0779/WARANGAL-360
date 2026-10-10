# ============================================
# WARANGAL 360 — Backend Dockerfile (Spring Boot 3)
# Multi-stage Docker build for optimized image size
# ============================================

# Stage 1: Build the Maven application
FROM maven:3.9.6-eclipse-temurin-17-alpine AS build
WORKDIR /app

# Copy pom.xml and download dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and package application
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Runtime image with Java 17 JRE
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Create directory for report image uploads
RUN mkdir -p /app/uploads

# Copy compiled JAR artifact from build stage
COPY --from=build /app/target/cityfix-backend-1.0.0.jar app.jar

# Expose Spring Boot port
EXPOSE 8080

# Configure container healthcheck
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

# Launch Spring Boot application
ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
