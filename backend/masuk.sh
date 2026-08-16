#!/bin/sh
# Titik masuk kontainer.
#
# Volume permanen dipasang layanan hosting saat kontainer mulai, dan
# pemiliknya root. Folder yang sudah disiapkan saat image dibangun tertimpa
# oleh volume itu, sehingga aplikasi yang berjalan sebagai pengguna biasa
# kehilangan izin menulis — dan berhenti dengan "Tidak bisa menyiapkan folder
# unggahan" sebelum sempat melayani apa pun.
#
# Karena itu kontainer mulai sebagai root, membenahi izinnya, lalu MENURUNKAN
# haknya ke pengguna aplikasi. Aplikasi Java-nya sendiri tidak pernah berjalan
# sebagai root.
set -e

FOLDER="${UNGGAHAN_FOLDER:-/data/unggahan}"
JALANKAN="java -XX:MaxRAMPercentage=75 -jar /app/aplikasi.jar"

if [ "$(id -u)" = "0" ]; then
    mkdir -p "$FOLDER"
    chown -R aplikasi:aplikasi "$FOLDER"
    echo ">> Folder unggahan disiapkan: $FOLDER"

    # exec supaya Java menggantikan skrip ini, bukan menjadi anaknya. Dengan
    # begitu sinyal berhenti dari hosting sampai langsung ke aplikasi dan
    # penutupannya rapi.
    exec setpriv --reuid=aplikasi --regid=aplikasi --init-groups $JALANKAN
fi

# Kalau hosting sudah menjalankan kontainer sebagai pengguna biasa, tidak ada
# yang perlu dibenahi.
exec $JALANKAN
