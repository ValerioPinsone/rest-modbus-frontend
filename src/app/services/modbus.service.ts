import { Injectable } from '@angular/core';
import { from } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ModbusService {

  constructor() { }

  host = 'https://rest-modbus-server.onrender.com';


  readRegister = (host: string, port: number, slaveId: number, startAddress: number, quantity: number) => {
    const url = `https://rest-modbus-server.onrender.com/read?ip=${host}&plcPort=${port}&unitId=${slaveId}&register=${startAddress}`;
    const fetchPromise = fetch(url)
      .then(response => response.json());
    return from(fetchPromise);
  }

  writeRegister = (host: string, port: number, slaveId: number, startAddress: number, value: number) => {
    const url = `https://rest-modbus-server.onrender.com/write`;
    const fetchPromise = fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ip: host,
        plcPort: port,
        unitId: slaveId,
        register: startAddress,
        value: value
      })
    }).then(response => response.json());
    return from(fetchPromise);
  }

}
