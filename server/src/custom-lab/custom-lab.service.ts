import { Injectable } from '@nestjs/common';

@Injectable()
export class CustomLabService {
  getSteps() {
    return [];
  }

  getProducts(_slot: string) {
    return [];
  }

  getBuilds(_userId?: string, _guestToken?: string) {
    return [];
  }

  getBuild(_id: string, _userId?: string, _guestToken?: string) {
    return null;
  }

  createBuild(_dto: unknown) {
    return { id: null, message: 'Custom PC Lab is not available in this version.' };
  }

  updateBuild(_id: string, _dto: unknown, _userId?: string, _guestToken?: string) {
    return { id: null, message: 'Custom PC Lab is not available in this version.' };
  }

  deleteBuild(_id: string, _userId?: string, _guestToken?: string) {
    return { ok: false };
  }

  validate(_items: unknown[]) {
    return { valid: true, errors: [], warnings: [], totalTdp: 0, requiredWatts: 0, totalPrice: 0 };
  }
}
