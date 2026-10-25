import { addisTransitProvider, AddisTransitProvider, RouteOption } from './addis-transit.provider.js';

export class RoutingService {
  constructor(private provider: AddisTransitProvider = addisTransitProvider) {}

  public async getRoutes(origin: string, destination: string): Promise<RouteOption[]> {
    return this.provider.findRoutes(origin, destination);
  }
}

export const routingService = new RoutingService();
