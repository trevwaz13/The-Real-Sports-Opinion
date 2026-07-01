import { describe, expect, it } from "vitest";
import { rankByRso, scorePlayer } from "./rsoScoring";
import type { Player, PlayerStats, Position } from "@/data/types";

// Minimal Player factory — only position + seasonStats matter for scoring.
function makePlayer(
  position: Position,
  seasonStats: PlayerStats,
  overrides: Partial<Player> = {},
): Player {
  return {
    id: `TEST-${position}`,
    name: "Test Player",
    firstName: "Test",
    lastName: "Player",
    headshotPath: "",
    teamId: "TEST",
    position,
    jerseyNumber: 1,
    age: 26,
    yearsPro: 4,
    injuryStatus: "healthy",
    isFreeAgent: false,
    seasonStats,
    careerStats: seasonStats,
    ...overrides,
  };
}

describe("RSO scoring engine", () => {
  it("scores a QB with production + four bonuses (hand-checked = 217)", () => {
    // Production: 4000*.025=100, 200*.05=10, 30*4=120, 3*6=18, 10*-3=-30,
    //             5*-3=-15  => 203
    // Bonuses: comp% 70.5 -> +4.5, TD:INT 3.0 -> +2.5,
    //          rating 102 -> +2.5, Y/A 8.1 -> +4.5  => 14
    const qb = makePlayer("QB", {
      passYds: 4000,
      rushYds: 200,
      passTD: 30,
      rushTD: 3,
      interceptionsThrown: 10,
      fumbles: 5,
      completionPct: 70.5,
      passerRating: 102.0,
      yardsPerAttempt: 8.1,
    });
    const score = scorePlayer(qb);

    expect(score.productionSubtotal).toBe(203);
    expect(score.total).toBe(217);
    expect(score.bonuses.map((b) => b.points)).toEqual([4.5, 2.5, 2.5, 4.5]);
  });

  it("scores an RB and applies highest-tier-only bonuses (hand-checked = 206.5)", () => {
    // Production: 1300*.05=65, 12*6=72, 50*.5=25, 400*.05=20, 3*6=18,
    //             2*-3=-6  => 194
    // Bonuses: Y/C 5.0 -> +5, Y/R 8.0 -> +1, scrimmage 1700 -> +2.5,
    //          totalTD 15 -> +4  => 12.5
    const rb = makePlayer("RB", {
      rushYds: 1300,
      rushTD: 12,
      receptions: 50,
      recYds: 400,
      recTD: 3,
      fumbles: 2,
      yardsPerCarry: 5.0,
      yardsPerReception: 8.0,
      scrimmageYds: 1700,
      totalTD: 15,
    });
    const score = scorePlayer(rb);

    expect(score.productionSubtotal).toBe(194);
    expect(score.total).toBe(206.5);
    // Y/C of 5.0 fires the +5 tier only (not +1 and +2.5 underneath it).
    const yc = score.bonuses.find((b) => b.metric === "yardsPerCarry");
    expect(yc?.points).toBe(5);
  });

  it("scores a CB including lower-is-better bonuses (hand-checked = 149)", () => {
    // Production: 6*8=48, 16*2=32, 50*.5=25, 3*2=6, 2*4=8, 1*2=2, 1*6=6,
    //             1*10=10  => 137
    // Bonuses: INT 6 -> +2.5, PD 16 -> +2.5,
    //          rating allowed 58 -> +4.5, comp% allowed 52 -> +2.5  => 12
    const cb = makePlayer("CB", {
      interceptions: 6,
      passesDefended: 16,
      soloTackles: 50,
      tacklesForLoss: 3,
      forcedFumbles: 2,
      fumbleRecoveries: 1,
      sacks: 1,
      defTD: 1,
      passerRatingAllowed: 58.0,
      completionPctAllowed: 52.0,
    });
    const score = scorePlayer(cb);

    expect(score.productionSubtotal).toBe(137);
    expect(score.total).toBe(149);
    const rating = score.bonuses.find(
      (b) => b.metric === "passerRatingAllowed",
    );
    expect(rating?.points).toBe(4.5);
  });

  it("prorates production to a full season for players who missed games", () => {
    // production = 3000*.025 + 20*4 = 75 + 80 = 155
    const hurt = makePlayer("QB", {
      passYds: 3000,
      passTD: 20,
      gamesPlayed: 10,
    });
    const score = scorePlayer(hurt);
    expect(score.productionSubtotal).toBe(155);
    // boost = min(17/10, 2.0) = 1.7 -> adjustment = 155 * (1.7 - 1) = 108.5
    expect(score.availabilityAdjustment).toBe(108.5);
    expect(score.gamesPlayed).toBe(10);
    // careerStats == seasonStats here: 15.5/g × 6 × min(10/40, 1) = 23.25
    expect(score.sustainedBonus).toBe(23.25);
    expect(score.total).toBe(
      Math.round(
        (score.productionSubtotal +
          score.availabilityAdjustment +
          score.sustainedBonus +
          score.bonusTotal) *
          100,
      ) / 100,
    );
  });

  it("does not adjust a full-season player's production", () => {
    const full = makePlayer("QB", {
      passYds: 3000,
      passTD: 20,
      gamesPlayed: 17,
    });
    expect(scorePlayer(full).availabilityAdjustment).toBe(0);
  });

  it("credits a strong career (sustained success) on a down season", () => {
    // Weak current season, but an elite, lengthy career.
    const proven = makePlayer(
      "QB",
      { passYds: 1500, passTD: 8, gamesPlayed: 8 },
      {
        careerStats: {
          passYds: 40000,
          passTD: 300,
          gamesPlayed: 120,
        },
      },
    );
    const score = scorePlayer(proven);
    // career prod = 40000*.025 + 300*4 = 1000 + 1200 = 2200 over 120 gms
    // = 18.33/g × 6 × min(120/40, 1) = 110
    expect(score.sustainedBonus).toBe(110);
    expect(score.total).toBeGreaterThan(score.productionSubtotal);
  });

  it("keeps only the top scorer per team when onePerTeam is set (QB board)", () => {
    const starter = makePlayer("QB", { passYds: 4000, passTD: 30, gamesPlayed: 17 }, {
      id: "starter",
      teamId: "AAA",
    });
    const backup = makePlayer("QB", { passYds: 500, passTD: 3, gamesPlayed: 4 }, {
      id: "backup",
      teamId: "AAA",
    });
    const other = makePlayer("QB", { passYds: 3500, passTD: 25, gamesPlayed: 17 }, {
      id: "other",
      teamId: "BBB",
    });
    const board = rankByRso([starter, backup, other], "QB", {
      onePerTeam: true,
    });
    expect(board.map((e) => e.playerId)).toEqual(["starter", "other"]);
  });

  it("awards no bonus when a metric misses every tier", () => {
    const qb = makePlayer("QB", {
      passYds: 3000,
      passTD: 12,
      interceptionsThrown: 12,
      completionPct: 58, // below the 65 floor
      passerRating: 80, // below the 95 floor
      yardsPerAttempt: 6.0, // below the 7.0 floor
    });
    const score = scorePlayer(qb);
    // tdIntRatio = 12/12 = 1.0, below 2.0 -> also no bonus
    expect(score.bonuses).toHaveLength(0);
  });
});
