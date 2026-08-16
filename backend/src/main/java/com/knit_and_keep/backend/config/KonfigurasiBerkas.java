package com.knit_and_keep.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

/** Menyajikan berkas yang diunggah agar bisa dibuka langsung dari peramban. */
@Configuration
public class KonfigurasiBerkas implements WebMvcConfigurer {

    @Value("${app.unggahan.folder}")
    private String folder;

    @Value("${app.unggahan.url-publik}")
    private String urlPublik;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String lokasi = Paths.get(folder).toAbsolutePath().normalize().toUri().toString();
        registry.addResourceHandler(urlPublik + "/**")
                .addResourceLocations(lokasi)
                .setCachePeriod(60 * 60 * 24 * 30);
    }
}
