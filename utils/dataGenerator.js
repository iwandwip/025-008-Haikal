const statusOptions = ["active", "pending", "inactive", "completed", "error"];

const getRandomFloat = (min = 0, max = 1000, decimals = 2) => {
  const value = Math.random() * (max - min) + min;
  return parseFloat(value.toFixed(decimals));
};

const getRandomDateTime = (daysBack = 30) => {
  const now = new Date();
  const randomDays = Math.floor(Math.random() * daysBack);
  const randomHours = Math.floor(Math.random() * 24);
  const randomMinutes = Math.floor(Math.random() * 60);
  const randomSeconds = Math.floor(Math.random() * 60);
  
  const randomDate = new Date(
    now.getTime() - (randomDays * 24 * 60 * 60 * 1000) + 
    (randomHours * 60 * 60 * 1000) + 
    (randomMinutes * 60 * 1000) + 
    (randomSeconds * 1000)
  );
  
  return randomDate.toISOString();
};

const getRandomStatus = () => {
  return statusOptions[Math.floor(Math.random() * statusOptions.length)];
};

export const generateSampleData = () => {
  const datetime = getRandomDateTime();
  const value1 = getRandomFloat(10, 500, 2);
  const value2 = getRandomFloat(1, 100, 2);
  const status = getRandomStatus();

  return {
    datetime,
    value1,
    value2,
    status
  };
};

export const generateBulkData = (count = 10) => {
  const data = [];
  const usedDateTimes = new Set();
  
  for (let i = 0; i < count; i++) {
    let sampleData;
    let attempts = 0;
    
    do {
      sampleData = generateSampleData();
      attempts++;
    } while (usedDateTimes.has(sampleData.datetime) && attempts < 50);
    
    if (!usedDateTimes.has(sampleData.datetime)) {
      usedDateTimes.add(sampleData.datetime);
      data.push(sampleData);
    } else {
      sampleData.datetime = getRandomDateTime(60);
      data.push(sampleData);
    }
  }
  
  return data.sort((a, b) => new Date(b.datetime) - new Date(a.datetime));
};