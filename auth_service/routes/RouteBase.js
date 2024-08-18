import { Router } from 'express';

export default class RouteBase {
  constructor(path) {
    this.path = path;
    this.router = Router();
  }

  // You can add common methods for all controllers here
}
