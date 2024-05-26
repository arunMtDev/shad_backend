import { NextFunction, Request, RequestHandler, Response } from "express";
import CustomResponse from "../middleware/responseActions";
import {
  fetchCollectionTimeseriesData,
  fetchPopularCollectionData,
  getCollectionData,
} from "../services/magicEden.services";
import { aggregateHourlyData } from "../services/chartsHourlyData";
import { symbol } from "joi";
import { CollectionModel } from "../models/collection.model";

export const getPopularCollectionData: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { window = "1d", limit = "12" } = req.query;
    const data = await fetchPopularCollectionData(
      String(window),
      String(limit)
    );
    CustomResponse.success(
      res,
      "Popular Collections fetched successfully",
      data
    );
  } catch (error) {
    console.error("Error fetching Popular Collections:", error);
    CustomResponse.error(res, "Failed to fetch Popular Collections", error);
  }
};

export const getAllCollectionData: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { window = "1d", limit = "120" } = req.query;

    const data = await fetchPopularCollectionData(
      String(window),
      String(limit)
    );

    CustomResponse.success(
      res,
      "Popular Collections fetched successfully",
      data
    );
  } catch (error) {
    console.error("Error fetching Popular Collections:", error);
    CustomResponse.error(res, "Failed to fetch Popular Collections", error);
  }
};

// export const getCollectionTimeseriesData: RequestHandler = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const { symbol, timeframe, startTime, endTime } = req.query;
//     const data = await fetchCollectionTimeseriesData(
//       String(symbol),
//       String(timeframe),
//       String(startTime),
//       String(endTime)
//     );
//     CustomResponse.success(
//       res,
//       "Collections timeseries data fetched successfully",
//       data
//     );
//   } catch (error) {
//     console.error("Error fetching Collection timeseries data:", error);
//     CustomResponse.error(
//       res,
//       "Failed to fetch collection timeseries data",
//       error
//     );
//   }
// };
export const getCronCollectionData = async () => {
  try {
    // const { window = "1d", limit = "120" } = req.query;
    let window = "1d",
      limit = "120";
    const data = await getCollectionData(window, limit);
    for (const item of data) {
      // Create a new document using the CollectionModel
      const newDocument = new CollectionModel({
        symbol: item.symbol,
        floorprice: item.floorPrice,
        time: Date.now(), // Assuming you want to set the current time for each document
      });

      // Save the new document to the database
      await newDocument.save();
      // console.log('Data updated successfully:', newDocument);
    }
  } catch (error) {
    console.error("Error fetching getCronCollectionData:", error);
    // CustomResponse.error(data, "Failed to fetch getCronCollectionData", error);
  }
};

export const getChartsData: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const symbol = req.params.symbol;
    const data: any = await fetchCollectionTimeseriesData(
      String(symbol)
    );

    const candles =   aggregateHourlyData(data);

    const tradingViewData = candles.map((candle) => ({
      time: candle.time,
      open: convertToBTC(candle.open),
      high: convertToBTC(candle.high),
      low: convertToBTC(candle.low),
      close: convertToBTC(candle.close),
      volume: 0,
    }));
   
    CustomResponse.success(
      res,
      `Trading View data fetched successfully,${symbol}`,
      tradingViewData
      // tradingResponse.reverse()
    );
  } catch (error) {
    console.error("Error fetching charts data:", error);
    CustomResponse.error(res, "Failed to fetch data", error);
  }
};

const convertToBTC = (satoshi: number) => {
  return satoshi / 100000000;
};
