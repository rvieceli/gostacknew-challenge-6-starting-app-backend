import { getCustomRepository, In } from 'typeorm';
import fs from 'fs';
import csvParse from 'csv-parse';

import TransactionsRepository from '../repositories/TransactionsRepository';
import CategoriesRepository from '../repositories/CategoriesRepository';

import Transaction from '../models/Transaction';

interface CSVLineTransaction {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class ImportTransactionsService {
  async execute(filePath: string): Promise<Transaction[]> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoriesRepository = getCustomRepository(CategoriesRepository);

    const readCSVStream = fs.createReadStream(filePath);
    const columns = ['title', 'type', 'value', 'category'];
    const parseStream = csvParse({
      delimiter: ',',
      columns,
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });

    const parseCSV = readCSVStream.pipe(parseStream);

    const transactions: CSVLineTransaction[] = [];
    const categories: string[] = [];

    parseCSV.on('data', async line => {
      const { title, type, value, category } = line;

      if (!categories.includes(category)) {
        categories.push(category);
      }
      transactions.push({
        title,
        type,
        category,
        value: +value,
      });
    });

    await new Promise(resolve => {
      parseCSV.on('end', resolve);
    });

    const existingCategories = await categoriesRepository.find({
      where: {
        title: In(categories),
      },
    });

    const existingCategoriesTitle = existingCategories.map(
      ({ title }) => title,
    );

    const categoriesToAdd = categories.filter(
      category => !existingCategoriesTitle.includes(category),
    );

    const newCategories = categoriesRepository.create(
      categoriesToAdd.map(title => ({ title })),
    );

    await categoriesRepository.save(newCategories);

    const oldAndNewCategories = [...existingCategories, ...newCategories];

    const transactionsToAdd = transactionsRepository.create(
      transactions.map(transaction => {
        const { title, type, value, category } = transaction;
        const category_id = oldAndNewCategories.find(
          ({ title: categoryTitle }) => categoryTitle === category,
        )?.id;
        return {
          title,
          type,
          value: +value,
          category_id,
        };
      }),
    );

    return transactionsRepository.save(transactionsToAdd);
  }
}

export default ImportTransactionsService;
