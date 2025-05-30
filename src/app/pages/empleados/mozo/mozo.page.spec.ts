import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MozoPage } from './mozo.page';

describe('MozoPage', () => {
  let component: MozoPage;
  let fixture: ComponentFixture<MozoPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MozoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
