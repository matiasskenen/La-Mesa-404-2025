import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EstadoPedidoPage } from './estado-pedido.page';

describe('EstadoPedidoPage', () => {
  let component: EstadoPedidoPage;
  let fixture: ComponentFixture<EstadoPedidoPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(EstadoPedidoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
