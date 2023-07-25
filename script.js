let date = new Date();

document.getElementById('prevDayBtn').addEventListener('click', () => {
  date.setDate(date.getDate() - 1);
  main();
});
document.getElementById('dateSelect').addEventListener('change', (e) => {
  date = new Date(e.target.value);
  main();
});
document.getElementById('nextDayBtn').addEventListener('click', () => {
  date.setDate(date.getDate() + 1);
  main();
});

async function main() {
  const dateString = getDateString(date);
  document.getElementById('dateSelect').value = dateString;
  const title = document.getElementById('title');
  title.textContent = `🗓️ ${new Date(dateString).toLocaleDateString('en-gb', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })}`;

  const gameList = document.getElementById('gameList');

  while (gameList.hasChildNodes()) {
    gameList.removeChild(gameList.firstChild);
  }

  const loadingImg = document.createElement('img');
  loadingImg.id = 'loadingImg';
  loadingImg.src = 'img/loading.png';
  loadingImg.alt = 'Loading...';
  gameList.appendChild(loadingImg);

  const gamesObj = await fetchGameData();

  while (gameList.hasChildNodes()) {
    gameList.removeChild(gameList.firstChild);
  }

  // Fetching error
  if (gamesObj === null) {
    gameList.textContent = 'Error fetching data. Reload and try again.';

    // No games
  } else if (Object.keys(gamesObj).length === 0) {
    gameList.textContent = 'No scheduled games.';

    // Games
  } else {
    for (game of gamesObj.dates[0].games) {
      gameList.appendChild(getGameElement(await parseGameObj(game)));
    }
  }
}

function getDateString(date) {
  if (!date) date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    '0'
  )}-${String(date.getDate()).padStart(2, '0')}`;
}

async function fetchGameData() {
  const dateString = getDateString(date);
  try {
    const request = await fetch(
      `https://statsapi.web.nhl.com/api/v1/schedule?startDate=${dateString}&endDate=${dateString}`,
      // FIXME: Remove Test
      //   'https://statsapi.web.nhl.com/api/v1/schedule?startDate=2023-05-12&endDate=2023-05-12',
      {
        mode: 'cors',
      }
    );
    if (!request.ok) {
      return null;
    }
    const data = await request.json();
    if (data.totalItems === 0) {
      return {};
    } else {
      return data;
    }
  } catch (err) {
    return null;
  }
}

async function parseGameObj(gameData) {
  const startTime = `${new Date(gameData.gameDate).getHours()}:${String(
    new Date(gameData.gameDate).getMinutes()
  ).padStart(2, '0')}`;

  let currentPeriod;
  let homeGoals;
  let awayGoals;

  // PREGAME
  if (gameData.status.detailedState === 'Scheduled') {
    currentPeriod = 'N/A';
    homeGoals = '-';
    awayGoals = '-';

    // POSTGAME
  } else if (gameData.status.detailedState === 'Final') {
    currentPeriod = 'Final';
    homeGoals = gameData.teams.home.score;
    awayGoals = gameData.teams.away.score;

    // IN GAME
    // FIXME: Not sure if this will work for live games... have to wait to test
  } else {
    currentPeriod = gameData.linescore.currentPeriodOrdinal;
    homeGoals = gameData.linescore.teams.home.goals;
    awayGoals = gameData.linescore.teams.away.goals;
  }

  const home = gameData.teams.home.team.name;
  const homeLogo = `https://www-league.nhlstatic.com/images/logos/teams-current-primary-light/${gameData.teams.home.team.id}.svg`;

  const away = gameData.teams.away.team.name;
  const awayLogo = `https://www-league.nhlstatic.com/images/logos/teams-current-primary-light/${gameData.teams.away.team.id}.svg`;

  const cleanedGameData = {
    startTime,
    currentPeriod,
    home,
    homeGoals,
    homeLogo,
    away,
    awayGoals,
    awayLogo,
  };

  return cleanedGameData;
}

function getGameElement(cleanedGameData) {
  const container = document.createElement('div');
  container.className = 'gameElement';

  const awayDiv = document.createElement('div');
  awayDiv.className = 'teamDiv';
  const awayScore = document.createElement('p');
  awayScore.className = 'score';
  awayScore.textContent = cleanedGameData.awayGoals;
  awayDiv.appendChild(awayScore);
  const awayLogo = document.createElement('img');
  awayLogo.className = 'teamLogo';
  awayLogo.src = cleanedGameData.awayLogo;
  awayDiv.appendChild(awayLogo);
  const awayName = document.createElement('p');
  awayName.className = 'teamName';
  awayName.textContent = cleanedGameData.away;
  awayDiv.appendChild(awayName);
  container.appendChild(awayDiv);

  const atDiv = document.createElement('div');
  atDiv.className = 'atDiv';
  atDiv.textContent = '@';
  container.appendChild(atDiv);

  const homeDiv = document.createElement('div');
  homeDiv.className = 'teamDiv';
  const homeScore = document.createElement('p');
  homeScore.className = 'score';
  homeScore.textContent = cleanedGameData.homeGoals;
  homeDiv.appendChild(homeScore);
  const homeLogo = document.createElement('img');
  homeLogo.className = 'teamLogo';
  homeLogo.src = cleanedGameData.homeLogo;
  homeDiv.appendChild(homeLogo);
  const homeName = document.createElement('p');
  homeName.className = 'teamName';
  homeName.textContent = cleanedGameData.home;
  homeDiv.appendChild(homeName);
  container.appendChild(homeDiv);

  const timeInfoDiv = document.createElement('div');
  timeInfoDiv.className = 'timeInfoDiv';
  const startTime = document.createElement('p');
  startTime.className = 'time';
  startTime.textContent = `Start: ${cleanedGameData.startTime}`;
  timeInfoDiv.appendChild(startTime);
  const period = document.createElement('p');
  period.className = 'period';
  period.textContent = `Period: ${cleanedGameData.currentPeriod}`;
  timeInfoDiv.appendChild(period);
  container.appendChild(timeInfoDiv);

  return container;
}

main();
