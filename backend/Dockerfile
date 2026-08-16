# Tahap 1 — bangun jar.
# Dependency diunduh di lapisan terpisah supaya build berikutnya jauh lebih cepat
# selama pom.xml tidak berubah.
FROM maven:3.9-eclipse-temurin-17 AS pembangun
WORKDIR /app
COPY pom.xml .
RUN mvn -B dependency:go-offline
COPY src ./src
RUN mvn -B clean package -DskipTests

# Tahap 2 — jalankan. Hanya jar yang ikut, jadi image akhirnya kecil.
FROM eclipse-temurin:17-jre
WORKDIR /app

# Berjalan sebagai pengguna biasa, bukan root.
RUN useradd --create-home --shell /bin/bash aplikasi
USER aplikasi

COPY --from=pembangun /app/target/*.jar aplikasi.jar

# Layanan hosting biasanya menentukan sendiri porta lewat variabel PORT.
ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "aplikasi.jar"]
