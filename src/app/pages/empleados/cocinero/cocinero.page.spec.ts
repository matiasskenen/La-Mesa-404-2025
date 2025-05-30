import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CocineroPage } from './cocinero.page';

describe('CocineroPage', () => {
  let component: CocineroPage;
  let fixture: ComponentFixture<CocineroPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CocineroPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
