import { Router } from "express";
import express from 'express';

interface Options {
  port: number,
  routes:Router

}

export class Server {

  private app = express()
  private readonly port:number
  private readonly routes: Router

  constructor(options:Options){
    this.port = options.port ?? 4600
    this.routes = options.routes
  }


  async start(){


    this.app.use( express.json() ); // raw
    this.app.use( express.urlencoded({ extended: true }) ); // x-www-form-urlencoded
    // this.app.use( compression() )


    //routes

    this.app.use(this.routes)

    this.app.listen(this.port, () => {
      console.log(`Server running on port ${ this.port }`);
    });


  }
}