package com.hooplab.live;

import java.io.IOException;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

@Component
public class ScoreboardWebSocketHandler extends TextWebSocketHandler {

    private final LiveDataHub hub;
    private final LiveDataPoller poller;

    public ScoreboardWebSocketHandler(LiveDataHub hub, LiveDataPoller poller) {
        this.hub = hub;
        this.poller = poller;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws IOException {
        hub.registerScoreboardSession(session);
        boolean firstSubscriber = hub.onScoreboardSubscribed();
        session.sendMessage(new TextMessage(hub.getLastScoreboardJson()));
        if (firstSubscriber) {
            poller.requestScoreboardRefresh();
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        hub.unregisterScoreboardSession(session);
        hub.onScoreboardUnsubscribed();
    }
}
