import Papa from 'papaparse';

let dictionary = null;

export const getDictionary = async () => {
  if (dictionary) {
    return dictionary;
  }

  const response = await fetch('/ee.csv');
  const csvData = await response.text();

  const { data } = Papa.parse(csvData, { header: true });

  dictionary = new Map(data.map(({ word, definition }) => [word.toLowerCase(), definition]));

  return dictionary;
};