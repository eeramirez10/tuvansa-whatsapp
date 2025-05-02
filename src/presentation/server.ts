import { Router } from "express";
import express from 'express';
import cors from 'cors'

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

    const HOST = '0.0.0.0';


    this.app.use( express.json() ); // raw
    this.app.use( express.urlencoded({ extended: true }) ); // x-www-form-urlencoded
    this.app.use(cors())
    // this.app.use( compression() )


    //routes

    console.log(process.env.NODE_ENV)

    this.app.use(this.routes)

    this.app.listen(this.port,HOST, () => {
      console.log(`Server running on port ${ this.port }`);
    });


  }
}