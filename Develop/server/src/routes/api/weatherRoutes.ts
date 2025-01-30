import { Router, type Request, type Response } from 'express';
const router = Router();

import HistoryService from '../../service/historyService.js';
import WeatherService from '../../service/weatherService.js';

router.post('/', (req: Request, res: Response) => {

  //get weather data from city name and save city name to history
  try {
    const name = req.body.cityName;

    WeatherService.getWeatherForCity(name).then((data) => {
      HistoryService.addCity(name);

      res.json(data);
    });
  } catch (err) {
    res.status(500).json(err);
  }
});

//get search history
router.get('/history', async (_req: Request, res: Response) => {
  HistoryService.getCities()
    .then((data) => {
      return res.json(data);
    })
    .catch((err) => {
      res.status(500).json(err);
    });
});

// delete city from search history
router.delete('/history/:id', async (req: Request, res: Response) => {
  try {
    if (!req.params.id) {
      res.status(400).json({ error: 'City is Required' });
      return;
    }

    await HistoryService.deleteCity(req.params.id);
    res.json({ success: 'City removed successfully' });
  } catch (error) {
    res.status(500).json(error);
  }
});

export default router;
