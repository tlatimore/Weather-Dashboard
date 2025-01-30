import dayjs, { type Dayjs } from 'dayjs';
import dotenv from 'dotenv';
dotenv.config();

interface Coordinates {
  name: string;
  lat: number;
  lon: number;
  country: string;
  state: string;
}

class Weather {
  constructor(
    public city: string,
    public date: Dayjs | string,
    public tempF: number,
    public windSpeed: number,
    public humidity: number,
    public icon: string,
    public iconDescription: string
  ) {}
}


class WeatherService {
  private baseURL?: string;

  private apiKey?: string;

  private city = '';

  constructor() {
    this.baseURL = process.env.API_BASE_URL || '';

    this.apiKey = process.env.API_KEY || '';
  }

  private async fetchLocationData(query: string) {
    try {
      if (!this.baseURL || !this.apiKey) {
        throw new Error('API base URL and API key are required');
      }

      const response: Coordinates[] = await fetch(query).then((res) =>
        res.json()
      );
      return response[0];
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  private destructureLocationData(locationData: Coordinates): Coordinates {
    if (!locationData) {
      throw new Error('Location data not found');
    }

    const { name, lat, lon, country, state } = locationData;

    const coordinates: Coordinates = {
      name,
      lat,
      lon,
      country,
      state,
    };

    return coordinates;
  }

  private buildGeocodeQuery(): string {
    const geocodeQuery = `${this.baseURL}/geo/1.0/direct?q=${this.city}&limit=1&appid=${this.apiKey}`;
    return geocodeQuery;
  }

  private buildWeatherQuery(coordinates: Coordinates): string {
    const weatherQuery = `${this.baseURL}/data/2.5/forecast?lat=${coordinates.lat}&lon=${coordinates.lon}&units=imperial&appid=${this.apiKey}`;
    return weatherQuery;
  }

  private async fetchAndDestructureLocationData() {
    return await this.fetchLocationData(this.buildGeocodeQuery())
    .then((data) =>this.destructureLocationData(data));
  }

  private async fetchWeatherData(coordinates: Coordinates) {
    try {
      const response = await fetch(this.buildWeatherQuery(coordinates))
      .then((res) => res.json()
    );
      if (!response) {
        throw new Error('Error fetching weather data');
      }

      const currWeather: Weather = this.parseCurrentWeather(
        response.list[0]
      );

      const forecast: Weather[] = this.buildForecastArray(
        currWeather,
        response.list
      );
      return forecast;
    } catch (error: any) {
      console.error(error);
      return error;
    }
  }

  private parseCurrentWeather(response: any) {
    const parsedDate = dayjs.unix(response.dt).format('M/D/YYYY');

    const currWeather = new Weather(
      this.city,
      parsedDate,
      response.main.temp,
      response.wind.speed,
      response.main.humidity,
      response.weather[0].icon,
      response.weather[0].description || response.weather[0].main
    );

    return currWeather;
  }

  private buildForecastArray(currentWeather: Weather, weatherData: any[]) {
    const weather: Weather[] = [currentWeather];

    const filteredWeatherData = weatherData.filter((data: any) => {
      return data.dt_txt.includes('12:00:00');
    });

    for (const day of filteredWeatherData) {
      weather.push(
        new Weather(
          this.city,
          dayjs.unix(day.dt).format('M/D/YYYY'),
          day.main.temp,
          day.wind.speed,
          day.main.humidity,
          day.weather[0].icon,
          day.weather[0].description || day.weather[0].main
        )
      );
    }

    return weather;
  }

  async getWeatherForCity(city: string) {
    try {
      this.city = city;
      const coordinates = await this.fetchAndDestructureLocationData();
      if (coordinates) {
        const weather = await this.fetchWeatherData(coordinates);
        return weather;
      }

      throw new Error('Weather data not found');
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}

export default new WeatherService();
