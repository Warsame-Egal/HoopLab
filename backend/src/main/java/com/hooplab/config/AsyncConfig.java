package com.hooplab.config;

import java.util.concurrent.Executor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

/**
 * Small executor used to seed the live WebSocket streams off the handshake thread, so a new
 * subscriber's connection is never blocked on a remote fetch to the data service.
 */
@Configuration
public class AsyncConfig {

    @Bean(name = "liveRefreshExecutor")
    Executor liveRefreshExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(4);
        executor.setQueueCapacity(50);
        executor.setThreadNamePrefix("live-refresh-");
        executor.initialize();
        return executor;
    }
}
