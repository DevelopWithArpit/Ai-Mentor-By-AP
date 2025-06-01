
'use server';
/**
 * @fileOverview A Genkit tool to fetch current weather for a given city using Open-Meteo API.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GetWeatherToolInputSchema = z.object({
  city: z.string().describe('The city name for which to get the current weather. e.g. London, Paris, New York'),
});

const GetWeatherToolOutputSchema = z.object({
  weatherInfo: z.string().describe('A textual description of the current weather conditions, or an error message if weather cannot be fetched.'),
});

// Helper function to convert WMO weather codes to strings
function weatherCodeToString(code: number): string {
  const codes: Record<number, string> = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    56: 'Light freezing drizzle',
    57: 'Dense freezing drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    66: 'Light freezing rain',
    67: 'Heavy freezing rain',
    71: 'Slight snow fall',
    73: 'Moderate snow fall',
    75: 'Heavy snow fall',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm: Slight or moderate',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail',
  };
  return codes[code] || 'Unknown weather condition';
}

export const getWeatherTool = ai.defineTool(
  {
    name: 'getWeatherTool',
    description: 'Gets the current weather conditions for a specified city.',
    inputSchema: GetWeatherToolInputSchema,
    outputSchema: GetWeatherToolOutputSchema,
  },
  async (input) => {
    try {
      // 1. Geocode city to latitude and longitude
      const geoResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(input.city)}&count=1&format=json`
      );
      if (!geoResponse.ok) {
        return { weatherInfo: `Sorry, I couldn't find geographic information for ${input.city}.` };
      }
      const geoData = await geoResponse.json();
      if (!geoData.results || geoData.results.length === 0) {
        return { weatherInfo: `Sorry, I couldn't find the city ${input.city}. Please check the spelling or try a nearby major city.` };
      }
      const { latitude, longitude, name: cityName } = geoData.results[0];

      // 2. Fetch current weather using latitude and longitude
      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&timezone=auto`
      );
      if (!weatherResponse.ok) {
        return { weatherInfo: `Sorry, I couldn't fetch the weather for ${cityName}. The weather service might be temporarily unavailable.` };
      }
      const weatherData = await weatherResponse.json();
      
      if (!weatherData.current_weather) {
         return { weatherInfo: `Sorry, no current weather data is available for ${cityName}.` };
      }

      const { temperature, windspeed, weathercode } = weatherData.current_weather;
      const weatherDescription = weatherCodeToString(weathercode);
      
      const units = weatherData.current_weather_units;


      return {
        weatherInfo: `The current weather in ${cityName} is: ${weatherDescription}, Temperature: ${temperature}${units.temperature}, Wind Speed: ${windspeed}${units.windspeed}.`,
      };
    } catch (error) {
      console.error('Error in getWeatherTool:', error);
      return { weatherInfo: `Sorry, an unexpected error occurred while fetching weather for ${input.city}.` };
    }
  }
);
