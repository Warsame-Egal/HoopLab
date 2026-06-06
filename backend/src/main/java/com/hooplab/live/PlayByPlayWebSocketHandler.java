package com.hooplab.live;

import java.io.IOException;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

@Component
public class PlayByPlayWebSocketHandler extends TextWebSocketHandler {

    private static final Pattern GAME_ID = Pattern.compile("/ws/games/([^/]+)/play-by-play/?$");

    private final LiveDataHub hub;
    private final LiveDataPoller poller;

    public PlayByPlayWebSocketHandler(LiveDataHub hub, LiveDataPoller poller) {
        this.hub = hub;
        this.poller = poller;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws IOException {
        String gameId = extractGameId(session);
        if (gameId == null) {
            session.close(CloseStatus.BAD_DATA);
            return;
        }
        hub.registerPlayByPlaySession(gameId, session);
        if (hub.onPlayByPlaySubscribed(gameId)) {
            poller.requestGameLiveRefresh(gameId);
        }
        session.sendMessage(new TextMessage(hub.getLastPlayByPlayJson(gameId)));
        String boxJson = hub.getLastBoxScoreJson(gameId);
        if (boxJson != null) {
            session.sendMessage(new TextMessage(boxJson));
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        String gameId = extractGameId(session);
        if (gameId != null) {
            hub.unregisterPlayByPlaySession(gameId, session);
            hub.onPlayByPlayUnsubscribed(gameId);
        }
    }

    private static String extractGameId(WebSocketSession session) {
        String path = session.getUri() != null ? session.getUri().getPath() : null;
        if (path == null) {
            return null;
        }
        Matcher matcher = GAME_ID.matcher(path);
        return matcher.find() ? matcher.group(1) : null;
    }
}
