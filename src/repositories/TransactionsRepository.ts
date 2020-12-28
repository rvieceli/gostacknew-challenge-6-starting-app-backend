import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const { income, outcome } = await this.createQueryBuilder('transactions')
      .select(
        `sum(case transactions.type when 'outcome' then transactions.value else 0 end)`,
        'outcome',
      )
      .addSelect(
        `sum(case transactions.type when 'income' then transactions.value else 0 end)`,
        'income',
      )
      .getRawOne();

    return {
      income: +income,
      outcome: +outcome,
      total: income - outcome,
    };
  }
}

export default TransactionsRepository;
