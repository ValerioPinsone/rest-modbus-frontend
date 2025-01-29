import { ChangeDetectionStrategy, Component, OnInit, OnDestroy } from '@angular/core';
import { ModbusService } from '../../services/modbus.service';
import { FormControl, FormGroup, FormArray, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Subscription, interval } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.Default
})
export class HomeComponent implements OnInit, OnDestroy {
  ip = new FormControl('telecameretrend.controlliamo.com');
  port = new FormControl(502);
  slave = new FormControl(250);
  registersForm = new FormGroup({
    registers: new FormArray([
      new FormControl(102),
      new FormControl(1)
    ])
  });
  registers: { address: number, value: any }[] = [];
  private pollingSubscription: Subscription | undefined;

  constructor(private modbusService: ModbusService) { }

  ngOnInit() {
    console.log('HomeComponent initialized');
    this.startPolling();
  }

  ngOnDestroy() {
    this.stopPolling();
  }

  get registersArray() {
    return this.registersForm.get('registers') as FormArray;
  }

  addRegister() {
    this.registersArray.push(new FormControl());
  }

  removeRegister(index: number) {
    this.registersArray.removeAt(index);
  }

  startPolling() {
    this.pollingSubscription = interval(1000) // Polling ogni 1 secondo
      .pipe(
        switchMap(() => this.loadRegisters())
      )
      .subscribe();
  }

  stopPolling() {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
  }

  loadRegisters() {
    this.registers = []; // Resetta i registri prima di ogni polling
    const addresses = this.registersArray.value;
    const requests = addresses.map((address: number) => 
      this.modbusService.readRegister(this.ip.value as any, this.port.value as any, this.slave.value as any, address, 1)
    );
    return requests.forEach((request: { subscribe: (arg0: (data: any) => void) => any; }) => 
      request.subscribe(data => {
        this.registers.push({ address: data.register, value: data.value });
      })
    );
  }

  submitForm() {
    console.log('Form submitted with values:', {
      ip: this.ip.value,
      port: this.port.value,
      slave: this.slave.value,
      registers_list: this.registersArray.value
    });
    this.loadRegisters();
  }
}