// backend/src/main/java/com/cinemae/booking/config/CorsConfig.java
package com.cinemae.booking.config;

import org.springframework.context.annotation.*;
import org.springframework.web.servlet.config.annotation.*;

@Configuration
public class CorsConfig implements WebMvcConfigurer {
  @Override
  public void addCorsMappings(CorsRegistry registry) {
    registry.addMapping("/api/**")
            .allowedOrigins("http://localhost:3000", "http://localhost:5000", "http://localhost:8081")
            .allowedMethods("GET","POST","PUT","DELETE","OPTIONS")
            .allowCredentials(true);
  }
}
