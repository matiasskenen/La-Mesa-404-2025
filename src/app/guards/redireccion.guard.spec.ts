import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { redireccionGuard } from './redireccion.guard';

describe('redireccionGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => redireccionGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
