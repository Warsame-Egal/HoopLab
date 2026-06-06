package com.hooplab.config;

import com.hooplab.live.PlayByPlayWebSocketHandler;
import com.hooplab.live.ScoreboardWebSocketHandler;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class LiveWebSocketConfig implements WebSocketConfigurer {

    private final ScoreboardWebSocketHandler scoreboardHandler;
    private final PlayByPlayWebSocketHandler playByPlayHandler;

    public LiveWebSocketConfig(
            ScoreboardWebSocketHandler scoreboardHandler,
            PlayByPlayWebSocketHandler playByPlayHandler) {
        this.scoreboardHandler = scoreboardHandler;
        this.playByPlayHandler = playByPlayHandler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(scoreboardHandler, "/ws/scoreboard").setAllowedOrigins("*");
        registry.addHandler(playByPlayHandler, "/ws/games/*/play-by-play").setAllowedOrigins("*");
    }
}
