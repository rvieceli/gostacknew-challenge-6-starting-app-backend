import { Router } from 'express';
import { getCustomRepository } from 'typeorm';
import multer from 'multer';
import fs from 'fs';

import TransactionsRepository from '../repositories/TransactionsRepository';
import CreateTransactionService from '../services/CreateTransactionService';
import DeleteTransactionService from '../services/DeleteTransactionService';
import ImportTransactionsService from '../services/ImportTransactionsService';

const transactionsRouter = Router();

transactionsRouter.get('/', async (request, response) => {
  const transactionsRepository = getCustomRepository(TransactionsRepository);

  const transactions = await transactionsRepository.find({
    relations: ['category'],
  });
  const balance = await transactionsRepository.getBalance();

  return response.json({
    transactions,
    balance,
  });
});

transactionsRouter.post('/', async (request, response) => {
  const { title, value, type, category } = request.body;

  const createTransaction = new CreateTransactionService();

  const transaction = await createTransaction.execute({
    title,
    value,
    type,
    category,
  });

  return response.json(transaction);
});

transactionsRouter.delete('/:id', async (request, response) => {
  const { id } = request.params;

  const deleteTransaction = new DeleteTransactionService();

  await deleteTransaction.execute(id);

  return response.send();
});

transactionsRouter.post(
  '/import',
  multer({ dest: './tmp' }).single('file'),
  async (request, response) => {
    const { path: filePath } = request.file;
    const importTransactions = new ImportTransactionsService();

    const imports = await importTransactions.execute(filePath);

    fs.unlinkSync(filePath);

    return response.json(imports);
  },
);

export default transactionsRouter;
