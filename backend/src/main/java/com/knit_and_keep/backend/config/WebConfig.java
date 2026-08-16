package com.knit_and_keep.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Izin akses dari aplikasi React.
 *
 * Daftar alamatnya dibaca dari konfigurasi, supaya saat dipublikasi cukup
 * mengisi variabel CORS_ORIGINS dengan domain toko — tanpa mengubah kode.
 *
 * Klien HTTP untuk panggilan ke Midtrans dan RajaOngkir ada di HttpClientConfig.
 */
@Configuration
public class WebConfig {

    @Value("${app.cors.allowed-origins}")
    private String alamatDiizinkan;

    @Bean
    WebMvcConfigurer corsConfigurer() {
        String[] daftar = alamatDiizinkan.split("\\s*,\\s*");
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**")
                        .allowedOriginPatterns(daftar)
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                        .allowedHeaders("*")
                        .allowCredentials(true);
            }
        };
    }
}
