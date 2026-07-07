"use strict";

const forecasts = window.familyForecasts || [];
const STORAGE_KEY = "porraMundial2026ProbabilidadesR32";

const GROUP_RESULTS = {
  A: ["México", "Sudáfrica", "República de Corea", "República Checa"],
  B: ["Suiza", "Canadá", "Bosnia y Herzegovina", "Catar"],
  C: ["Brasil", "Marruecos", "Escocia", "Haití"],
  D: ["Estados Unidos", "Australia", "Paraguay", "Turquía"],
  E: ["Alemania", "Costa de Marfil", "Ecuador", "Curazao"],
  F: ["Países Bajos", "Japón", "Suecia", "Túnez"],
  G: ["Bélgica", "Egipto", "RI de Irán", "Nueva Zelanda"],
  H: ["España", "Cabo Verde", "Uruguay", "Arabia Saudí"],
  I: ["Francia", "Noruega", "Senegal", "Irak"],
  J: ["Argentina", "Austria", "Argelia", "Jordania"],
  K: ["Colombia", "Portugal", "RD de Congo", "Uzbekistán"],
  L: ["Inglaterra", "Croacia", "Ghana", "Panamá"]
};

const BEST_THIRD_GROUPS = ["B", "D", "E", "F", "I", "J", "K", "L"];

const ROUND32_MATCHES = [
  { id: 74, teamA: "Alemania", teamB: "Paraguay", date: "29 jun" },
  { id: 75, teamA: "Países Bajos", teamB: "Marruecos", date: "29 jun" },
  { id: 76, teamA: "Brasil", teamB: "Japón", date: "29 jun" },
  { id: 77, teamA: "Francia", teamB: "Suecia", date: "30 jun" },
  { id: 78, teamA: "Costa de Marfil", teamB: "Noruega", date: "30 jun" },
  { id: 79, teamA: "México", teamB: "Ecuador", date: "30 jun" },
  { id: 80, teamA: "Inglaterra", teamB: "RD de Congo", date: "1 jul" },
  { id: 81, teamA: "Estados Unidos", teamB: "Bosnia y Herzegovina", date: "2 jul" },
  { id: 82, teamA: "Bélgica", teamB: "Senegal", date: "1 jul" },
  { id: 83, teamA: "Portugal", teamB: "Croacia", date: "2 jul" },
  { id: 84, teamA: "España", teamB: "Austria", date: "2 jul" },
  { id: 85, teamA: "Suiza", teamB: "Argelia", date: "3 jul" },
  { id: 86, teamA: "Argentina", teamB: "Cabo Verde", date: "4 jul" },
  { id: 87, teamA: "Colombia", teamB: "Ghana", date: "3 jul" },
  { id: 88, teamA: "Australia", teamB: "Egipto", date: "3 jul" },
  { id: 73, teamA: "Sudáfrica", teamB: "Canadá", date: "28 jun" }
].sort((a, b) => a.id - b.id);

const ROUND32_RESULTS = {
  73: "Canadá",
  74: "Paraguay",
  75: "Marruecos",
  76: "Brasil",
  77: "Francia",
  78: "Noruega",
  79: "México",
  80: "Inglaterra",
  81: "Estados Unidos",
  82: "Bélgica",
  83: "Portugal",
  84: "España",
  85: "Suiza",
  86: "Argentina",
  87: "Colombia",
  88: "Egipto"
};

const FUTURE_ROUNDS = [
  {
    key: "round16",
    label: "Octavos",
    actualKey: "qf",
    matches: [
      { id: 89, from: [74, 77] },
      { id: 90, from: [73, 75] },
      { id: 91, from: [76, 78] },
      { id: 92, from: [79, 80] },
      { id: 93, from: [83, 84] },
      { id: 94, from: [81, 82] },
      { id: 95, from: [86, 88] },
      { id: 96, from: [85, 87] }
    ]
  },
  {
    key: "quarterfinals",
    label: "Cuartos",
    actualKey: "sf",
    matches: [
      { id: 97, from: [89, 90] },
      { id: 98, from: [93, 94] },
      { id: 99, from: [91, 92] },
      { id: 100, from: [95, 96] }
    ]
  },
  {
    key: "semifinals",
    label: "Semifinales",
    actualKey: "final",
    matches: [
      { id: 101, from: [97, 98] },
      { id: 102, from: [99, 100] }
    ]
  },
  {
    key: "final",
    label: "Final",
    actualKey: "champion",
    matches: [{ id: 104, from: [101, 102] }]
  }
];

const SCORE_RULES = [
  { key: "r32", points: 1 },
  { key: "r16", points: 2 },
  { key: "qf", points: 4 },
  { key: "sf", points: 8 },
  { key: "final", points: 16 },
  { key: "champion", points: 32 }
];

let selections = loadSelections();

function render() {
  renderGroups();
  renderMatches();
  document.getElementById("qualifiedCount").textContent = `${getActualR32Teams().length} clasificados`;
}

function renderGroups() {
  const container = document.getElementById("groupResults");
  container.innerHTML = Object.entries(GROUP_RESULTS)
    .map(([group, teams]) => `
      <article class="group-card">
        <h3>Grupo ${group}</h3>
        <ol>
          ${teams.map((team, index) => renderGroupTeam(group, team, index)).join("")}
        </ol>
      </article>
    `)
    .join("");
}

function renderGroupTeam(group, team, index) {
  const isThird = index === 2;
  const qualified = index < 2 || (isThird && BEST_THIRD_GROUPS.includes(group));
  const className = qualified
    ? isThird ? "qualified-third" : ""
    : "eliminated";
  const label = isThird && BEST_THIRD_GROUPS.includes(group) ? " · pasa como 3º" : "";
  return `<li class="${className}">${escapeHtml(displayTeamName(team))}${label}</li>`;
}

function renderMatches() {
  const container = document.getElementById("matches");
  const knownBracket = buildKnownBracket();
  container.innerHTML = `
    <section class="round-block">
      <div class="round-title">
        <h3>Dieciseisavos cerrados</h3>
        <span>16 resultados</span>
      </div>
      <div class="match-grid compact-grid">
        ${ROUND32_MATCHES.map(renderFixedRound32Match).join("")}
      </div>
    </section>
    ${FUTURE_ROUNDS.map((round) => renderFutureRound(round, knownBracket.rounds[round.key] || [])).join("")}
  `;
}

function renderFixedRound32Match(match) {
  const winner = ROUND32_RESULTS[match.id];
  return `
    <article class="match-card fixed-match">
      <div class="match-meta">
        <span>Partido ${match.id}</span>
        <span>${match.date}</span>
      </div>
      <div class="fixed-result ${winner === match.teamA ? "selected" : ""}">${escapeHtml(displayTeamName(match.teamA))}</div>
      <div class="fixed-result ${winner === match.teamB ? "selected" : ""}">${escapeHtml(displayTeamName(match.teamB))}</div>
    </article>
  `;
}

function renderFutureRound(round, matches) {
  return `
    <section class="round-block">
      <div class="round-title">
        <h3>${round.label}</h3>
        <span>${matches.filter((match) => match.selectedWinner).length} de ${matches.length}</span>
      </div>
      <div class="match-grid">
        ${matches.map(renderFutureMatch).join("")}
      </div>
    </section>
  `;
}

function renderFutureMatch(match) {
  const selectable = Boolean(match.teamA && match.teamB);
  return `
    <article class="match-card">
      <div class="match-meta">
        <span>Partido ${match.id}</span>
        <span>${selectable ? "Disponible" : "Pendiente"}</span>
      </div>
      ${renderFutureMatchSlot(match, match.teamA)}
      ${renderFutureMatchSlot(match, match.teamB)}
    </article>
  `;
}

function renderFutureMatchSlot(match, team) {
  if (!team) return `<div class="pending-choice">Pendiente del cruce anterior</div>`;
  if (!match.teamA || !match.teamB) return `<div class="fixed-result">${escapeHtml(displayTeamName(team))}</div>`;
  return renderTeamButton(match, team);
}

function buildKnownBracket() {
  const winners = { ...ROUND32_RESULTS };
  const rounds = {};

  FUTURE_ROUNDS.forEach((round) => {
    rounds[round.key] = round.matches.map((schema) => {
      const match = {
        id: schema.id,
        round: round.key,
        actualKey: round.actualKey,
        teamA: winners[schema.from[0]] || "",
        teamB: winners[schema.from[1]] || ""
      };
      const selectedWinner = getValidSelectedWinner(match);
      if (selectedWinner) {
        match.selectedWinner = selectedWinner;
        winners[match.id] = selectedWinner;
      }
      return match;
    });
  });

  return { winners, rounds };
}

function getValidSelectedWinner(match) {
  const selectedWinner = selections[match.id];
  return selectedWinner && [match.teamA, match.teamB].includes(selectedWinner) ? selectedWinner : "";
}

function getAllFutureMatches() {
  const knownBracket = buildKnownBracket();
  return FUTURE_ROUNDS.flatMap((round) => knownBracket.rounds[round.key] || []);
}

function countOpenFutureMatches() {
  const selectedCount = getAllFutureMatches().filter((match) => getValidSelectedWinner(match)).length;
  const totalFutureMatches = FUTURE_ROUNDS.reduce((total, round) => total + round.matches.length, 0);
  return totalFutureMatches - selectedCount;
}

function getCurrentActual(fixedActual) {
  const actual = {
    ...fixedActual,
    r16: [...fixedActual.r16],
    qf: [],
    sf: [],
    final: [],
    champion: ""
  };
  getAllFutureMatches().forEach((match) => {
    const selectedWinner = getValidSelectedWinner(match);
    if (!selectedWinner) return;
    if (match.actualKey === "champion") {
      actual.champion = selectedWinner;
    } else {
      actual[match.actualKey].push(selectedWinner);
    }
  });
  return actual;
}

function renderTeamButton(match, team) {
  const selected = selections[match.id] === team;
  return `
    <button class="team-button ${selected ? "selected" : ""}" type="button" data-match="${match.id}" data-team="${escapeAttr(team)}" aria-pressed="${selected}">
      ${escapeHtml(displayTeamName(team))}
    </button>
  `;
}

function calculate() {
  clearMessage();
  const fixedActual = {
    r32: getActualR32Teams(),
    r16: Object.values(ROUND32_RESULTS)
  };
  const currentActual = getCurrentActual(fixedActual);
  const results = simulateScenarios(fixedActual, currentActual);

  renderResults(results);
  saveSelections();
  showMessage("Calculo exacto completado.", "success");
}

function simulateScenarios(fixedActual, currentActual) {
  const stats = forecasts.map((forecast) => ({
    id: forecast.id,
    name: forecast.name,
    totalTop: 0,
    totalTopTwo: 0,
    uniqueWins: 0,
    currentPoints: scoreForecast(forecast, currentActual)
  }));

  const openCount = countOpenFutureMatches();
  const scenarioCount = 2 ** openCount;

  for (let mask = 0; mask < scenarioCount; mask += 1) {
    const actual = {
      ...fixedActual,
      r16: [...fixedActual.r16],
      qf: [],
      sf: [],
      final: [],
      champion: ""
    };
    let bit = 0;
    const winners = { ...ROUND32_RESULTS };

    FUTURE_ROUNDS.forEach((round) => {
      round.matches.forEach((match) => {
        const teamA = winners[match.from[0]];
        const teamB = winners[match.from[1]];
        const selectedWinner = getValidSelectedWinner({ id: match.id, teamA, teamB });
        const winner = selectedWinner || (((mask >> bit) & 1) ? teamB : teamA);
        winners[match.id] = winner;
        if (!selectedWinner) bit += 1;

        if (round.actualKey === "champion") {
          actual.champion = winner;
        } else {
          actual[round.actualKey].push(winner);
        }
      });
    });

    const totals = forecasts.map((forecast) => scoreForecast(forecast, actual));
    const maxScore = Math.max(...totals);
    const podiumScores = [...new Set(totals)].sort((a, b) => b - a);
    const secondPlaceScore = podiumScores[1] ?? podiumScores[0];
    const leaders = totals
      .map((total, index) => ({ total, index }))
      .filter((entry) => entry.total === maxScore);

    leaders.forEach((leader) => {
      stats[leader.index].totalTop += 1;
      if (leaders.length === 1) stats[leader.index].uniqueWins += 1;
    });

    totals.forEach((total, index) => {
      if (total >= secondPlaceScore) {
        stats[index].totalTopTwo += 1;
      }
    });
  }

  return stats
    .map((stat) => ({
      ...stat,
      topPct: (stat.totalTop / scenarioCount) * 100,
      topTwoPct: (stat.totalTopTwo / scenarioCount) * 100,
      uniquePct: (stat.uniqueWins / scenarioCount) * 100,
      scenarios: scenarioCount
    }))
    .sort((a, b) =>
      b.topPct - a.topPct ||
      b.topTwoPct - a.topTwoPct ||
      b.uniquePct - a.uniquePct ||
      a.name.localeCompare(b.name, "es")
    );
}

function renderResults(results) {
  const top = results[0];
  const selectedMatches = getAllFutureMatches().filter((match) => getValidSelectedWinner(match));
  const openCount = countOpenFutureMatches();
  const selectedText = selectedMatches.length
    ? selectedMatches.map((match) => `${match.id}: ${displayTeamName(selections[match.id])}`).join(", ")
    : "ningun resultado futuro fijado";

  document.getElementById("resultsPanel").hidden = false;
  document.getElementById("scenarioSummary").textContent = `${selectedText}. Partidos abiertos: ${openCount}.`;
  document.getElementById("scenarioCount").textContent = `${formatInteger(top.scenarios)} escenarios exactos`;
  document.getElementById("leaderCards").innerHTML = `
    <article class="leader-card">
      <span>Favorito</span>
      <strong>${escapeHtml(top.name)}</strong>
    </article>
    <article class="leader-card">
      <span>Gana la porra</span>
      <strong>${formatPct(top.topPct)}</strong>
    </article>
    <article class="leader-card">
      <span>1º en solitario</span>
      <strong>${formatPct(top.uniquePct)}</strong>
    </article>
  `;
  document.getElementById("resultsBody").innerHTML = results
    .map((result, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(result.name)}</td>
        <td>${formatPct(result.topPct)}</td>
        <td>${formatPct(result.topTwoPct)}</td>
        <td>${formatPct(result.uniquePct)}</td>
        <td>${result.currentPoints}</td>
      </tr>
    `)
    .join("");
}

function scoreForecast(forecast, actual) {
  return SCORE_RULES.reduce((total, rule) => {
    if (rule.key === "champion") {
      return total + (actual.champion && forecast.champion === actual.champion ? rule.points : 0);
    }
    return total + scoreTeamSet(forecast[rule.key] || [], actual[rule.key] || [], rule.points);
  }, 0);
}

function scoreTeamSet(predictedTeams, actualTeams, pointsPerHit) {
  const actualSet = new Set(actualTeams);
  return [...new Set(predictedTeams)].filter((team) => actualSet.has(team)).length * pointsPerHit;
}

function getActualR32Teams() {
  const directQualifiers = Object.values(GROUP_RESULTS).flatMap((teams) => teams.slice(0, 2));
  const qualifiedThirds = BEST_THIRD_GROUPS.map((group) => GROUP_RESULTS[group][2]);
  return [...directQualifiers, ...qualifiedThirds];
}

function loadSelections() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    const futureMatchIds = new Set(FUTURE_ROUNDS.flatMap((round) => round.matches.map((match) => match.id)));
    return Object.fromEntries(
      Object.entries(parsed).filter(([matchId, team]) => futureMatchIds.has(Number(matchId)) && typeof team === "string")
    );
  } catch {
    return {};
  }
}

function saveSelections() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(selections));
}

function clearSelections() {
  selections = {};
  localStorage.removeItem(STORAGE_KEY);
  document.getElementById("resultsPanel").hidden = true;
  clearMessage();
  renderMatches();
}

function clearDependentSelections(matchId) {
  const dependents = {
    89: [97], 90: [97], 93: [98], 94: [98], 91: [99], 92: [99], 95: [100], 96: [100],
    97: [101], 98: [101], 99: [102], 100: [102],
    101: [104], 102: [104]
  };
  const queue = [...(dependents[matchId] || [])];
  while (queue.length) {
    const id = queue.shift();
    delete selections[id];
    queue.push(...(dependents[id] || []));
  }
}

function showMessage(text, type = "warning") {
  const message = document.getElementById("message");
  message.textContent = text;
  message.className = `message ${type === "success" ? "success" : ""}`;
  message.hidden = false;
}

function clearMessage() {
  const message = document.getElementById("message");
  message.textContent = "";
  message.className = "message";
  message.hidden = true;
}

function displayTeamName(team) {
  const shortNames = {
    "República Checa": "Chequia",
    "República de Corea": "Corea del Sur",
    "Bosnia y Herzegovina": "Bosnia",
    "RD de Congo": "RD Congo"
  };
  return shortNames[team] || team;
}

function formatPct(value) {
  if (value > 0 && value < 0.1) return "<0,1%";
  return `${value.toFixed(1).replace(".", ",")}%`;
}

function formatInteger(value) {
  return new Intl.NumberFormat("es-ES").format(value);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return encodeURIComponent(String(value ?? ""));
}

document.addEventListener("click", (event) => {
  const teamButton = event.target.closest("[data-match][data-team]");
  if (teamButton) {
    const matchId = Number(teamButton.dataset.match);
    const team = decodeURIComponent(teamButton.dataset.team);
    selections[matchId] = selections[matchId] === team ? "" : team;
    if (!selections[matchId]) delete selections[matchId];
    clearDependentSelections(matchId);
    saveSelections();
    document.getElementById("resultsPanel").hidden = true;
    renderMatches();
    return;
  }

  if (event.target.id === "calculateButton") calculate();
  if (event.target.id === "clearButton") clearSelections();
});

render();
