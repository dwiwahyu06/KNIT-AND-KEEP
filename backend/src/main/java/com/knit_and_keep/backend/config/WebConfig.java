package com.knit_and_keep.backend.config;

import okhttp3.OkHttpClient; // 1. IMPORT OkHttpClient
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig {

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**")
                        .allowedOriginPatterns("http://localhost:5173")
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                        .allowedHeaders("*")
                        .allowCredentials(true);
            }
        };
    }

    /**
     * 2. TAMBAHKAN BEAN OkHttpClient DI SINI
     * Mendaftarkan OkHttpClient sebagai singleton Bean.
     * Ini memastikan hanya ada satu instance OkHttpClient yang digunakan di seluruh aplikasi,
     * yang lebih efisien dalam manajemen koneksi dan sumber daya.
     */
    @Bean
    public OkHttpClient okHttpClient() {
        return new OkHttpClient();
    }
}