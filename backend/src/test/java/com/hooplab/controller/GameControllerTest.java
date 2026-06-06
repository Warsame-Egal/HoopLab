package com.hooplab.controller;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.hooplab.dto.BoxScoreDto;
import com.hooplab.exception.ApiException;
import com.hooplab.service.GameService;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(GameController.class)
class GameControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private GameService gameService;

    @Test
    void boxScoreRouteReturnsTypedPayload() throws Exception {
        when(gameService.getBoxScore("0022300001"))
                .thenReturn(new BoxScoreDto("0022300001", List.of()));

        mockMvc.perform(get("/api/games/0022300001/boxscore"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.gameId").value("0022300001"));
    }

    @Test
    void variantRouteDelegatesToServiceAndReturnsRawJson() throws Exception {
        when(gameService.getBoxScoreVariant(eq("0022300001"), eq("scoring")))
                .thenReturn("{\"variant\":\"scoring\"}");

        mockMvc.perform(get("/api/games/0022300001/boxscore/scoring"))
                .andExpect(status().isOk())
                .andExpect(content().json("{\"variant\":\"scoring\"}"));
    }

    @Test
    void advancedRouteResolvesBeforeVariantPattern() throws Exception {
        // "/boxscore/advanced" is a literal mapping and must win over the {variant} pattern.
        mockMvc.perform(get("/api/games/0022300001/boxscore/advanced?measure=advanced"))
                .andExpect(status().isOk());
    }

    @Test
    void errorEnvelopeIncludesPath() throws Exception {
        when(gameService.getBoxScore("missing"))
                .thenThrow(new ApiException(HttpStatus.NOT_FOUND.value(), "No box score available"));

        mockMvc.perform(get("/api/games/missing/boxscore"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value("No box score available"))
                .andExpect(jsonPath("$.timestamp").exists())
                .andExpect(jsonPath("$.path").value("/api/games/missing/boxscore"));
    }
}
