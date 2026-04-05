import type { GameTime, SimulationSpeed } from '@ai-crossing/shared';

export class Clock {
  private day = 1;
  private hour = 6;
  private minute = 0;
  private speed: SimulationSpeed = 1;
  private paused = false;

  advance(dtSeconds: number): void {
    if (this.paused) return;

    const gameMinutesPerSecond = 2 * this.speed;
    const addedMinutes = dtSeconds * gameMinutesPerSecond;
    let totalMinutes = this.hour * 60 + this.minute + addedMinutes;

    while (totalMinutes >= 1440) {
      totalMinutes -= 1440;
      this.day++;
    }

    this.hour = Math.floor(totalMinutes / 60);
    this.minute = Math.floor(totalMinutes % 60);
  }

  getTime(): GameTime {
    return { day: this.day, hour: this.hour, minute: this.minute };
  }

  setSpeed(speed: SimulationSpeed): void {
    this.speed = speed;
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
  }

  setTime(time: GameTime): void {
    this.day = time.day;
    this.hour = time.hour;
    this.minute = time.minute;
  }
}
