package com.hooplab.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.hooplab.domain.PlayerSeasonStats;
import com.hooplab.domain.Team;
import com.hooplab.domain.TeamGameLog;
import com.hooplab.domain.TeamSeasonStats;
import com.hooplab.dto.CoachDto;
import com.hooplab.dto.OfficialRosterDto;
import com.hooplab.dto.RosterEntryDto;
import com.hooplab.dto.RosterPlayerDto;
import com.hooplab.dto.StandingDto;
import com.hooplab.dto.TeamGameLogDto;
import com.hooplab.dto.TeamMapDto;
import com.hooplab.dto.TeamSeasonStatsDto;
import com.hooplab.dto.TeamSummaryDto;
import com.hooplab.dto.TrendPointDto;
import com.hooplab.exception.ApiException;
import com.hooplab.ingestion.IngestionClient;
import com.hooplab.ingestion.IngestionMapper;
import com.hooplab.dto.LineupDto;
import com.hooplab.repository.PlayerSeasonStatsRepository;
import com.hooplab.repository.TeamClutchStatsRepository;
import com.hooplab.repository.TeamGameLogRepository;
import com.hooplab.repository.TeamRepository;
import com.hooplab.repository.TeamSeasonStatsRepository;
import com.hooplab.util.JsonUtils;
import com.hooplab.util.SeasonUtils;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class TeamService {

    private final TeamRepository teamRepository;
    private final TeamSeasonStatsRepository teamSeasonStatsRepository;
    private final PlayerSeasonStatsRepository playerSeasonStatsRepository;
    private final TeamGameLogRepository teamGameLogRepository;
    private final TeamClutchStatsRepository teamClutchStatsRepository;
    private final IngestionClient ingestionClient;
    private final IngestionMapper ingestionMapper;

    public TeamService(TeamRepository teamRepository,
                       TeamSeasonStatsRepository teamSeasonStatsRepository,
                       PlayerSeasonStatsRepository playerSeasonStatsRepository,
                       TeamGameLogRepository teamGameLogRepository,
                       TeamClutchStatsRepository teamClutchStatsRepository,
                       IngestionClient ingestionClient,
                       IngestionMapper ingestionMapper) {
        this.teamRepository = teamRepository;
        this.teamSeasonStatsRepository = teamSeasonStatsRepository;
        this.playerSeasonStatsRepository = playerSeasonStatsRepository;
        this.teamGameLogRepository = teamGameLogRepository;
        this.teamClutchStatsRepository = teamClutchStatsRepository;
        this.ingestionClient = ingestionClient;
        this.ingestionMapper = ingestionMapper;
    }

    @Cacheable("teams")
    public List<TeamSummaryDto> list() {
        return teamRepository.findAll().stream().map(this::toSummary).toList();
    }

    @Cacheable(value = "teams", key = "#id")
    public TeamSummaryDto getById(int id) {
        Team team = teamRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND.value(), "Team not found"));
        return toSummary(team);
    }

    public List<TeamSeasonStatsDto> getSeasons(int id) {
        if (!teamRepository.existsById(id)) {
            throw new ApiException(HttpStatus.NOT_FOUND.value(), "Team not found");
        }
        return teamSeasonStatsRepository.findByTeamTeamIdOrderByIdSeasonDesc(id).stream()
                .map(this::toSeasonStats)
                .toList();
    }

    @Cacheable(value = "teamMap", key = "#season")
    public List<TeamMapDto> getMap(String season) {
        String resolvedSeason = season != null ? season : SeasonUtils.currentSeason();
        Map<Integer, Double> clutchByTeam = new HashMap<>();
        teamClutchStatsRepository.findBySeason(resolvedSeason)
                .forEach(c -> clutchByTeam.put(c.getId().getTeamId(), c.getNetRtg()));
        return teamSeasonStatsRepository.findMapData(resolvedSeason).stream()
                .map(stats -> toMapDto(stats, clutchByTeam.get(stats.getId().getTeamId())))
                .toList();
    }

    @Cacheable(value = "lineups", key = "#id + ':' + (#season == null ? 'current' : #season)")
    public List<LineupDto> getLineups(int id, String season) {
        if (!teamRepository.existsById(id)) {
            throw new ApiException(HttpStatus.NOT_FOUND.value(), "Team not found");
        }
        String resolvedSeason = season != null ? season : SeasonUtils.currentSeason();
        JsonNode response = ingestionClient.fetchLineups(id, resolvedSeason);
        JsonNode records = response.get("records");
        List<LineupDto> lineups = new ArrayList<>();
        if (records != null && records.isArray()) {
            for (JsonNode row : records) {
                lineups.add(new LineupDto(
                        JsonUtils.str(row, "GROUP_NAME"),
                        JsonUtils.integer(row, "GP"),
                        JsonUtils.dbl(row, "MIN"),
                        JsonUtils.dbl(row, "OFF_RATING"),
                        JsonUtils.dbl(row, "DEF_RATING"),
                        JsonUtils.dbl(row, "NET_RATING")));
            }
        }
        return lineups.stream()
                .sorted(Comparator.comparing(
                        (LineupDto l) -> l.min() == null ? 0.0 : l.min()).reversed())
                .limit(15)
                .toList();
    }

    @Cacheable(value = "standings", key = "#season + ':' + (#conference == null ? 'all' : #conference)")
    public List<StandingDto> getStandings(String season, String conference) {
        String resolvedSeason = season != null ? season : SeasonUtils.currentSeason();
        List<TeamSeasonStats> stats = teamSeasonStatsRepository.findStandings(resolvedSeason, conference);
        AtomicInteger rank = new AtomicInteger(1);
        return stats.stream()
                .map(entry -> toStanding(rank.getAndIncrement(), entry))
                .toList();
    }

    @Cacheable(value = "roster", key = "#id + ':' + #season")
    public List<RosterEntryDto> getRoster(int id, String season) {
        if (!teamRepository.existsById(id)) {
            throw new ApiException(HttpStatus.NOT_FOUND.value(), "Team not found");
        }
        String resolvedSeason = season != null ? season : SeasonUtils.currentSeason();
        return playerSeasonStatsRepository.findRoster(resolvedSeason, id).stream()
                .map(this::toRosterEntry)
                .toList();
    }

    @Transactional
    public List<TeamGameLogDto> getGameLog(int id, String season) {
        Team team = teamRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND.value(), "Team not found"));
        String resolvedSeason = season != null ? season : SeasonUtils.currentSeason();

        List<TeamGameLog> cached = teamGameLogRepository
                .findByTeamTeamIdAndSeasonOrderByGameDateAsc(id, resolvedSeason);
        if (!cached.isEmpty()) {
            return cached.stream().map(this::toGameLog).toList();
        }

        JsonNode response = ingestionClient.fetchTeamGameLog(id, resolvedSeason);
        JsonNode records = response.get("records");
        if (records == null || !records.isArray() || records.isEmpty()) {
            return List.of();
        }

        teamGameLogRepository.deleteByTeamTeamIdAndSeason(id, resolvedSeason);
        for (JsonNode row : records) {
            teamGameLogRepository.save(ingestionMapper.toTeamGameLog(row, team, resolvedSeason));
        }

        return teamGameLogRepository.findByTeamTeamIdAndSeasonOrderByGameDateAsc(id, resolvedSeason).stream()
                .map(this::toGameLog)
                .toList();
    }

    @Cacheable(value = "officialRoster", key = "#id + ':' + (#season == null ? 'current' : #season)")
    public OfficialRosterDto getOfficialRoster(int id, String season) {
        if (!teamRepository.existsById(id)) {
            throw new ApiException(HttpStatus.NOT_FOUND.value(), "Team not found");
        }
        String resolvedSeason = season != null ? season : SeasonUtils.currentSeason();
        JsonNode response = ingestionClient.fetchTeamRoster(id, resolvedSeason);

        List<RosterPlayerDto> players = new ArrayList<>();
        JsonNode playerRows = response.get("players");
        if (playerRows != null && playerRows.isArray()) {
            for (JsonNode row : playerRows) {
                Integer age = JsonUtils.integer(row, "AGE");
                players.add(new RosterPlayerDto(
                        JsonUtils.integer(row, "PLAYER_ID"),
                        JsonUtils.str(row, "PLAYER"),
                        JsonUtils.str(row, "NUM"),
                        JsonUtils.str(row, "POSITION"),
                        JsonUtils.str(row, "HEIGHT"),
                        JsonUtils.str(row, "WEIGHT"),
                        age == null ? null : age.toString(),
                        JsonUtils.str(row, "EXP"),
                        JsonUtils.str(row, "SCHOOL")));
            }
        }

        List<CoachDto> coaches = new ArrayList<>();
        JsonNode coachRows = response.get("coaches");
        if (coachRows != null && coachRows.isArray()) {
            for (JsonNode row : coachRows) {
                coaches.add(new CoachDto(
                        JsonUtils.str(row, "COACH_NAME"),
                        JsonUtils.str(row, "COACH_TYPE")));
            }
        }

        return new OfficialRosterDto(players, coaches);
    }

    @Cacheable(value = "trends", key = "'team:' + #id + ':' + #stat")
    public List<TrendPointDto> getTrends(int id, String stat) {
        if (!teamRepository.existsById(id)) {
            throw new ApiException(HttpStatus.NOT_FOUND.value(), "Team not found");
        }
        return teamSeasonStatsRepository.findByTeamTeamIdOrderByIdSeasonAsc(id).stream()
                .map(entry -> new TrendPointDto(
                        entry.getId().getSeason(),
                        StatTrendExtractor.teamValue(entry, stat)))
                .toList();
    }

    private TeamSummaryDto toSummary(Team team) {
        return new TeamSummaryDto(
                team.getTeamId(),
                team.getAbbreviation(),
                team.getCity(),
                team.getName(),
                team.getFullName(),
                team.getConference(),
                team.getDivision(),
                team.getYearFounded()
        );
    }

    private TeamSeasonStatsDto toSeasonStats(TeamSeasonStats stats) {
        return new TeamSeasonStatsDto(
                stats.getId().getSeason(),
                stats.getWins(),
                stats.getLosses(),
                stats.getOffRtg(),
                stats.getDefRtg(),
                stats.getNetRtg(),
                stats.getPace(),
                stats.getPts(),
                stats.getReb(),
                stats.getAst()
        );
    }

    private TeamMapDto toMapDto(TeamSeasonStats stats, Double clutchNetRtg) {
        Team team = stats.getTeam();
        return new TeamMapDto(
                team.getTeamId(),
                team.getAbbreviation(),
                team.getName(),
                team.getFullName(),
                team.getLatitude(),
                team.getLongitude(),
                stats.getWins(),
                stats.getLosses(),
                StatTrendExtractor.winPct(stats),
                stats.getNetRtg(),
                clutchNetRtg,
                team.getConference()
        );
    }

    private RosterEntryDto toRosterEntry(PlayerSeasonStats stats) {
        return new RosterEntryDto(
                stats.getPlayer().getPlayerId(),
                stats.getPlayer().getFullName(),
                stats.getPlayer().getPosition(),
                stats.getGp(),
                stats.getMin(),
                stats.getPts(),
                stats.getReb(),
                stats.getAst(),
                stats.getFgPct(),
                stats.getFg3Pct(),
                stats.getTsPct(),
                stats.getUsgPct()
        );
    }

    private TeamGameLogDto toGameLog(TeamGameLog log) {
        return new TeamGameLogDto(
                log.getGameId(),
                log.getGameDate(),
                log.getMatchup(),
                log.getWl(),
                log.getPts(),
                log.getReb(),
                log.getAst(),
                log.getPlusMinus()
        );
    }

    private StandingDto toStanding(int rank, TeamSeasonStats stats) {
        Team team = stats.getTeam();
        return new StandingDto(
                rank,
                team.getTeamId(),
                team.getAbbreviation(),
                team.getFullName(),
                team.getConference(),
                stats.getWins(),
                stats.getLosses(),
                StatTrendExtractor.winPct(stats),
                stats.getNetRtg()
        );
    }
}
