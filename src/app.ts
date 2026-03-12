import { envs } from './config/envs';
import { Server } from './presentation/server';
import { AppRoutes } from './presentation/app-routes';
import { QuotePostgresqlDatasource } from './infrastructure/datasource/quote-postgresql.datasource';
import { QuoteRepositoryImpl } from './infrastructure/repositories/quote.repository-impl';
import { UserPostgresqlDatasource } from './infrastructure/datasource/user-postgresql.datasource';
import { UserRepositoryImpl } from './infrastructure/repositories/user-repository-impl';
import { TwilioService } from './infrastructure/services/twilio.service';
import { SendInProgressQuoteRemindersUseCase } from './application/use-cases/whatsApp/send-in-progress-quote-reminders.use-case';
import { InProgressQuoteRemindersScheduler } from './application/use-cases/whatsApp/in-progress-quote-reminders.scheduler';

(() => {
  main()
})();

async function main() {
  const quoteRepository = new QuoteRepositoryImpl(new QuotePostgresqlDatasource())
  const userRepository = new UserRepositoryImpl(new UserPostgresqlDatasource())
  const reminderUseCase = new SendInProgressQuoteRemindersUseCase(
    quoteRepository,
    userRepository,
    new TwilioService()
  )
  const reminderScheduler = new InProgressQuoteRemindersScheduler(reminderUseCase)

  await new Server({
    port: envs.PORT,
    routes: AppRoutes.routes()
  })
  .start()

  reminderScheduler.start()
}
