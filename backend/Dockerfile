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

RUN useradd --create-home --shell /bin/bash aplikasi

# Folder foto disiapkan di sini untuk keadaan tanpa volume. Kalau nanti volume
# permanen dipasang di /data, isinya akan tertimpa — dan itu ditangani skrip
# masuk.sh saat kontainer mulai.
RUN mkdir -p /data/unggahan && chown -R aplikasi:aplikasi /data

COPY --from=pembangun --chown=aplikasi:aplikasi /app/target/*.jar aplikasi.jar
COPY --chmod=755 masuk.sh /masuk.sh

# Sengaja TIDAK memakai USER di sini. Kontainer mulai sebagai root hanya untuk
# membenahi izin volume, lalu masuk.sh menurunkan haknya ke pengguna aplikasi
# sebelum Java dijalankan.
ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["/masuk.sh"]
