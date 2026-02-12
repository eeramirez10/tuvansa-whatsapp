import { envs } from './config/envs';
import { Server } from './presentation/server';
import { AppRoutes } from './presentation/app-routes';

(() => {
  main()
})();

async function main() {

  

  new Server({
    port: envs.PORT,
    routes: AppRoutes.routes()
  })
  .start()

}