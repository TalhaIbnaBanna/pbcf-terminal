import Papa from 'papaparse';

export const parseCSVData = (csvText) => {
  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        try {
          resolve(formatData(results.data));
        } catch (err) {
          reject(err);
        }
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};

const parsePct = (val) => {
  if (typeof val === 'string' && val.includes('%')) {
    return parseFloat(val.replace('%', ''));
  }
  return parseFloat(val) || 0;
};

// Standard Deviation utility
const stdDev = (arr) => {
  if (arr.length <= 1) return 0;
  const mean = arr.reduce((a, b) => a + b) / arr.length;
  return Math.sqrt(arr.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / (arr.length - 1));
};

const formatData = (data) => {
  if (!data || data.length < 3) throw new Error("Invalid CSV structure. Expected Targets, Sectors, and Data rows.");

  const targetRow = data[0];
  const sectorRow = data[1];
  const dataRows = data.slice(2);

  // Identify tickers and metrics
  const headers = Object.keys(targetRow);
  const tickers = headers.filter(k => k !== 'Date' && k !== 'Benchmark' && !k.startsWith('Metric_'));
  
  // Extract Static Metrics
  const fundMetrics = {
    aum: targetRow['Metric_AUM'] || '$100K',
    expectedReturn: targetRow['Metric_ExpectedReturn'] || '9.16%',
    targetVol: targetRow['Metric_TargetVol'] || '12-13%',
    targetSharpe: targetRow['Metric_TargetSharpe'] || '0.70',
    expenseRatio: targetRow['Metric_ExpenseRatio'] || '1.55%'
  };

  // Extract holdings structure
  const holdingsConfig = tickers.map(t => ({
    ticker: t,
    targetWeight: parsePct(targetRow[t]),
    sector: sectorRow[t]
  }));

  // Process Daily Data
  const performanceHistory = [];
  const dailyReturns = [];
  let firstDayValue = null;
  let firstDayBenchmark = null;
  let prevValue = null;

  dataRows.forEach((row, i) => {
    let portfolioValue = 0;
    tickers.forEach(t => {
      portfolioValue += parseFloat(row[t]) || 0;
    });

    const benchmarkValue = parseFloat(row.Benchmark) || 0;

    if (i === 0) {
      firstDayValue = portfolioValue;
      firstDayBenchmark = benchmarkValue;
    } else {
      dailyReturns.push((portfolioValue / prevValue) - 1);
    }

    prevValue = portfolioValue;

    performanceHistory.push({
      date: row.Date,
      portfolioValue: portfolioValue,
      nav: (portfolioValue / firstDayValue) * 10000, // Rebase to $10,000 for chart
      benchmarkValue: benchmarkValue,
      benchmarkNav: (benchmarkValue / firstDayBenchmark) * 10000, // Rebase benchmark
      rawRow: row // Keep raw data for latest KPIs
    });
  });

  const latestRow = performanceHistory[performanceHistory.length - 1];
  const latestRaw = latestRow.rawRow;
  
  // Calculate Returns
  const ytdReturn = ((latestRow.portfolioValue / firstDayValue) - 1) * 100;
  
  // Annualized Volatility (assuming daily data, 252 trading days)
  const dailyVolatility = stdDev(dailyReturns);
  const annualizedVolatility = dailyVolatility * Math.sqrt(252) * 100; 

  // Sharpe Ratio (assuming 0% risk free rate for simplicity)
  const sharpeRatio = dailyVolatility === 0 ? 0 : (ytdReturn / annualizedVolatility);

  const latestKPIs = {
    nav: latestRow.portfolioValue, // Or whatever real NAV representation you want
    ytdReturn: ytdReturn,
    volatility: annualizedVolatility.toFixed(2) + '%',
    sharpeRatio: sharpeRatio.toFixed(2)
  };

  // Calculate live weights
  const totalValue = latestRow.portfolioValue;
  const holdings = holdingsConfig.map(h => {
    const liveVal = parseFloat(latestRaw[h.ticker]) || 0;
    return {
      ...h,
      liveValue: liveVal,
      liveWeight: (liveVal / totalValue) * 100
    };
  });

  // Calculate sleeve drifts
  const uniqueSectors = [...new Set(holdings.map(h => h.sector))];
  const allocations = uniqueSectors.map(sector => {
    const sectorHoldings = holdings.filter(h => h.sector === sector);
    return {
      name: sector,
      target: sectorHoldings.reduce((sum, h) => sum + h.targetWeight, 0),
      live: sectorHoldings.reduce((sum, h) => sum + h.liveWeight, 0)
    };
  });

  return {
    performanceHistory,
    latestKPIs,
    holdings,
    allocations,
    fundMetrics
  };
};
