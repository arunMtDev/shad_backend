import { Schema, model, Document } from "mongoose";

export interface IPlan extends Document {
  symbol: string;
  floorprice: number;
  time: number;
}

const collectionSchema: Schema<IPlan> = new Schema({
    symbol: { type: String, required: true },
    floorprice: { type: Number, required: true },
    time: { type: Number, required: true },
},{timestamps:true});

export const CollectionModel = model<IPlan>("Collection_chart", collectionSchema); //change to collection
