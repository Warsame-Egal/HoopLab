package com.hooplab.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Bean
    OpenAPI hoopLabOpenApi(@Value("${SERVER_URL:http://localhost:8080}") String serverUrl) {
        return new OpenAPI()
                .info(new Info()
                        .title("HoopLab API")
                        .description("Public NBA analytics dashboard API")
                        .version("1.0.0"))
                .servers(List.of(new Server().url(serverUrl)));
    }
}
