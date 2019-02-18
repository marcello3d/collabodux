export enum State {
  waiting,
  resolved,
  rejected,
}
export class PromiseContainer<T> {
  state = State.waiting;
  value?: T;
  reason?: any;
  resolve!: (value?: T) => void;
  reject!: (error: any) => void;
  promise: Promise<T>;

  constructor() {
    this.promise = new Promise<T>((resolve, reject) => {
      this.resolve = (value?: T) => {
        if (this.state === State.waiting) {
          this.state = State.resolved;
          this.value = value;
          resolve(value);
        }
      };
      this.reject = (reason?: any) => {
        if (this.state === State.waiting) {
          this.state = State.rejected;
          this.reason = reason;
          reject(reason);
        }
      };
    });
  }

  get valueOrThrowPromise(): T {
    switch (this.state) {
      case State.waiting:
      default:
        throw this.promise;
      case State.resolved:
        return this.value!;
      case State.rejected:
        throw this.reason;
    }
  }
}
