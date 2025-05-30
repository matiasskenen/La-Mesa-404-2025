import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MeitrePage } from './meitre.page';

describe('MeitrePage', () => {
  let component: MeitrePage;
  let fixture: ComponentFixture<MeitrePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MeitrePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
