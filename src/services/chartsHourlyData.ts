interface RawData {
  time: string;
  floorprice: number;
}

export function aggregateHourlyData(data: RawData[]) {
  const candles = [];
  let currentCandle = null;

  for (let i = 0; i < data.length; i++) {
    const entry = data[i];
    const time = new Date(entry.time);
    const timestamp = time.getTime(); // Convert to milliseconds

    const time2 = new Date(entry.time);
    time2.setUTCHours(time.getUTCHours() + 1);
    time2.setUTCMinutes(0); // Reset minutes to 0 to get the start of the hour
    time2.setUTCSeconds(0); // Reset seconds to 0
    time2.setUTCMilliseconds(0); // Reset milliseconds to 0
    const timestamp2 = time2.getTime();

    const open = entry.floorprice;

    // Check if it's a new hour or the first entry
    if (!currentCandle || time.getUTCMinutes() === 0) {
      // Check if there's enough data for the hour
      // const nextHourIndex = i + 4;
      // if (
      //   nextHourIndex >= data.length ||
      //   new Date(data[nextHourIndex].time).getUTCHours() !==
      //     time.getUTCHours() + 1
      // ) {
      //   continue; // Skip if not enough data
      // }

      if (currentCandle) {
        candles.push(currentCandle);
      }
      currentCandle = {
        time: timestamp2,
        open: open,
        high: open,
        low: open,
        close: open,
      };
    } else {
      // Update high, low, close within the same hour
      currentCandle.high = Math.max(currentCandle.high, open);
      currentCandle.low = Math.min(currentCandle.low, open);
      currentCandle.close = open;
    }

    // Check if it's the last entry or a new hour starts next
    if (
      i === data.length - 1 ||
      new Date(data[i + 1].time).getUTCHours() !== time.getUTCHours()
    ) {
      const nextOpen = i === data.length - 1 ? null : data[i + 1].floorprice;

      if (nextOpen !== null) {
        currentCandle.close = nextOpen;
        currentCandle.high = Math.max(currentCandle.high, nextOpen);
        currentCandle.low = Math.min(currentCandle.low, nextOpen);
      }

      candles.push(currentCandle);
      currentCandle = null;
    }
  }

  return candles;
}
