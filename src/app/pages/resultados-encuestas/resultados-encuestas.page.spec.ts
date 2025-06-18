import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ResultadosEncuestasPage } from './resultados-encuestas.page';

describe('ResultadosEncuestasPage', () => {
  let component: ResultadosEncuestasPage;
  let fixture: ComponentFixture<ResultadosEncuestasPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ResultadosEncuestasPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
