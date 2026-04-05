import type { Weather, GameTime } from '@ai-crossing/shared';

let currentWeather: Weather = 'clear';
let lastWeatherChangeDay = 0;

const WEATHER_WEIGHTS: Record<Weather, number> = {
  clear: 0.5,
  cloudy: 0.25,
  rain: 0.15,
  storm: 0.1,
};

export function updateWeather(gameTime: GameTime): Weather {
  if (gameTime.day === lastWeatherChangeDay) return currentWeather;

  if (gameTime.hour === 6 && gameTime.minute < 5) {
    lastWeatherChangeDay = gameTime.day;
    currentWeather = rollWeather();
  }

  return currentWeather;
}

function rollWeather(): Weather {
  const roll = Math.random();
  let cumulative = 0;

  for (const [weather, weight] of Object.entries(WEATHER_WEIGHTS)) {
    cumulative += weight;
    if (roll <= cumulative) return weather as Weather;
  }

  return 'clear';
}

export function getCurrentWeather(): Weather {
  return currentWeather;
}
