import { TestBed } from '@angular/core/testing';

import { ResolverTokenService } from './resolver-token.service';

describe('ResolverTokenService', () => {
  let service: ResolverTokenService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ResolverTokenService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
