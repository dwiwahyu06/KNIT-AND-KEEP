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

# Folder foto disiapkan selagi masih root, lalu diserahkan ke pengguna aplikasi.
#
# Tanpa ini aplikasi menolak menyala di server: UNGGAHAN_FOLDER menunjuk
# /data/unggahan, sedangkan pengguna biasa tidak boleh membuat folder di akar
# sistem berkas. Akibatnya kontainer berjalan tetapi aplikasinya mati, dan
# pemeriksaan kesehatan gagal tanpa penyebab yang kelihatan.
#
# Di Railway atau Render, volume permanen dipasang tepat di /data — jadi
# folder ini menjadi titik pasangnya, dan isinya bertahan antar pembaruan.
RUN mkdir -p /data/unggahan && chown -R aplikasi:aplikasi /data

# Jar disalin dengan kepemilikan yang benar, supaya tetap terbaca setelah
# berganti pengguna.
COPY --from=pembangun --chown=aplikasi:aplikasi /app/target/*.jar aplikasi.jar

USER aplikasi

# Layanan hosting biasanya menentukan sendiri porta lewat variabel PORT.
ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "aplikasi.jar"]
