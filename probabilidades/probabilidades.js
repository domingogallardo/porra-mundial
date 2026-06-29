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

const FUTURE_ROUNDS = [
  {
    key: "round16",
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
    actualKey: "sf",
    matches: [
      { id: 97, from: [89, 90] },
      { id: 98, from: [91, 92] },
      { id: 99, from: [93, 94] },
      { id: 100, from: [95, 96] }
    ]
  },
  {
    key: "semifinals",
    actualKey: "final",
    matches: [
      { id: 101, from: [97, 98] },
      { id: 102, from: [99, 100] }
    ]
  },
  {
    key: "final",
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
  container.innerHTML = ROUND32_MATCHES
    .map((match) => `
      <article class="match-card">
        <div class="match-meta">
          <span>Partido ${match.id}</span>
          <span>${match.date}</span>
        </div>
        ${renderTeamButton(match, match.teamA)}
        ${renderTeamButton(match, match.teamB)}
      </article>
    `)
    .join("");
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
  const missing = ROUND32_MATCHES.filter((match) => !selections[match.id]);
  if (missing.length) {
    showMessage(`Falta elegir ganador en ${missing.length} cruces: ${missing.map((match) => match.id).join(", ")}.`);
    return;
  }

  const fixedActual = {
    r32: getActualR32Teams(),
    r16: ROUND32_MATCHES.map((match) => selections[match.id])
  };
  const currentScores = forecasts.map((forecast) => ({
    id: forecast.id,
    current: scoreForecast(forecast, fixedActual)
  }));
  const results = simulateFutureScenarios(fixedActual, currentScores);

  renderResults(results);
  saveSelections();
  showMessage("Calculo completado.", "success");
}

function simulateFutureScenarios(fixedActual, currentScores) {
  const stats = forecasts.map((forecast) => ({
    id: forecast.id,
    name: forecast.name,
    totalTop: 0,
    weightedWins: 0,
    uniqueWins: 0,
    pointsSum: 0,
    minPoints: Number.POSITIVE_INFINITY,
    maxPoints: Number.NEGATIVE_INFINITY,
    currentPoints: currentScores.find((score) => score.id === forecast.id)?.current || 0
  }));

  const scenarioCount = 2 ** FUTURE_ROUNDS.reduce((total, round) => total + round.matches.length, 0);

  for (let mask = 0; mask < scenarioCount; mask += 1) {
    const actual = {
      ...fixedActual,
      qf: [],
      sf: [],
      final: [],
      champion: ""
    };
    const winners = { ...selections };
    let bit = 0;

    FUTURE_ROUNDS.forEach((round) => {
      round.matches.forEach((match) => {
        const teamA = winners[match.from[0]];
        const teamB = winners[match.from[1]];
        const winner = (mask >> bit) & 1 ? teamB : teamA;
        winners[match.id] = winner;
        bit += 1;

        if (round.actualKey === "champion") {
          actual.champion = winner;
        } else {
          actual[round.actualKey].push(winner);
        }
      });
    });

    const totals = forecasts.map((forecast) => scoreForecast(forecast, actual));
    const maxScore = Math.max(...totals);
    const leaders = totals
      .map((total, index) => ({ total, index }))
      .filter((entry) => entry.total === maxScore);

    totals.forEach((total, index) => {
      const stat = stats[index];
      stat.pointsSum += total;
      stat.minPoints = Math.min(stat.minPoints, total);
      stat.maxPoints = Math.max(stat.maxPoints, total);
    });

    leaders.forEach((leader) => {
      stats[leader.index].totalTop += 1;
      stats[leader.index].weightedWins += 1 / leaders.length;
      if (leaders.length === 1) stats[leader.index].uniqueWins += 1;
    });
  }

  return stats
    .map((stat) => ({
      ...stat,
      topPct: (stat.totalTop / scenarioCount) * 100,
      weightedPct: (stat.weightedWins / scenarioCount) * 100,
      uniquePct: (stat.uniqueWins / scenarioCount) * 100,
      averagePoints: stat.pointsSum / scenarioCount,
      scenarios: scenarioCount
    }))
    .sort((a, b) => b.weightedPct - a.weightedPct || b.topPct - a.topPct || b.averagePoints - a.averagePoints || a.name.localeCompare(b.name, "es"));
}

function renderResults(results) {
  const top = results[0];
  const selectedText = ROUND32_MATCHES
    .map((match) => `${displayTeamName(selections[match.id])}`)
    .join(", ");

  document.getElementById("resultsPanel").hidden = false;
  document.getElementById("scenarioSummary").textContent = `Con estos ganadores de dieciseisavos: ${selectedText}.`;
  document.getElementById("leaderCards").innerHTML = `
    <article class="leader-card">
      <span>Favorito</span>
      <strong>${escapeHtml(top.name)}</strong>
    </article>
    <article class="leader-card">
      <span>Probabilidad ponderada</span>
      <strong>${formatPct(top.weightedPct)}</strong>
    </article>
    <article class="leader-card">
      <span>Posibilidad de empatar primero</span>
      <strong>${formatPct(top.topPct)}</strong>
    </article>
  `;
  document.getElementById("resultsBody").innerHTML = results
    .map((result, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(result.name)}</td>
        <td>${formatPct(result.topPct)}</td>
        <td>${formatPct(result.weightedPct)}</td>
        <td>${formatPct(result.uniquePct)}</td>
        <td>${result.currentPoints}</td>
        <td>${result.averagePoints.toFixed(1)}</td>
        <td>${result.minPoints}-${result.maxPoints}</td>
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
    return Object.fromEntries(
      Object.entries(parsed).filter(([matchId, team]) => {
        const match = ROUND32_MATCHES.find((item) => item.id === Number(matchId));
        return match && [match.teamA, match.teamB].includes(team);
      })
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
    saveSelections();
    document.getElementById("resultsPanel").hidden = true;
    renderMatches();
    return;
  }

  if (event.target.id === "calculateButton") calculate();
  if (event.target.id === "clearButton") clearSelections();
});

render();
