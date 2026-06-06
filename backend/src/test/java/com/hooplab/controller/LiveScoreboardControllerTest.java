package com.hooplab.controller;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.hooplab.service.LiveService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(LiveScoreboardController.class)
class LiveScoreboardControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private LiveService liveService;

    @Test
    void scoreboardDelegatesToLiveService() throws Exception {
        when(liveService.scoreboard(null)).thenReturn("{\"scoreboard\":{\"games\":[]}}");

        mockMvc.perform(get("/api/scoreboard"))
                .andExpect(status().isOk())
                .andExpect(content().json("{\"scoreboard\":{\"games\":[]}}"));
    }

    @Test
    void liveBoxScoreRouteIsSeparateFromTypedBoxScore() throws Exception {
        when(liveService.boxScore("0022300001")).thenReturn("{\"home_team\":{}}");

        mockMvc.perform(get("/api/games/0022300001/live-boxscore"))
                .andExpect(status().isOk())
                .andExpect(content().json("{\"home_team\":{}}"));
    }
}
