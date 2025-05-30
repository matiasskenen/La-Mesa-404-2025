import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BartenderPage } from './bartender.page';

describe('BartenderPage', () => {
  let component: BartenderPage;
  let fixture: ComponentFixture<BartenderPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(BartenderPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
