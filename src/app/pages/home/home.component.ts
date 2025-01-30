import { ChangeDetectionStrategy, Component, OnInit, OnDestroy, inject } from '@angular/core';
import { ModbusService } from '../../services/modbus.service';
import { FormControl, FormGroup, FormArray, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Subscription, forkJoin, interval } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, MatTableModule],
  changeDetection: ChangeDetectionStrategy.Default
})
export class HomeComponent implements OnInit, OnDestroy {
  private snackBar = inject(MatSnackBar);
  ip = new FormControl('telecameretrend.controlliamo.com');
  port = new FormControl(502);
  slave = new FormControl(250);
  registersInput: string = '';

  registro = new FormControl();
  valore = new FormControl();

  registers: { address: number, value: any }[] = [];

  private pollingSubscription: Subscription | undefined;

  displayedColumns: string[] = ['registro', 'valore'];
  dataSource: any[] = [];

  constructor(private modbusService: ModbusService) { }

  ngOnInit() {
    console.log('HomeComponent initialized');
    this.startPolling();
  }

  ngOnDestroy() {
    this.stopPolling();
  }

  addRegister() {
    this.registers.push({ address: 0, value: 0 }); // Aggiungi un nuovo registro con valori predefiniti
  }

  removeRegister(index: number) {
    this.registers.splice(index, 1); // Rimuovi il registro all'indice specificato
  }

  startPolling() {
    this.pollingSubscription = interval(1000) // Polling ogni 1 secondo
      .pipe(
        switchMap(async () => this.loadRegisters())
      )
      .subscribe();
  }

  stopPolling() {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
  }

  writeRegister() {
    console.log('Writing register:', this.registro.value, this.valore.value);
    this.modbusService.writeRegister(this.ip.value as any, this.port.value as any, this.slave.value as any, this.registro.value as any, this.valore.value as any)
      .subscribe(response => {
        console.log('Register written:', response);
        if (response.success == true) {
          this.snackBar.open("✅  "+response.message, 'Ok', {
            duration: 3000
          });
          this.valore.setValue(null);
        } else {
          this.snackBar.open("❌  Errore: " + response.message, 'Ok', {
            duration: 3000
          });
        }
      }
      );
  }

  loadRegisters() {
    console.log('Loading registers...');
    console.log('Registers:', this.registers);

    // Assicurati che this.registers contenga dei dati
    if (!this.registers || this.registers.length === 0) {
      console.error('No registers to load.');
      return;
    }

    const requests = this.registers.map(register =>
      this.modbusService.readRegister(this.ip.value as any, this.port.value as any, this.slave.value as any, register.address, 1)
    );

    forkJoin(requests).subscribe(responses => {
      responses.forEach((data, index) => {
        const register = this.registers[index] as any;
        if (register) {
          register.value = data.value; // Aggiorna il valore del registro esistente
        } else {
          this.registers.push({ address: register.address, value: data.value }); // Aggiungi un nuovo registro se non esiste
        }
      });
      
      // Aggiorna la struttura dataSource
      this.dataSource = this.registers.map(reg => ({
        registro: reg.address,
        valore: reg.value
      }));

      console.log('Registers loaded:', this.registers);
      console.log('Data source:', this.dataSource);
    });
  }

  parseRegistersInput() {
    // Rimuove eventuali spazi o virgole in eccesso
    const cleanedInput = this.registersInput.trim().replace(/\s+/g, '').replace(/,+/g, ',');

    if (cleanedInput === '') {
        this.registers = [];
        console.log('Parsed registers:', this.registers);
        return;
    }

    this.registers = cleanedInput.split(',').map(addr => {
      const parsedAddr = parseInt(addr, 10);
      if (isNaN(parsedAddr)) {
        console.error('Invalid register address:', addr);
        return null;
      }
      return { address: parsedAddr, value: 0 };
    }).filter(register => register !== null);

    console.log('Parsed registers:', this.registers);
}

  submitForm() {
    this.parseRegistersInput();
    console.log('Form submitted with values:', {
      ip: this.ip,
      port: this.port,
      slave: this.slave,
      registers: this.registers
    });
    this.loadRegisters();

  }
}