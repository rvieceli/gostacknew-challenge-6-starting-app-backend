import { getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';

import TransactionsRepository from '../repositories/TransactionsRepository';

class DeleteTransactionService {
  public async execute(id: string): Promise<void> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const existingTransaction = await transactionsRepository.findOne({ id });

    if (!existingTransaction) {
      throw new AppError('Transaction does not exist.');
    }

    await transactionsRepository.remove(existingTransaction);
  }
}

export default DeleteTransactionService;
